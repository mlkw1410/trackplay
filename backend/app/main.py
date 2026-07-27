"""FastAPI application assembly."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import tracking, videos
from .core.config import (
    CORS_ALLOW_CREDENTIALS,
    CORS_ALLOW_HEADERS,
    CORS_ALLOW_METHODS,
    CORS_ORIGINS,
)
from .core.paths import (
    BACKEND_DIR,
    DATA_DIR,
    OUTPUT_DIR,
    ROOT_DIR,
    UPLOAD_DIR,
    ensure_data_directories,
)


def create_app() -> FastAPI:
    ensure_data_directories()

    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=CORS_ALLOW_CREDENTIALS,
        allow_methods=CORS_ALLOW_METHODS,
        allow_headers=CORS_ALLOW_HEADERS,
    )

    app.include_router(videos.router)
    app.include_router(tracking.router)

    @app.get("/")
    def read_root():
        return {"message": "TrackPlay API is running"}

    return app


app = create_app()

print(f"\n{'=' * 60}")
print(f"BACKEND_DIR:  {BACKEND_DIR}")
print(f"ROOT_DIR:     {ROOT_DIR}")
print(f"DATA_DIR:     {DATA_DIR}")
print(f"UPLOAD_DIR:   {UPLOAD_DIR}")
print(f"OUTPUT_DIR:   {OUTPUT_DIR}")
print(f"{'=' * 60}\n")
