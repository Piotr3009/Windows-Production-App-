import asyncio
import importlib
import os

import pytest

from fastapi import HTTPException

from backend.app.models import Component, ProjectCreate, ProjectPayload, ProjectUpdate


def setup_test_database(tmp_path):
    db_path = tmp_path / "test.db"
    os.environ["PRODUCTION_DB_PATH"] = str(db_path)
    import backend.app.database as database
    importlib.reload(database)
    database.init_db()
    import backend.app.routers.projects as projects
    importlib.reload(projects)
    return projects


def test_root_endpoint():
    from backend.app.main import root

    payload = asyncio.run(root())
    assert payload["service"] == "Sash Production API"


def test_project_lifecycle(tmp_path):
    projects = setup_test_database(tmp_path)

    payload = ProjectPayload(
        configuration={"key": "2x2"},
        components=[
            Component(
                id="C1",
                type="sash_stile",
                section="63x63",
                material="Softwood",
                width=63,
                thickness=63,
                length=1000,
                quantity=2,
            )
        ],
    )

    project_request = ProjectCreate(
        name="Test Project",
        client="Demo",
        type="Sash",
        material="Softwood",
        payload=payload,
    )

    created = projects.create_project(project_request)
    fetched = projects.get_project(created.project_id)
    assert fetched.project_id == created.project_id

    update_request = ProjectUpdate(name="Updated", payload=payload)
    updated = projects.update_project(created.project_id, update_request)
    assert updated.name == "Updated"

    projects.delete_project(created.project_id)
    with pytest.raises(HTTPException):
        projects.get_project(created.project_id)
