"""Compatibility entry point for running the TrackPlay API locally."""

# Supports both `cd backend && uvicorn main:app` and
# `uvicorn backend.main:app` from the repository root.
try:
    from app.main import app
except ModuleNotFoundError:
    from backend.app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
