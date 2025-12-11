# API Endpoints Documentation

## Overview
This document describes all API routes in the application, their purposes, request/response formats, and usage examples.

---

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

---

## Endpoints

### 1. Process Work Order
Analyzes an uploaded work order using Google Gemini AI and extracts structured data.

#### Endpoint
```
POST /api/process-work-order
```

#### Authentication
- Currently: None (open access)
- Future: Requires authentication token

#### Request Body
```json
{
  "workOrderId": "uuid-string"
}
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workOrderId` | string (UUID) | Yes | ID of the work order to process |

#### Response

**Success (200)**:
```json
{
  "success": true,
  "analysis": {
    "jobType": "LED Sign Installation",
    "location": "123 Main St, City, State 12345",
    "orderedBy": "ABC Company",
    "contactInfo": "john@abc.com, 555-1234",
    "resourceRequirements": {
      "techSkills": ["electrical", "LED installation"],
      "equipment": ["ladder", "drill set"],
      "vehicles": ["truck"]
    },
    "permitsRequired": ["Electrical permit"],
    "numberOfTechs": "2 technicians",
    "estimatedHours": 8,
    "estimatedDays": 1,
    "clientQuestions": ["What is the warranty?"],
    "technicianQuestions": ["Power source location?"],
    "technicalRequirements": "220V power supply",
    "accessRequirements": "Roof access required",
    "riskFactors": ["Working at height"],
    "additionalDetails": "Morning installation preferred"
  }
}
```

**Already Processed (200)**:
```json
{
  "message": "Work order already processed",
  "analysis": { /* existing analysis */ }
}
```

**Error Responses**:

*Missing Work Order ID (400)*:
```json
{
  "error": "Work order ID is required"
}
```

*Work Order Not Found (404)*:
```json
{
  "error": "Work order not found"
}
```

*File Download Error (500)*:
```json
{
  "error": "Failed to download file from storage"
}
```

*Unsupported File Type (400)*:
```json
{
  "error": "Unsupported file type. Please upload PDF or image files."
}
```

*AI Parsing Error (500)*:
```json
{
  "error": "Failed to parse AI response",
  "rawResponse": "raw AI output text"
}
```

*Database Update Error (500)*:
```json
{
  "error": "Failed to update work order"
}
```

#### Processing Flow
1. Validate `workOrderId` parameter
2. Fetch work order from database
3. Check if already processed (return existing analysis)
4. Download file from Supabase Storage
5. Determine file type (PDF or image)
6. Process with appropriate Gemini AI model:
   - **PDF**: `gemini-2.5-pro` with native PDF support
   - **Image**: `gemini-2.5-pro` with vision capabilities
7. Parse AI response as JSON
8. Update database with `processed: true` and `analysis` data
9. Return structured analysis

#### Supported File Types
- **PDF**: `.pdf`
- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

#### AI Model Used
- **Model**: `gemini-2.5-pro`
- **Capabilities**: 
  - Text extraction from PDFs
  - OCR and image understanding
  - Structured data extraction
  - Context understanding

#### Example Usage

**JavaScript/TypeScript**:
```typescript
const response = await fetch('/api/process-work-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
    workOrderId: '123e4567-e89b-12d3-a456-426614174000' 
  }),
});

const data = await response.json();

if (response.ok) {
  console.log('Analysis:', data.analysis);
} else {
  console.error('Error:', data.error);
}
```

**cURL**:
```bash
curl -X POST http://localhost:3000/api/process-work-order \
  -H "Content-Type: application/json" \
  -d '{"workOrderId":"123e4567-e89b-12d3-a456-426614174000"}'
```

#### Rate Limiting
- Currently: None
- Future: 10 requests per minute per user

#### Performance
- **Average Processing Time**: 5-15 seconds
- **Timeout**: 60 seconds
- **Max File Size**: 50MB

---

## Future API Endpoints

### 2. Authentication (Planned)

#### Login
```
POST /api/auth/login
```

#### Logout
```
POST /api/auth/logout
```

#### Register
```
POST /api/auth/register
```

---

### 3. Technicians (Planned)

#### Get All Technicians
```
GET /api/technicians
```

#### Get Single Technician
```
GET /api/technicians/:id
```

#### Create Technician
```
POST /api/technicians
```

#### Update Technician
```
PUT /api/technicians/:id
```

#### Delete Technician
```
DELETE /api/technicians/:id
```

---

### 4. Equipment (Planned)

#### Get All Equipment
```
GET /api/equipment
```

#### Get Single Equipment
```
GET /api/equipment/:id
```

#### Create Equipment
```
POST /api/equipment
```

#### Update Equipment
```
PUT /api/equipment/:id
```

#### Delete Equipment
```
DELETE /api/equipment/:id
```

---

### 5. Vehicles (Planned)

#### Get All Vehicles
```
GET /api/vehicles
```

#### Get Single Vehicle
```
GET /api/vehicles/:id
```

#### Create Vehicle
```
POST /api/vehicles
```

#### Update Vehicle
```
PUT /api/vehicles/:id
```

#### Delete Vehicle
```
DELETE /api/vehicles/:id
```

---

### 6. Work Orders (Planned)

#### Get All Work Orders
```
GET /api/work-orders
```

#### Get Single Work Order
```
GET /api/work-orders/:id
```

#### Upload Work Order
```
POST /api/work-orders/upload
```

#### Assign Work Order
```
POST /api/work-orders/:id/assign
```

#### Update Work Order Status
```
PATCH /api/work-orders/:id/status
```

#### Delete Work Order
```
DELETE /api/work-orders/:id
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* optional additional info */ }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## API Best Practices

### Request Headers
```
Content-Type: application/json
Authorization: Bearer {token}  // when auth is implemented
```

### Response Headers
```
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640000000
```

### Pagination (Future)
```
GET /api/technicians?page=1&limit=20
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Filtering (Future)
```
GET /api/equipment?status=available&type=ladder
```

### Sorting (Future)
```
GET /api/work-orders?sort=-created_at
```
(- prefix for descending)

---

## Webhooks (Future)

### Work Order Processed
Triggered when AI completes work order analysis.

```json
{
  "event": "work_order.processed",
  "data": {
    "workOrderId": "uuid",
    "analysis": { /* analysis data */ }
  }
}
```

### Equipment Status Changed
```json
{
  "event": "equipment.status_changed",
  "data": {
    "equipmentId": "uuid",
    "oldStatus": "available",
    "newStatus": "in-use"
  }
}
```

---

## API Versioning (Future)

### Version in URL
```
/api/v1/process-work-order
/api/v2/process-work-order
```

### Version in Header
```
API-Version: 1.0
```
