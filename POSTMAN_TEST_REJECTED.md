# Testing REJECTED Status Update in Postman

## Step-by-Step Guide

### Step 1: Login and Get Token

**Request Setup:**
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/mobile/auth/login`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "email": "delivery.dakhla@sonic-delivery.com",
    "password": "Delivery@123"
  }
  ```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "...",
    "email": "delivery.dakhla@sonic-delivery.com",
    "role": "DELIVERYMAN",
    "deliveryMan": {
      "id": 1,
      "city": "الداخلة",
      "vehicleType": "...",
      "active": true
    }
  }
}
```

**Action:** Copy the `token` value from the response.

---

### Step 2: Get Available Orders (Optional - to find an order ID)

**Request Setup:**
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/mobile/orders`
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN_HERE` (replace with token from Step 1)
  - `Content-Type: application/json`

**Expected Response:**
```json
{
  "orders": [
    {
      "id": 1,
      "orderCode": "OR-DA-000001",
      "status": "ASSIGNED_TO_DELIVERY",
      "customerName": "...",
      ...
    }
  ]
}
```

**Action:** Note an order `id` that has status `ASSIGNED_TO_DELIVERY` (must be assigned to you).

---

### Step 3: Update Order Status to REJECTED

**Request Setup:**
- **Method:** `PATCH`
- **URL:** `http://localhost:3000/api/mobile/orders/{orderId}`
  - Replace `{orderId}` with the actual order ID (e.g., `1`)
  - Example: `http://localhost:3000/api/mobile/orders/1`
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN_HERE` (replace with token from Step 1)
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "status": "REJECTED",
    "reason": "Customer not available at the address"
  }
  ```

**Complete Example:**
```
Method: PATCH
URL: http://localhost:3000/api/mobile/orders/1
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
Body (raw JSON):
{
  "status": "REJECTED",
  "reason": "Customer not available at the address"
}
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Order status updated to REJECTED",
  "order": {
    "id": 1,
    "orderCode": "OR-DA-000001",
    "status": "REJECTED",
    "attemptNumber": 2
  }
}
```

**Expected Response (Error - Order not assigned to you):**
```json
{
  "error": "You are not assigned to this order"
}
```

**Expected Response (Error - Order already in final state):**
```json
{
  "error": "Cannot update order status. Order is already DELIVERED"
}
```

---

## Postman Collection Setup

### Create a Collection

1. Click **New** → **Collection**
2. Name it: `Sonic Delivery Mobile API`

### Add Environment Variables (Recommended)

1. Click **Environments** → **Create Environment**
2. Add variables:
   - `base_url`: `http://localhost:3000`
   - `token`: (leave empty, will be set automatically)

### Request 1: Login

**Save as:** `Login - Get Token`

**Pre-request Script:**
```javascript
// Clear previous token
pm.environment.unset("token");
```

**Tests Script:**
```javascript
// Save token to environment
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.token) {
        pm.environment.set("token", jsonData.token);
        console.log("Token saved to environment");
    }
}
```

### Request 2: Get Orders

**Save as:** `Get Orders`

**URL:** `{{base_url}}/api/mobile/orders`

**Headers:**
- `Authorization: Bearer {{token}}`

### Request 3: Update Status to REJECTED

**Save as:** `Update Order Status - REJECTED`

**Method:** `PATCH`
**URL:** `{{base_url}}/api/mobile/orders/{{order_id}}`

**Headers:**
- `Authorization: Bearer {{token}}`
- `Content-Type: application/json`

**Body (raw JSON):**
```json
{
  "status": "REJECTED",
  "reason": "Customer not available at the address"
}
```

---

## Alternative: Using Postman Variables

### Set Order ID Variable

After getting orders, you can manually set:
- `order_id`: `1` (or any order ID you want to test)

Or use a test script in "Get Orders" request:
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.orders && jsonData.orders.length > 0) {
        // Set first order ID
        pm.environment.set("order_id", jsonData.orders[0].id);
        console.log("Order ID saved:", jsonData.orders[0].id);
    }
}
```

---

## Complete Test Flow in Postman

1. **Login** → Token saved automatically
2. **Get Orders** → Find an order with status `ASSIGNED_TO_DELIVERY`
3. **Update Status to REJECTED** → Use the order ID from step 2

---

## Request Body Options for REJECTED

### Minimal (just status):
```json
{
  "status": "REJECTED"
}
```

### With Reason:
```json
{
  "status": "REJECTED",
  "reason": "Customer not available at the address"
}
```

### With Reason and Notes:
```json
{
  "status": "REJECTED",
  "reason": "Wrong address provided",
  "notes": "Customer gave incorrect address, tried to contact but no response"
}
```

### With All Fields:
```json
{
  "status": "REJECTED",
  "reason": "Customer refused the order",
  "notes": "Customer was present but refused to accept the order",
  "location": "33.5731,-7.5898"
}
```

---

## Common Issues & Solutions

### Issue: "Unauthorized" (401)
**Solution:** 
- Make sure you're using the token from the login request
- Token might have expired (tokens last 30 days)
- Re-login to get a new token

### Issue: "You are not assigned to this order" (403)
**Solution:**
- The order must be in `ASSIGNED_TO_DELIVERY` status
- The order must be assigned to your delivery man account
- Check the order status first using "Get Orders" request

### Issue: "Cannot update order status. Order is already REJECTED" (400)
**Solution:**
- Once an order is REJECTED, CANCELLED, or DELIVERED, it cannot be updated
- Choose a different order that's still in `ASSIGNED_TO_DELIVERY` status

### Issue: "Invalid status" (400)
**Solution:**
- Make sure the status is exactly `"REJECTED"` (uppercase, no typos)
- Allowed values: `DELAYED`, `REJECTED`, `CANCELLED`, `DELIVERED`

---

## Quick Copy-Paste for Postman

### URL:
```
http://localhost:3000/api/mobile/orders/1
```

### Method:
```
PATCH
```

### Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

### Body (raw JSON):
```json
{
  "status": "REJECTED",
  "reason": "Customer not available at the address"
}
```

Replace `YOUR_TOKEN_HERE` with the actual token from the login response, and `1` with the actual order ID.

