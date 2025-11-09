"""
Professional PDF generation with technical drawings
Uses ReportLab + Matplotlib
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    PageBreak, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import matplotlib

matplotlib.use('Agg')

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from io import BytesIO
from datetime import datetime

from .models import WindowData


def generate_window_pdf(
    window_data: WindowData,
    output_path: str,
    include_drawings: bool = True,
    include_precut: bool = True,
    include_cut: bool = True,
    include_shopping: bool = True,
    include_glazing: bool = True
):
    """
    Generate complete professional PDF
    """
    # Create PDF document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm
    )

    # Container for content
    story = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=12,
        alignment=TA_CENTER
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#333333'),
        spaceAfter=10,
        spaceBefore=15
    )

    # PAGE 1: OVERVIEW + DRAWING
    story.append(Paragraph("SASH WINDOW SPECIFICATION", title_style))
    story.append(Spacer(1, 10 * mm))

    # Project info
    info_data = [
        ['Project Information', ''],
        ['Date:', datetime.now().strftime("%Y-%m-%d %H:%M")],
        ['Configuration:', window_data.config],
        ['Frame Width:', f"{window_data.frame.width}mm"],
        ['Frame Height:', f"{window_data.frame.height}mm"],
        ['Sash Width:', f"{window_data.sash.width}mm"],
        ['Sash Height:', f"{window_data.sash.height}mm"],
    ]

    info_table = Table(info_data, colWidths=[80 * mm, 80 * mm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f0f0')])
    ]))
    story.append(info_table)
    story.append(Spacer(1, 10 * mm))

    # Technical Drawing
    if include_drawings:
        story.append(Paragraph("Technical Drawing", heading_style))
        drawing_img = create_technical_drawing(window_data)
        story.append(drawing_img)
        story.append(Spacer(1, 5 * mm))

    story.append(PageBreak())

    # PAGE 2: PRE-CUT LIST
    if include_precut:
        story.append(Paragraph("PRE-CUT LIST", heading_style))
        story.append(Spacer(1, 5 * mm))
        precut_table = create_precut_table(window_data)
        story.append(precut_table)
        story.append(PageBreak())

    # PAGE 3: CUT LIST
    if include_cut:
        story.append(Paragraph("CUT LIST (Final Dimensions)", heading_style))
        story.append(Spacer(1, 5 * mm))
        cut_table = create_cut_table(window_data)
        story.append(cut_table)
        story.append(PageBreak())

    # PAGE 4: SHOPPING LIST
    if include_shopping:
        story.append(Paragraph("SHOPPING LIST", heading_style))
        story.append(Spacer(1, 5 * mm))
        shopping_table = create_shopping_table(window_data)
        story.append(shopping_table)
        story.append(PageBreak())

    # PAGE 5: GLAZING SPECIFICATION
    if include_glazing:
        story.append(Paragraph("GLAZING SPECIFICATION", heading_style))
        story.append(Spacer(1, 5 * mm))
        glazing_table = create_glazing_table(window_data)
        story.append(glazing_table)

    # Build PDF
    doc.build(story)


def create_technical_drawing(window_data: WindowData):
    """
    Create technical drawing using Matplotlib
    Returns ReportLab Image object
    """
    # Create figure
    fig, ax = plt.subplots(figsize=(8, 10))

    # Get dimensions
    frame_w = window_data.frame.width
    frame_h = window_data.frame.height
    sash_w = window_data.sash.width
    sash_h = window_data.sash.height

    # Scale to fit
    max_dim = max(frame_w, frame_h)
    scale = 200 / max_dim  # Scale to 200mm canvas

    fw = frame_w * scale
    fh = frame_h * scale
    sw = sash_w * scale
    sh = sash_h * scale

    # Center on canvas
    offset_x = (250 - fw) / 2
    offset_y = (300 - fh) / 2

    # Draw Frame (outer rectangle)
    frame_rect = patches.Rectangle(
        (offset_x, offset_y), fw, fh,
        linewidth=3,
        edgecolor='#2c3e50',
        facecolor='#ecf0f1',
        label='Frame'
    )
    ax.add_patch(frame_rect)

    # Draw Sash (inner rectangle)
    sash_offset_x = offset_x + (fw - sw) / 2
    sash_offset_y = offset_y + (fh - sh) / 2
    sash_rect = patches.Rectangle(
        (sash_offset_x, sash_offset_y), sw, sh,
        linewidth=2,
        edgecolor='#34495e',
        facecolor='#bdc3c7',
        label='Sash'
    )
    ax.add_patch(sash_rect)

    # Draw Glazing bars (for 2x2 configuration)
    if window_data.config == '2x2':
        # Vertical bar
        v_bar_x = sash_offset_x + sw / 2
        ax.plot([v_bar_x, v_bar_x], [sash_offset_y, sash_offset_y + sh],
                'k-', linewidth=1.5, label='Glazing Bar')

        # Horizontal bar
        h_bar_y = sash_offset_y + sh / 2
        ax.plot([sash_offset_x, sash_offset_x + sw], [h_bar_y, h_bar_y],
                'k-', linewidth=1.5)

    # Add dimensions as text
    # Frame width dimension
    ax.annotate('', xy=(offset_x + fw, offset_y - 10), xytext=(offset_x, offset_y - 10),
                arrowprops=dict(arrowstyle='<->', color='red', lw=1.5))
    ax.text(offset_x + fw / 2, offset_y - 15, f'{frame_w}mm',
            ha='center', va='top', fontsize=10, color='red', weight='bold')

    # Frame height dimension
    ax.annotate('', xy=(offset_x - 10, offset_y + fh), xytext=(offset_x - 10, offset_y),
                arrowprops=dict(arrowstyle='<->', color='red', lw=1.5))
    ax.text(offset_x - 15, offset_y + fh / 2, f'{frame_h}mm',
            ha='right', va='center', fontsize=10, color='red', weight='bold', rotation=90)

    # Sash dimensions
    ax.text(sash_offset_x + sw / 2, sash_offset_y + sh / 2,
            f'Sash\n{sash_w}×{sash_h}mm',
            ha='center', va='center', fontsize=9, weight='bold',
            bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

    # Configure axes
    ax.set_xlim(0, 250)
    ax.set_ylim(0, 300)
    ax.set_aspect('equal')
    ax.axis('off')
    ax.set_title('Technical Drawing - Front View', fontsize=14, weight='bold', pad=20)

    # Save to BytesIO
    img_buffer = BytesIO()
    plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
    plt.close()
    img_buffer.seek(0)

    # Return ReportLab Image
    return Image(img_buffer, width=160 * mm, height=200 * mm)


def create_precut_table(window_data: WindowData):
    """Create Pre-cut list table"""
    data = [['Element', 'Width (mm)', 'Length (mm)', 'Qty', 'Material']]

    # Frame components
    frame_comps = window_data.components.get('frame', {})
    for comp_name in ['jambs', 'head', 'sill']:
        if comp_name in frame_comps:
            comp = frame_comps[comp_name]
            data.append([
                comp['element'],
                str(comp['width']),
                str(comp.get('preCutLength', comp['length'])),
                str(comp['quantity']),
                comp['material']
            ])

    # Create table
    table = Table(data, colWidths=[50 * mm, 30 * mm, 30 * mm, 20 * mm, 40 * mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')])
    ]))

    return table


def create_cut_table(window_data: WindowData):
    """Create Cut list table (final dimensions)"""
    data = [['Element', 'Width (mm)', 'Length (mm)', 'Qty', 'Material', 'Notes']]

    # Frame components
    frame_comps = window_data.components.get('frame', {})
    for comp_name in ['jambs', 'head', 'sill']:
        if comp_name in frame_comps:
            comp = frame_comps[comp_name]
            data.append([
                comp['element'],
                str(comp['width']),
                str(comp.get('cutLength', comp['length'])),
                str(comp['quantity']),
                comp['material'],
                'After deductions'
            ])

    table = Table(data, colWidths=[40 * mm, 25 * mm, 25 * mm, 15 * mm, 30 * mm, 35 * mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#16a085')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#e8f8f5')])
    ]))

    return table


def create_shopping_table(window_data: WindowData):
    """Create Shopping list table"""
    data = [['Material', 'Specification', 'Quantity', 'Unit']]

    # Add shopping items if available
    if window_data.shopping:
        for item in window_data.shopping:
            data.append([
                item.material,
                item.specification,
                str(item.quantity),
                item.unit
            ])
    else:
        # Default if not provided
        data.append(['Timber', 'Hardwood 69x95mm', 'TBD', 'meters'])
        data.append(['Glass', f'{window_data.glazing.totalPanes} panes', 'TBD', 'units'])

    table = Table(data, colWidths=[50 * mm, 60 * mm, 30 * mm, 30 * mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e67e22')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fef5e7')])
    ]))

    return table


def create_glazing_table(window_data: WindowData):
    """Create Glazing specification table"""
    data = [['Pane #', 'Width (mm)', 'Height (mm)', 'Position', 'Type']]

    glazing_type = window_data.options.get('glazingType', '4mm Clear')

    for pane in window_data.glazing.panes:
        data.append([
            f"#{pane.id}",
            f"{pane.width:.1f}",
            f"{pane.height:.1f}",
            pane.position,
            glazing_type
        ])

    table = Table(data, colWidths=[25 * mm, 30 * mm, 30 * mm, 40 * mm, 45 * mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#ebf5fb')])
    ]))

    return table
