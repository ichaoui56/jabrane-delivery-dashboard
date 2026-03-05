# Mobile API Testing Guide

This guide provides step-by-step instructions to test the delivery man mobile API endpoints.

## Prerequisites

- Your Next.js server should be running (default: `http://localhost:3000`)
- You have a delivery man account with credentials:
  - Email: `delivery.dakhla@sonic-delivery.com`
  - Password: `Delivery@123`

## Base URL

Replace `http://localhost:3000` with your actual server URL if different.

---

## Step 1: Login and Get JWT Token

**Endpoint:** `POST /api/mobile/auth/login`

**Request:**
```bash
curl -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "delivery.dakhla@sonic-delivery.com",
    "password": "Delivery@123"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Delivery Man Name",
    "email": "delivery.dakhla@sonic-delivery.com",
    "role": "DELIVERYMAN",
    "deliveryMan": {
      "id": 1,
      "city": "الداخلة",
      "vehicleType": "Motorcycle",
      "active": true
    }
  }
}
```

**Save the token** from the response. You'll need it for all subsequent requests.

---

## Step 2: Get Available Orders

**Endpoint:** `GET /api/mobile/orders`

**Request:**
```bash
curl -X GET http://localhost:3000/api/mobile/orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Optional Query Parameters:**
- `take`: Number of orders to fetch (default: 100, max: 100)
  ```bash
  curl -X GET "http://localhost:3000/api/mobile/orders?take=10" \
    -H "Authorization: Bearer YOUR_TOKEN_HERE"
  ```

**Expected Response:**
```json
{
  "orders": [
    {
      "id": 1,
      "orderCode": "OR-DA-000001",
      "customerName": "John Doe",
      "status": "ACCEPTED",
      "city": "الداخلة",
      ...
    }
  ]
}
```

---

## Step 3: Get Single Order Details

**Endpoint:** `GET /api/mobile/orders/[id]`

**Request:**
```bash
curl -X GET http://localhost:3000/api/mobile/orders/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "order": {
    "id": 1,
    "orderCode": "OR-DA-000001",
    "customerName": "John Doe",
    "status": "ACCEPTED",
    ...
  }
}
```

---

## Step 4: Accept an Order

**Endpoint:** `POST /api/mobile/orders/[id]/accept`

**Prerequisites:**
- Order must be in `ACCEPTED` status (accepted by admin first)
- Delivery man must be in the same city as the order
- Order must not be already assigned to another delivery man

**Request:**
```bash
curl -X POST http://localhost:3000/api/mobile/orders/1/accept \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "order": {
    "id": 1,
    "orderCode": "OR-DA-000001",
    "status": "ASSIGNED_TO_DELIVERY",
    "deliveryManId": 1
  }
}
```

**Error Responses:**
- `400`: Order must be accepted by admin first
- `403`: City mismatch or not authorized
- `409`: Order already assigned to another delivery man
- `404`: Order not found

---

## Step 5: Update Order Status

**Endpoint:** `PATCH /api/mobile/orders/[id]/status`

**Allowed Statuses:**
- `DELAY` - Increments attempt count by +1
- `REJECTED` - Final status, no further attempts allowed
- `CANCELLED` - Final status, no further attempts allowed
- `DELIVERED` - Final status, triggers delivery completion logic

### 5.1 Report an Order

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/mobile/orders/1/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DELAY",
    "reason": "Customer not available at address",
    "notes": "Tried calling multiple times",
    "location": "33.5731,-7.5898"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order status updated to DELAY",
  "order": {
    "id": 1,
    "orderCode": "OR-DA-000001",
    "status": "DELAY",
    "attemptNumber": 2
  }
}
```

### 5.2 Reject an Order

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/mobile/orders/1/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "reason": "Wrong address provided"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order status updated to REJECTED",
  "order": {
    "id": 1,
    "orderCode": "OR-DA-000001",
    "status": "REJECTED",
    "attemptNumber": 3
  }
}
```

### 5.3 Cancel an Order

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/mobile/orders/1/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CANCELLED",
    "reason": "Customer requested cancellation"
  }'
```

