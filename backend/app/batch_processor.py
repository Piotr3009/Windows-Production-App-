"""Batch processing utilities"""

from datetime import datetime
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from .models import WindowData


def generate_batch_pdf(windows: Iterable[WindowData], output_path: str, title: str | None = None) -> str:
    """Generate a consolidated PDF summary for multiple windows."""

    doc_title = title or "Batch Window Specification"
    writer = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    for index, window in enumerate(windows, start=1):
        if index > 1:
            writer.showPage()

        writer.setTitle(doc_title)
        writer.setFont('Helvetica-Bold', 18)
        writer.drawString(40, height - 60, f"{doc_title}")

        writer.setFont('Helvetica', 11)
        writer.setFillColor(colors.HexColor('#555555'))
        writer.drawString(40, height - 80, datetime.now().strftime('%Y-%m-%d %H:%M'))

        writer.setFillColor(colors.black)
        writer.setFont('Helvetica-Bold', 14)
        writer.drawString(40, height - 110, f"Window {index}: {window.config}")

        writer.setFont('Helvetica', 12)
        y = height - 140
        writer.drawString(40, y, f"Frame: {window.frame.width:.0f} × {window.frame.height:.0f} mm")
        y -= 18
        writer.drawString(40, y, f"Sash: {window.sash.width:.0f} × {window.sash.height:.0f} mm")
        y -= 18
        writer.drawString(40, y, f"Glazing: {window.glazing.totalPanes} panes ({window.glazing.configuration})")
        y -= 24

        writer.setFont('Helvetica-Bold', 12)
        writer.drawString(40, y, 'Panes')
        writer.setFont('Helvetica', 11)
        y -= 18

        column_width = 200
        column = 0
        for pane in window.glazing.panes:
            if y < 80:
                column += 1
                y = height - 200
            x_offset = 40 + column * column_width
            writer.drawString(x_offset, y, f"#{pane.id}: {pane.width:.1f} × {pane.height:.1f} mm")
            y -= 16

        if window.shopping:
            y = min(y, height - 200)
            writer.setFont('Helvetica-Bold', 12)
            writer.drawString(40, y, 'Shopping Summary')
            writer.setFont('Helvetica', 11)
            y -= 18
            for item in window.shopping[:8]:
                writer.drawString(40, y, f"- {item.material}: {item.quantity} {item.unit} ({item.specification})")
                y -= 16
                if y < 60:
                    break

    writer.save()
    return output_path
