"""Project management endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from ..database import get_connection, row_to_dict, serialize_metadata, serialize_payload
from ..models import ProjectCreate, ProjectPayload, ProjectRead, ProjectUpdate

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _row_to_schema(row) -> ProjectRead:
    data = row_to_dict(row)
    payload = ProjectPayload.model_validate(data["payload"])
    created_at = datetime.fromisoformat(data["created_at"])
    updated_at = datetime.fromisoformat(data["updated_at"])
    scheduled = datetime.fromisoformat(data["scheduled_for"]).date() if data.get("scheduled_for") else None
    return ProjectRead(
        project_id=data["project_id"],
        name=data["name"],
        client=data.get("client"),
        project_type=data.get("project_type"),
        material=data.get("material"),
        section_sizes=data.get("section_sizes"),
        scheduled_for=scheduled,
        metadata=data.get("metadata_blob", {}),
        payload=payload,
        created_at=created_at,
        updated_at=updated_at,
    )


@router.get("", response_model=List[ProjectRead])
def list_projects() -> List[ProjectRead]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM projects ORDER BY datetime(created_at) DESC").fetchall()
        return [_row_to_schema(row) for row in rows]


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: str) -> ProjectRead:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM projects WHERE project_id = ?", (project_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return _row_to_schema(row)


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(project: ProjectCreate) -> ProjectRead:
    project_id = project.project_id or str(uuid4())
    payload_json = serialize_payload(project.payload.model_dump(by_alias=True))
    metadata_json = serialize_metadata(project.metadata)
    scheduled_for = project.scheduled_for.isoformat() if project.scheduled_for else None

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO projects (
                project_id, name, client, project_type, material, section_sizes,
                scheduled_for, metadata_blob, payload
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                project_id,
                project.name,
                project.client,
                project.project_type,
                project.material,
                project.section_sizes,
                scheduled_for,
                metadata_json,
                payload_json,
            ),
        )
        row = conn.execute("SELECT * FROM projects WHERE project_id = ?", (project_id,)).fetchone()
        return _row_to_schema(row)


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(project_id: str, update: ProjectUpdate) -> ProjectRead:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM projects WHERE project_id = ?", (project_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        data = row_to_dict(row)
        payload = update.payload.model_dump(by_alias=True) if update.payload else data["payload"]
        metadata = update.metadata if update.metadata is not None else data.get("metadata_blob", {})

        conn.execute(
            """
            UPDATE projects SET
                name = ?,
                client = ?,
                project_type = ?,
                material = ?,
                section_sizes = ?,
                scheduled_for = ?,
                metadata_blob = ?,
                payload = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE project_id = ?
            """,
            (
                update.name or data["name"],
                update.client if update.client is not None else data.get("client"),
                update.project_type if update.project_type is not None else data.get("project_type"),
                update.material if update.material is not None else data.get("material"),
                update.section_sizes if update.section_sizes is not None else data.get("section_sizes"),
                update.scheduled_for.isoformat() if update.scheduled_for else data.get("scheduled_for"),
                serialize_metadata(metadata),
                serialize_payload(payload),
                project_id,
            ),
        )
        updated = conn.execute("SELECT * FROM projects WHERE project_id = ?", (project_id,)).fetchone()
        return _row_to_schema(updated)


@router.delete("/{project_id}")
def delete_project(project_id: str) -> None:
    with get_connection() as conn:
        result = conn.execute("DELETE FROM projects WHERE project_id = ?", (project_id,))
        if result.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")


@router.post("/{project_id}/duplicate", response_model=ProjectRead)
def duplicate_project(project_id: str) -> ProjectRead:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM projects WHERE project_id = ?", (project_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        data = row_to_dict(row)
        new_id = str(uuid4())
        conn.execute(
            """
            INSERT INTO projects (
                project_id, name, client, project_type, material, section_sizes,
                scheduled_for, metadata_blob, payload
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                new_id,
                f"{data['name']} (Copy)",
                data.get("client"),
                data.get("project_type"),
                data.get("material"),
                data.get("section_sizes"),
                data.get("scheduled_for"),
                serialize_metadata(data.get("metadata_blob", {})),
                serialize_payload(data.get("payload", {})),
            ),
        )
        duplicate = conn.execute("SELECT * FROM projects WHERE project_id = ?", (new_id,)).fetchone()
        return _row_to_schema(duplicate)
