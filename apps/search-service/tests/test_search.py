import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from elasticsearch import AsyncElasticsearch

from app.main import app
from app.services.elasticsearch import INDEX, INDEX_BODY
from app.config import settings

TEST_INDEX = f"{INDEX}_test"

SAMPLE_EVENTS = [
    {
        "id": "evt-1",
        "title": "Coldplay — Music of the Spheres Tour",
        "description": "Show internacional com produção espetacular.",
        "venue": "Estádio do Morumbi",
        "city": "São Paulo",
        "category": "Shows",
        "date_from": "2026-10-15T21:00:00Z",
        "min_price": 320.0,
        "available_seats": 500,
        "published": True,
    },
    {
        "id": "evt-2",
        "title": "Rock in Rio 2026",
        "description": "O maior festival de música do mundo.",
        "venue": "Cidade do Rock",
        "city": "Rio de Janeiro",
        "category": "Shows",
        "date_from": "2026-09-26T20:00:00Z",
        "min_price": 250.0,
        "available_seats": 300,
        "published": True,
    },
    {
        "id": "evt-3",
        "title": "Hamilton — O Musical",
        "description": "O premiado musical da Broadway no Brasil.",
        "venue": "Teatro Bradesco",
        "city": "São Paulo",
        "category": "Teatro",
        "date_from": "2026-07-10T20:00:00Z",
        "min_price": 120.0,
        "available_seats": 200,
        "published": True,
    },
]


@pytest_asyncio.fixture(scope="module")
async def es_client():
    client = AsyncElasticsearch(settings.elasticsearch_url)
    yield client
    await client.close()


@pytest_asyncio.fixture(scope="module", autouse=True)
async def setup_index(es_client):
    # Drop and recreate test index
    if await es_client.indices.exists(index=TEST_INDEX):
        await es_client.indices.delete(index=TEST_INDEX)
    await es_client.indices.create(index=TEST_INDEX, body=INDEX_BODY)

    for event in SAMPLE_EVENTS:
        await es_client.index(index=TEST_INDEX, id=event["id"], document=event, refresh="wait_for")

    yield

    await es_client.indices.delete(index=TEST_INDEX)


@pytest_asyncio.fixture(scope="module")
async def client(setup_index):
    # Override index for tests
    import app.services.elasticsearch as es_module
    original = es_module.INDEX
    es_module.INDEX = TEST_INDEX

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    es_module.INDEX = original


@pytest.mark.asyncio
async def test_search_exact_match(client):
    resp = await client.get("/search?q=Coldplay")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert any("Coldplay" in e["title"] for e in data["data"])


@pytest.mark.asyncio
async def test_search_typo_tolerance(client):
    # "Coldpaly" should still find "Coldplay" via fuzziness: AUTO
    resp = await client.get("/search?q=Coldpaly")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert any("Coldplay" in e["title"] for e in data["data"])


@pytest.mark.asyncio
async def test_search_stemming(client):
    # "musicais" → stemming → "music" should find Hamilton ("musical")
    resp = await client.get("/search?q=musical")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_search_filter_city(client):
    resp = await client.get("/search?q=show&city=São Paulo")
    assert resp.status_code == 200
    data = resp.json()
    assert all(e["city"] == "São Paulo" for e in data["data"])


@pytest.mark.asyncio
async def test_search_filter_category(client):
    resp = await client.get("/search?category=Teatro")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert all(e["category"] == "Teatro" for e in data["data"])


@pytest.mark.asyncio
async def test_search_filter_date_range(client):
    resp = await client.get("/search?date_from=2026-07-01&date_to=2026-08-31")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    for event in data["data"]:
        assert event["date_from"] >= "2026-07-01"
        assert event["date_from"] <= "2026-08-31T23:59:59Z"


@pytest.mark.asyncio
async def test_search_pagination(client):
    resp1 = await client.get("/search?q=&limit=1&page=1")
    resp2 = await client.get("/search?q=&limit=1&page=2")
    assert resp1.status_code == 200
    assert resp2.status_code == 200
    ids1 = [e["id"] for e in resp1.json()["data"]]
    ids2 = [e["id"] for e in resp2.json()["data"]]
    assert ids1 != ids2


@pytest.mark.asyncio
async def test_autocomplete_prefix(client):
    resp = await client.get("/search/autocomplete?q=Cold")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["suggestions"]) >= 1
    assert any("Coldplay" in s for s in data["suggestions"])


@pytest.mark.asyncio
async def test_autocomplete_no_results(client):
    resp = await client.get("/search/autocomplete?q=zzzzz")
    assert resp.status_code == 200
    assert resp.json()["suggestions"] == []
