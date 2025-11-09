# Sash Window API

## Endpoints

### `GET /health`
Returns service health information.

### `POST /api/export/pdf`
Generates a professional PDF for a single window specification.

**Body**
- `windowData` – Complete window specification
- `includeDrawings`, `includePreCutList`, `includeCutList`, `includeShoppingList`, `includeGlazingSpec`

### `POST /api/export/excel`
Generates a multi-sheet Excel workbook for a single window specification. Returns a `.xlsx` file.

### `POST /api/export/batch-pdf`
Generates a combined PDF document for multiple windows supplied in the `windows` array.

### `DELETE /api/cleanup`
Removes generated files older than the provided number of hours.
