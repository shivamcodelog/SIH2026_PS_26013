import os
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path
from dotenv import load_dotenv

# Load root .env
root_dir = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv(root_dir / ".env")

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5433"))
POSTGRES_DB = os.getenv("POSTGRES_DB", "sih26013_landrecords")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")

def get_db_connection():
    """
    Acquire a connection to PostgreSQL/PostGIS.
    """
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        dbname=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        connect_timeout=3
    )

def check_db_health():
    """
    Test connectivity and fetch PostGIS version.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT PostGIS_Version() as postgis, now() as server_time;")
        row = cur.fetchone()
        cur.close()
        conn.close()
        return {
            "connected": True,
            "postgis": row["postgis"],
            "serverTime": row["server_time"].isoformat()
        }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e)
        }
