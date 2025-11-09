"""
FastAPI Backend for Sash Window Application
Handles PDF generation only - all calculations in frontend
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
import os
from datetime import datetime
import uuid

from .models import PDFRequest
from .pdf_generator import generate_window_pdf

# Initialize FastAPI
app = FastAPI(
    title="Sash Window API",
    description="Backend for generating professional PDF reports",
    version="1.0.0"
)

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5500").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Output directory
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "../output"))
OUTPUT_DIR.mkdir(exist_ok=True, parents=True)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Sash Window API",
        "version": "1.0.0",
        "endpoints": {
            "pdf": "/api/export/pdf",
            "health": "/health"
        }
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "output_dir": str(OUTPUT_DIR),
        "output_dir_writable": OUTPUT_DIR.exists() and os.access(OUTPUT_DIR, os.W_OK)
    }


@app.post("/api/export/pdf")
async def export_pdf(request: PDFRequest):
    """
    Generate professional PDF from window data

    Input: WindowData (from frontend calculations)
    Output: PDF file download
    """
    try:
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_id = str(uuid.uuid4())[:8]
        filename = f"window_spec_{timestamp}_{file_id}.pdf"
        filepath = OUTPUT_DIR / filename

        # Generate PDF
        generate_window_pdf(
            window_data=request.windowData,
            output_path=str(filepath),
            include_drawings=request.includeDrawings,
            include_precut=request.includePreCutList,
            include_cut=request.includeCutList,
            include_shopping=request.includeShoppingList,
            include_glazing=request.includeGlazingSpec
        )

        # Return file
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF generation failed: {str(e)}"
        )


@app.delete("/api/cleanup")
async def cleanup_old_files(older_than_hours: int = 24):
    """
    Clean up old PDF files
    Optional endpoint for maintenance
    """
    try:
        count = 0
        cutoff = datetime.now().timestamp() - (older_than_hours * 3600)

        for file in OUTPUT_DIR.glob("*.pdf"):
            if file.stat().st_mtime < cutoff:
                file.unlink()
                count += 1

        return {
            "status": "success",
            "files_deleted": count
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cleanup failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
