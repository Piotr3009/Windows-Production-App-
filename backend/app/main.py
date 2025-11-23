"""FastAPI application entry point serving both API and Frontend."""
from __future__ import annotations

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .database import init_db
from .routers import optimize, projects, reports

# Inicjalizacja bazy danych
init_db()

# Ustalanie głównego katalogu projektu (dwa poziomy wyżej od tego pliku: app -> backend -> ROOT)
BASE_DIR = Path(__file__).resolve().parents[2]

app = FastAPI(
    title="Sash Production Planner",
    description="Integrated Production System",
    version="2.2.0",
)

# Konfiguracja CORS (nadal przydatna)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API ROUTERS ---
app.include_router(projects.router)
app.include_router(optimize.router)
app.include_router(reports.router)

# --- SERWOWANIE FRONTENDU (Static Files) ---

# Montowanie folderów CSS i JS
app.mount("/css", StaticFiles(directory=BASE_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=BASE_DIR / "js"), name="js")

# Opcjonalnie: serwowanie wygenerowanych raportów (jeśli chcesz mieć do nich linki)
output_dir = BASE_DIR / "output"
output_dir.mkdir(exist_ok=True)
app.mount("/output", StaticFiles(directory=output_dir), name="output")

# Główny punkt wejścia - serwowanie index.html
@app.get("/")
async def read_root():
    return FileResponse(BASE_DIR / "index.html")

# Endpoint health check (dla JS api.js)
@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "2.2.0"}