### 5.4 Mark Order as Delivered

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/mobile/orders/1/status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DELIVERED",
    "notes": "Delivered successfully",
    "location": "33.5731,-7.5898"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order status updated to DELIVERED",
  "order": {
    "id": 1,
    "orderCode": "OR-DA-000001",
    "status": "DELIVERED",
    "attemptNumber": 4
  }
}
```

**Note:** When status is `DELIVERED`, the system automatically:
- Updates product stock (decrements stock, increments delivered count)
- Updates merchant balance and earnings
- Updates delivery man stats (total deliveries, successful deliveries, earnings)
- Creates notifications for merchant and delivery man

---

## Step 6: Verify Your Profile

**Endpoint:** `GET /api/mobile/auth/me`

**Request:**
```bash
curl -X GET http://localhost:3000/api/mobile/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "user": {
    "id": 1,
    "name": "Delivery Man Name",
    "email": "delivery.dakhla@sonic-delivery.com",
    "role": "DELIVERYMAN",
    "deliveryMan": {
      "id": 1,
      "city": "الداخلة",
      "vehicleType": "Motorcycle",
      "active": true,
      "baseFee": 25
    }
  }
}
```

---

## Complete Test Script

Save this as `test-api.sh` and make it executable:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000"
EMAIL="delivery.dakhla@sonic-delivery.com"
PASSWORD="Delivery@123"

echo "🔐 Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/mobile/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "$LOGIN_RESPONSE" | jq '.'

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo ""
echo "✅ Login successful! Token: ${TOKEN:0:50}..."
echo ""

echo "📦 Step 2: Fetching orders..."
curl -s -X GET "$BASE_URL/api/mobile/orders?take=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "👤 Step 3: Getting profile..."
curl -s -X GET "$BASE_URL/api/mobile/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "✅ Testing complete!"
echo ""
echo "To test accepting an order, use:"
echo "curl -X POST \"$BASE_URL/api/mobile/orders/ORDER_ID/accept\" \\"
echo "  -H \"Authorization: Bearer $TOKEN\""
echo ""
echo "To test updating order status, use:"
echo "curl -X PATCH \"$BASE_URL/api/mobile/orders/ORDER_ID/status\" \\"
echo "  -H \"Authorization: Bearer $TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"status\":\"DELAY\",\"reason\":\"Test reason\"}'"
```

**Usage:**
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Using Postman or Insomnia

### Collection Setup

1. **Base URL:** `http://localhost:3000`
2. **Authentication:** Bearer Token (set in Authorization header)

### Request Examples

#### Login
- Method: `POST`
- URL: `{{baseUrl}}/api/mobile/auth/login`
- Body (JSON):
  ```json
  {
    "email": "delivery.dakhla@sonic-delivery.com",
    "password": "Delivery@123"
  }
  ```
- Save `token` from response as environment variable

#### Accept Order
- Method: `POST`
- URL: `{{baseUrl}}/api/mobile/orders/{{orderId}}/accept`
- Headers:
  - `Authorization: Bearer {{token}}`

#### Update Order Status
- Method: `PATCH`
- URL: `{{baseUrl}}/api/mobile/orders/{{orderId}}/status`
- Headers:
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- Body (JSON):
  ```json
  {
    "status": "DELAY",
    "reason": "Optional reason",
    "notes": "Optional notes",
    "location": "Optional GPS coordinates"
  }
  ```

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
- Token is missing or invalid
- Solution: Login again to get a new token

### 400 Bad Request
```json
{
  "error": "Invalid status. Allowed: DELAY, REJECTED, CANCELLED, DELIVERED"
}
```
- Invalid status value
- Solution: Use one of the allowed statuses

### 403 Forbidden
```json
{
  "error": "You are not assigned to this order"
}
```
- Trying to update an order you're not assigned to
- Solution: Only update orders assigned to you

### 404 Not Found
```json
{
  "error": "Order not found"
}
```
- Order ID doesn't exist
- Solution: Check the order ID

### 409 Conflict
```json
{
  "error": "Order already assigned to another delivery man"
}
```
- Order is already assigned
- Solution: Choose a different order

---

## Testing Workflow Example

1. **Login** → Get token
2. **Get orders** → Find an order with status `ACCEPTED`
3. **Accept order** → Order status becomes `ASSIGNED_TO_DELIVERY`
4. **Report order** → Status becomes `DELAY`, attempt count increments
5. **Report again** → Attempt count increments again
6. **Deliver order** → Status becomes `DELIVERED`, triggers business logic

---

## Notes

- Tokens expire after 30 days (default)
- Rate limiting: 10 requests per 15 minutes per IP/email
- All timestamps are in UTC
- GPS location format: `"latitude,longitude"` (e.g., `"33.5731,-7.5898"`)
- Once an order is `REJECTED`, `CANCELLED`, or `DELIVERED`, no further status updates are allowed

