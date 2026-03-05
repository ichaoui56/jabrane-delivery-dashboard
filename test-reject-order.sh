#!/bin/bash

# Test script to reject an order
BASE_URL="http://localhost:3000"
EMAIL="delivery.dakhla@sonic-delivery.com"
PASSWORD="Delivery@123"

echo "🔐 Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/mobile/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful!"
echo ""

# Get order ID from command line argument or find one
if [ -z "$1" ]; then
  echo "📦 Step 2: Finding an order assigned to you..."
  ORDERS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/mobile/orders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  # Find an order with ASSIGNED_TO_DELIVERY status
  ORDER_ID=$(echo "$ORDERS_RESPONSE" | jq -r '.orders[] | select(.status == "ASSIGNED_TO_DELIVERY") | .id' | head -1)
  
  if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" == "null" ]; then
    echo "❌ No orders found with ASSIGNED_TO_DELIVERY status"
    echo ""
    echo "Available orders:"
    echo "$ORDERS_RESPONSE" | jq -r '.orders[] | "\(.id) - \(.orderCode) - \(.status)"'
    echo ""
    echo "Usage: $0 <ORDER_ID>"
    exit 1
  fi
  
  ORDER_CODE=$(echo "$ORDERS_RESPONSE" | jq -r ".orders[] | select(.id == $ORDER_ID) | .orderCode")
  echo "✅ Found order: $ORDER_CODE (ID: $ORDER_ID)"
else
  ORDER_ID=$1
  echo "📦 Using provided order ID: $ORDER_ID"
fi

echo ""
echo "🚫 Step 3: Rejecting order $ORDER_ID..."
echo ""

REJECT_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/mobile/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "reason": "Test rejection - Wrong address provided by customer"
  }')

echo "Response:"
echo "$REJECT_RESPONSE" | jq '.' 2>/dev/null || echo "$REJECT_RESPONSE"

echo ""
echo "✅ Test complete!"

