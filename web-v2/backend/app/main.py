from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.routers import auth, categories, customers, dashboard, products, purchases, reports, sales, suppliers, users
from app.core.config import get_settings
from app.db.migrate import run_safe_migrations
from app.db.session import engine

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    run_safe_migrations()
    yield


app = FastAPI(
    title=settings.app_name,
    version="2.0.0",
    description="REST API for the POS & Inventory Management Information System.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (auth, dashboard, products, categories, customers, suppliers, users, sales, purchases, reports):
    app.include_router(module.router, prefix=settings.api_prefix)


@app.get("/health", tags=["Health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.get(f"{settings.api_prefix}/health/database", tags=["Health"])
def database_health() -> dict[str, str]:
    with Session(engine) as db:
        db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "reachable"}

