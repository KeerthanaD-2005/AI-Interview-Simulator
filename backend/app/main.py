import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import PROJECT_ROOT  # noqa: F401  loads environment variables
from app.database.database import init_db
from app.routes.auth import router as auth_router
from app.routes.interviews import router as interviews_router
from app.schemas.health import HealthResponse

frontend_origin_env = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
allowed_origins = [o.strip() for o in frontend_origin_env.split(",") if o.strip()]
for default_local in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
    if default_local not in allowed_origins:
        allowed_origins.append(default_local)

cors_regex = os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app|https://.*\.netlify\.app|https://.*\.onrender\.com")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if not os.getenv("SECRET_KEY"):
        # Provide a default dev fallback if not set, but log warning
        os.environ["SECRET_KEY"] = "super-secret-default-key-change-in-production-12345678"
    init_db()
    yield


app = FastAPI(
    title="AI Interview Simulator API",
    description="Backend for the voice-based AI interview practice platform.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=cors_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(interviews_router)


@app.get("/api/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        message="AI Interview Simulator API is running",
    )
