"""PDF report generation using ReportLab."""
from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path
from typing import List

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (SimpleDocTemplate, Spacer, Paragraph, Table,
                                TableStyle, Image)

from ..models import OptimizationResponse, ProjectRead, ReportRequest


def _decode_image(data_url: str) -> BytesIO:
    header, encoded = data_url.split(",", 1)
    return BytesIO(base64.b64decode(encoded))


def _component_table(project: ProjectRead) -> Table:
    rows: List[List[object]] = [["ID", "Type", "Section", "Material", "Length (mm)", "Qty", "Drawing"]]
    for component in project.payload.components:
        drawing = component.drawing
        if drawing:
            img_data = _decode_image(drawing)
            image = Image(img_data, width=40, height=20)
        else:
            image = "-"
        rows.append(
            [
                component.id,
                component.type,
                component.section,
                component.material,
                f"{component.length:.0f}",
                component.quantity,
                image,
            ]
        )

    table = Table(rows, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
            ]
        )
    )
    return table


def _optimization_table(optimization: OptimizationResponse) -> Table:
    rows: List[List[object]] = [["Bar", "Section", "Material", "Cuts", "Waste", "Utilization %"]]
    for group in optimization.groups:
        for bar in group.bars:
            rows.append(
                [
                    bar.barId,
                    group.section,
                    group.material,
                    ", ".join(f"{cut:.0f}" for cut in bar.cuts),
                    f"{bar.waste:.0f}",
                    f"{bar.utilization * 100:.1f}",
                ]
            )
    table = Table(rows, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5f5")),
            ]
        )
    )
    return table


def build_pdf(report: ReportRequest, output_path: str) -> Path:
    """Generate a multi-section PDF report."""
    styles = getSampleStyleSheet()
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(str(output), pagesize=A4, rightMargin=24, leftMargin=24, topMargin=24, bottomMargin=24)
    story: List[object] = []

    project = report.project
    story.append(Paragraph(f"<b>{project.name}</b>", styles["Title"]))
    story.append(Paragraph(f"Client: {project.client or '—'}", styles["Normal"]))
    story.append(Paragraph(f"Material: {project.material or '—'}", styles["Normal"]))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Cut List", styles["Heading2"]))
    story.append(_component_table(project))
    story.append(Spacer(1, 16))

    if report.optimization and report.optimization.groups:
        story.append(Paragraph("Pre-Pre Cut Patterns", styles["Heading2"]))
        story.append(_optimization_table(report.optimization))

    doc.build(story)
    return output
