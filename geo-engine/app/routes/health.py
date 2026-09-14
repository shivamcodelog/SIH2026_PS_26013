from fastapi import APIRouter
from datetime import datetime, timezone
from app.utils.db import check_db_health

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    """
    Health check endpoint returning service status and database/PostGIS availability.
    """
    db_status = check_db_health()
    return {
        "success": True,
        "service": "geo-engine",
        "type": "FastAPI Geospatial Engine",
        "status": "online",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status
    }
