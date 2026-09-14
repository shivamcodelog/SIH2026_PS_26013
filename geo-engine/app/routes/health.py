from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    """
    Health check endpoint returning service status.
    Identifies the service as the FastAPI Geospatial Engine.
    """
    return {
        "success": True,
        "service": "geo-engine",
        "type": "FastAPI Geospatial Engine",
        "status": "online",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
