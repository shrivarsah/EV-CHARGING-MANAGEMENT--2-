import uvicorn
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.seed import seed_database
from app.routers import (
    auth, stations, chargers, reservations,
    sessions, payments, notifications, admin, metrics
)

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ev_metrics_app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed EV data
    logger.info("Initializing database schema...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database schema: {e}")

    # Seed EV charging sample entities
    try:
        with SessionLocal() as db:
            seed_database(db)
    except Exception as e:
        logger.error(f"Error seeding database: {e}")

    yield

    # Shutdown
    logger.info("Shutting down EV Charging & Metrics application.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise EV Charging Station Network & Software Quality Metrics Dashboard",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(stations.router, prefix=api_v1)
app.include_router(chargers.router, prefix=api_v1)
app.include_router(reservations.router, prefix=api_v1)
app.include_router(sessions.router, prefix=api_v1)
app.include_router(payments.router, prefix=api_v1)
app.include_router(notifications.router, prefix=api_v1)
app.include_router(admin.router, prefix=api_v1)
app.include_router(metrics.router, prefix=api_v1)


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": api_v1
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "UP",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000
    )