"""FastAPI application entry point for the production planning backend."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import optimize, projects, reports

init_db()

app = FastAPI(
    title="Sash Production API",
    description="Endpoints for sash window planning, optimisation and reporting.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(optimize.router)
app.include_router(reports.router)


@app.get("/")
async def root() -> dict:
    return {
        "service": "Sash Production API",
        "version": "2.0.0",
        "endpoints": {
            "projects": "/api/projects",
            "optimize": "/api/optimize",
            "export_pdf": "/api/export/pdf",
            "export_excel": "/api/export/excel",
        },
    }
