"""
Data models for window calculations
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class FrameData(BaseModel):
    width: float = Field(..., description="Frame width in mm")
    height: float = Field(..., description="Frame height in mm")


class SashData(BaseModel):
    width: float
    height: float


class ComponentData(BaseModel):
    element: str
    width: float
    length: float
    quantity: int
    material: str
    preCutLength: Optional[float] = None
    cutLength: Optional[float] = None


class FrameComponents(BaseModel):
    jambs: ComponentData
    head: ComponentData
    sill: ComponentData


class GlazingPane(BaseModel):
    id: int
    width: float
    height: float
    position: str


class GlazingData(BaseModel):
    configuration: str
    totalPanes: int
    panes: List[GlazingPane]


class ShoppingItem(BaseModel):
    material: str
    specification: str
    quantity: float
    unit: str


class WindowData(BaseModel):
    """Complete window specification from frontend"""

    frame: FrameData
    sash: SashData
    components: Dict
    glazing: GlazingData
    shopping: Optional[List[ShoppingItem]] = None
    config: str
    options: Dict = Field(default_factory=dict)


class PDFRequest(BaseModel):
    """Request for PDF generation"""

    windowData: WindowData
    includeDrawings: bool = True
    includePreCutList: bool = True
    includeCutList: bool = True
    includeShoppingList: bool = True
    includeGlazingSpec: bool = True
