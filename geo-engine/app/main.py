import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.health import router as health_router
from app.routes.ingest import router as ingest_router

app = FastAPI(
    title="SIH26013 Geospatial Engine",
    description="FastAPI service for intelligent spatial normalization, entity matching, and conflict detection.",
    version="1.0.0",
)

# CORS Middleware
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health_router)
app.include_router(ingest_router)

@app.get("/")
def root():
    return {
        "message": "SIH26013 FastAPI Geospatial Engine",
        "docs": "/docs",
        "health": "/health",
        "ingest": "/ingest"
    }

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("GEO_ENGINE_HOST", "127.0.0.1")
    port = int(os.getenv("GEO_ENGINE_PORT", "8000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
