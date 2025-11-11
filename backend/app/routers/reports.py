"""Reporting endpoints for PDF and Excel exports."""
from __future__ import annotations

from datetime import datetime
from pathlib import Path
import uuid

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..models import ExcelReportRequest, ReportRequest
from ..reports.excel import build_workbook
from ..reports.pdf import build_pdf

router = APIRouter(prefix="/api/export", tags=["reports"])
OUTPUT_DIR = Path(__file__).resolve().parents[2] / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/pdf")
async def export_pdf(request: ReportRequest):
    """Generate the PDF export for a project."""
    try:
        filename = f"project_{request.project.project_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        path = build_pdf(request, str(OUTPUT_DIR / filename))
        return FileResponse(path, filename=filename, media_type="application/pdf")
    except Exception as exc:  # pragma: no cover - file I/O
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}") from exc


@router.post("/excel")
async def export_excel(request: ExcelReportRequest):
    """Generate an Excel workbook export."""
    try:
        filename = request.workbook_name or f"project_{uuid.uuid4().hex}.xlsx"
        path = build_workbook(request, str(OUTPUT_DIR / filename))
        return FileResponse(
            path,
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    except Exception as exc:  # pragma: no cover - file I/O
        raise HTTPException(status_code=500, detail=f"Excel generation failed: {exc}") from exc
