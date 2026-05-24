from typing import Optional
from fastapi import APIRouter, Query, Request

from app.services.elasticsearch import INDEX

router = APIRouter()


@router.get("/search")
async def search(
    request: Request,
    q: str = Query(default="", description="Texto de busca"),
    city: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    date_from: Optional[str] = Query(default=None),
    date_to: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
):
    client = request.app.state.es
    from_offset = (page - 1) * limit

    must_clauses = []
    if q:
        must_clauses.append({
            "multi_match": {
                "query": q,
                "fields": ["title^3", "description", "venue"],
                "fuzziness": "AUTO",
                "operator": "and",
            }
        })
    else:
        must_clauses.append({"match_all": {}})

    filters = [{"term": {"published": True}}]
    if city:
        filters.append({"term": {"city": city}})
    if category:
        filters.append({"term": {"category": category}})
    if date_from or date_to:
        date_range: dict = {}
        if date_from:
            date_range["gte"] = date_from
        if date_to:
            date_range["lte"] = date_to
        filters.append({"range": {"date_from": date_range}})

    body = {
        "from": from_offset,
        "size": limit,
        "query": {"bool": {"must": must_clauses, "filter": filters}},
        "sort": [{"_score": "desc"}, {"date_from": "asc"}],
    }

    resp = await client.search(index=INDEX, body=body)
    hits = resp["hits"]
    total = hits["total"]["value"]
    events = [{"id": h["_id"], **h["_source"]} for h in hits["hits"]]

    return {
        "data": events,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, -(-total // limit)),
    }


@router.get("/search/autocomplete")
async def autocomplete(
    request: Request,
    q: str = Query(default="", min_length=1),
):
    client = request.app.state.es

    if not q:
        return {"suggestions": []}

    body = {
        "size": 5,
        "_source": ["title"],
        "query": {
            "match": {
                "title.suggest": {
                    "query": q,
                    "operator": "and",
                }
            }
        },
    }

    resp = await client.search(index=INDEX, body=body)
    suggestions = [h["_source"]["title"] for h in resp["hits"]["hits"]]

    return {"suggestions": suggestions}
