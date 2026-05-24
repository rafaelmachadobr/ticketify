from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.routers.search import router as search_router
from app.services.elasticsearch import get_client, ensure_index
from app.telemetry import setup_telemetry


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = get_client()
    app.state.es = client
    await ensure_index(client)
    yield
    await client.close()


app = FastAPI(title="Search Service", version="1.0.0", lifespan=lifespan)

setup_telemetry(app)

app.include_router(search_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.service_name}
