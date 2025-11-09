# Sash Window Backend - Python FastAPI

## Installation

1. Create virtual environment:
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env if needed
```

## Running

Development:
```bash
python -m app.main
```

Or with uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server will start at: http://localhost:8000

## API Endpoints

### Health Check
````
GET /
GET /health
````

### PDF Generation
````
POST /api/export/pdf
Content-Type: application/json

Body: {
    "windowData": { ... },
    "includeDrawings": true,
    "includePreCutList": true,
    "includeCutList": true,
    "includeShoppingList": true,
    "includeGlazingSpec": true
}

Response: PDF file (application/pdf)
````

### Cleanup
````
DELETE /api/cleanup?older_than_hours=24
````

### Testing
Test with curl:
```bash
curl -X POST http://localhost:8000/api/export/pdf \
  -H "Content-Type: application/json" \
  -d @test_data.json \
  --output test.pdf
```

## Deployment

See main README.md for deployment instructions (Railway.app, Render.com)
