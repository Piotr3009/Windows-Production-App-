"""Lightweight SQLite persistence for the production planner."""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
import os
from pathlib import Path
from typing import Any, Dict, Generator

DEFAULT_DB = Path(__file__).resolve().parent.parent / "data" / "production.db"
DATABASE_PATH = Path(os.getenv("PRODUCTION_DB_PATH", DEFAULT_DB))
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id TEXT UNIQUE,
                name TEXT,
                client TEXT,
                project_type TEXT,
                material TEXT,
                section_sizes TEXT,
                scheduled_for TEXT,
                metadata_blob TEXT,
                payload TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


@contextmanager
def get_connection() -> Generator[sqlite3.Connection, None, None]:
    conn = _connect()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    data = dict(row)
    if data.get("metadata_blob"):
        data["metadata_blob"] = json.loads(data["metadata_blob"])
    else:
        data["metadata_blob"] = {}
    if data.get("payload"):
        data["payload"] = json.loads(data["payload"])
    else:
        data["payload"] = {}
    return data


def serialize_payload(payload: Dict[str, Any]) -> str:
    return json.dumps(payload)


def serialize_metadata(metadata: Dict[str, Any] | None) -> str:
    return json.dumps(metadata or {})
