# Test Dakhla Delivery Man Orders - Step by Step

## Prerequisites

1. **Make sure your Next.js server is running:**
   ```bash
   # In a separate terminal, start your server:
   npm run dev
   # or
   pnpm dev
   # or
   yarn dev
   ```

2. **Install jq (for pretty JSON output) if not installed:**
   ```bash
   # macOS
   brew install jq
   
   # Linux
   sudo apt-get install jq
   ```

---

## Step-by-Step Terminal Commands

### Step 1: Login and Get Token

```bash
curl -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "delivery.dakhla@sonic-delivery.com",
    "password": "Delivery@123"
  }' | jq '.'
```

**Expected output:**
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
      ...
    }
  }
}
```

### Step 2: Save Token to Variable

Copy the token from Step 1 and save it:

```bash
TOKEN="YOUR_TOKEN_HERE"
```

Or automatically extract it:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"delivery.dakhla@sonic-delivery.com","password":"Delivery@123"}' \
  | jq -r '.token')

echo "Token saved: ${TOKEN:0:50}..."
```

### Step 3: Get All Orders for Dakhla Delivery Man

```bash
curl -X GET http://localhost:3000/api/mobile/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
```

### Step 4: Get Orders with Limit (First 10)

```bash
curl -X GET "http://localhost:3000/api/mobile/orders?take=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
```

### Step 5: Show Only Order Summary (Order Code, Status, Customer)

```bash
curl -s -X GET http://localhost:3000/api/mobile/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.orders[] | {
    id: .id,
    orderCode: .orderCode,
    customerName: .customerName,
    customerPhone: .customerPhone,
    status: .status,
    city: .city,
    totalPrice: .totalPrice,
    createdAt: .createdAt
  }'
```

### Step 6: Count Orders by Status

```bash
curl -s -X GET http://localhost:3000/api/mobile/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | jq '[.orders[] | .status] | group_by(.) | map({status: .[0], count: length})'
```

---

## One-Line Commands (Copy & Paste)

### Complete Test - Login + Get Orders

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/mobile/auth/login -H "Content-Type: application/json" -d '{"email":"delivery.dakhla@sonic-delivery.com","password":"Delivery@123"}' | jq -r '.token') && curl -s -X GET http://localhost:3000/api/mobile/orders -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Get Orders Summary Table

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/mobile/auth/login -H "Content-Type: application/json" -d '{"email":"delivery.dakhla@sonic-delivery.com","password":"Delivery@123"}' | jq -r '.token') && curl -s -X GET http://localhost:3000/api/mobile/orders -H "Authorization: Bearer $TOKEN" | jq -r '.orders[] | "\(.orderCode) | \(.status) | \(.customerName) | \(.city)"'
```

---

## Using the Test Script

If you prefer using the automated script:

```bash
# Make sure it's executable
chmod +x test-dakhla-orders.sh

# Run it
./test-dakhla-orders.sh
```

---

## Troubleshooting

### Server Not Running
```bash
# Check if server is running on port 3000
lsof -i :3000

# If not running, start it:
npm run dev
```

### jq Not Installed
```bash
# Install jq (macOS)
brew install jq

# Or use Python for JSON formatting:
curl ... | python3 -m json.tool
```

### Connection Refused
- Make sure your Next.js server is running
- Check the port (default is 3000)
- If using a different port, update the BASE_URL

### Invalid Credentials
- Verify the email and password are correct
- Check if the delivery man account exists in the database
- Ensure the delivery man account is active

---

## Example Output

```json
{
  "orders": [
    {
      "id": 1,
      "orderCode": "OR-DA-000001",
      "customerName": "John Doe",
      "customerPhone": "+212612345678",
      "address": "123 Main Street",
      "city": "الداخلة",
      "status": "ACCEPTED",
      "totalPrice": 150.0,
      "paymentMethod": "COD",
      "createdAt": "2024-01-15T10:30:00Z",
      "orderItems": [
        {
          "id": 1,
          "quantity": 2,
          "product": {
            "id": 1,
            "name": "Product Name",
            "image": "...",
            "sku": "SKU001"
          }
        }
      ],
      "merchant": {
        "id": 1,
        "companyName": "Merchant Name",
        "user": {
          "name": "Merchant User",
          "phone": "+212612345679"
        }
      }
    }
  ]
}
```

