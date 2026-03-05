# Mobile API Quick Reference

## Authentication

**Login:**
```bash
POST /api/mobile/auth/login
Body: { "email": "delivery.dakhla@sonic-delivery.com", "password": "Delivery@123" }
Response: { "token": "...", "user": {...} }
```

**Get Profile:**
```bash
GET /api/mobile/auth/me
Headers: Authorization: Bearer {token}
```

---

## Orders

**Get All Orders:**
```bash
GET /api/mobile/orders?take=100
Headers: Authorization: Bearer {token}
```

**Get Single Order:**
```bash
GET /api/mobile/orders/{id}
Headers: Authorization: Bearer {token}
```

**Accept Order:**
```bash
POST /api/mobile/orders/{id}/accept
Headers: Authorization: Bearer {token}
```

**Update Order Status:**
```bash
PATCH /api/mobile/orders/{id}/status
Headers: Authorization: Bearer {token}
Body: {
  "status": "DELAY" | "REJECTED" | "CANCELLED" | "DELIVERED",
  "reason": "optional string",
  "notes": "optional string",
  "location": "optional GPS coordinates"
}
```

---

## Status Flow

```
PENDING → ACCEPTED (by admin) → ASSIGNED_TO_DELIVERY (by delivery man)
                                              ↓
                                    DELAY (increments attempts)
                                              ↓
                                    REJECTED / CANCELLED / DELIVERED (final)
```

---

## Status Rules

| Status | Attempt Count | Can Update Again? | Notes |
|--------|--------------|-------------------|-------|
| DELAY | +1 | ✅ Yes | Can report multiple times |
| REJECTED | +1 | ❌ No | Final status |
| CANCELLED | +1 | ❌ No | Final status |
| DELIVERED | +1 | ❌ No | Final status, triggers business logic |

---

## Quick Test Commands

**1. Login and save token:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"delivery.dakhla@sonic-delivery.com","password":"Delivery@123"}' \
  | jq -r '.token')
```

**2. Get orders:**
```bash
curl -X GET "http://localhost:3000/api/mobile/orders" \
  -H "Authorization: Bearer $TOKEN"
```

**3. Accept order (ID=1):**
```bash
curl -X POST "http://localhost:3000/api/mobile/orders/1/accept" \
  -H "Authorization: Bearer $TOKEN"
```

**4. Report order:**
```bash
curl -X PATCH "http://localhost:3000/api/mobile/orders/1/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"DELAY","reason":"Customer not available"}'
```

**5. Deliver order:**
```bash
curl -X PATCH "http://localhost:3000/api/mobile/orders/1/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"DELIVERED","notes":"Delivered successfully"}'
```

---

## Error Codes

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (not authorized for this action)
- `404` - Not Found (order doesn't exist)
- `409` - Conflict (order already assigned)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Base URL

Default: `http://localhost:3000`

Replace with your actual server URL in production.

