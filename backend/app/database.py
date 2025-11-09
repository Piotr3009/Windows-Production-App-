"""Placeholder database utilities for future expansion."""

from typing import Any, Dict, List, Optional

_FAKE_DB: Dict[str, Dict[str, Any]] = {}


def save_project(project_id: str, payload: Dict[str, Any]) -> None:
    _FAKE_DB[project_id] = payload


def load_project(project_id: str) -> Optional[Dict[str, Any]]:
    return _FAKE_DB.get(project_id)


def list_projects() -> List[Dict[str, Any]]:
    return list(_FAKE_DB.values())
