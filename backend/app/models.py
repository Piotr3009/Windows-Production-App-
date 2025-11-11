"""Database and API models for the production planning backend."""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


# -----------------------------
# Pydantic models
# -----------------------------


class Component(BaseModel):
    """Single production component."""

    id: str
    type: str
    section: str
    material: str
    width: float
    thickness: float
    length: float
    quantity: int = 1
    drawing: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("quantity")
    def validate_quantity(cls, value: int) -> int:  # noqa: D417
        if value < 1:
            raise ValueError("quantity must be at least 1")
        return value

    @field_validator("length", "width", "thickness")
    def validate_dimensions(cls, value: float) -> float:  # noqa: D417
        if value <= 0:
            raise ValueError("component dimensions must be positive")
        return value


class ProjectPayload(BaseModel):
    """Serialized data stored along with the project."""

    configuration: Dict[str, Any]
    components: List[Component]
    cut_list: List[Dict[str, Any]] = Field(default_factory=list)
    precut_patterns: List[Dict[str, Any]] = Field(default_factory=list)
    reports: Dict[str, Any] = Field(default_factory=dict)


class ProjectBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(default="Untitled Project")
    client: Optional[str] = None
    project_type: Optional[str] = Field(default=None, alias="type")
    material: Optional[str] = None
    section_sizes: Optional[str] = None
    scheduled_for: Optional[date] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    payload: ProjectPayload


class ProjectCreate(ProjectBase):
    project_id: Optional[str] = None


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = None
    client: Optional[str] = None
    project_type: Optional[str] = Field(default=None, alias="type")
    material: Optional[str] = None
    section_sizes: Optional[str] = None
    scheduled_for: Optional[date] = None
    metadata: Optional[Dict[str, Any]] = None
    payload: Optional[ProjectPayload] = None


class ProjectRead(ProjectBase):
    project_id: str
    created_at: datetime
    updated_at: datetime


class OptimizationComponent(BaseModel):
    id: str
    section: str
    material: str
    length: float
    quantity: int = 1
    metadata: Dict[str, Any] = Field(default_factory=dict)


class OptimizationConfig(BaseModel):
    stock_length: float = Field(default=5900, gt=0)
    kerf: float = Field(default=3, ge=0)
    end_trim: float = Field(default=10, ge=0)
    minimum_piece: float = Field(default=200, gt=0)
    solver: str = Field(default="heuristic")


class OptimizationRequest(BaseModel):
    components: List[OptimizationComponent]
    configuration: OptimizationConfig = Field(default_factory=OptimizationConfig)


class OptimizationBar(BaseModel):
    barId: str
    cuts: List[float]
    waste: float
    utilization: float


class OptimizationGroup(BaseModel):
    section: str
    material: str
    bars: List[OptimizationBar]
    summary: Dict[str, Any]


class OptimizationResponse(BaseModel):
    groups: List[OptimizationGroup]
    configuration: OptimizationConfig


class ReportRequest(BaseModel):
    project: ProjectRead
    optimization: Optional[OptimizationResponse] = None
    include_drawings: bool = True


class ExcelReportRequest(ReportRequest):
    workbook_name: Optional[str] = None
