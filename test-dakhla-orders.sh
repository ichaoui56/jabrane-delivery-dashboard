#!/bin/bash

# Test script to show orders for Dakhla delivery man
BASE_URL="http://localhost:3000"
EMAIL="delivery.dakhla@sonic-delivery.com"
PASSWORD="Delivery@123"

echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/mobile/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
  echo "✅ Login successful!"
  echo ""
  
  echo "📦 Fetching orders for Dakhla delivery man..."
  echo ""
  
  ORDERS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/mobile/orders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  # Pretty print the orders
  echo "$ORDERS_RESPONSE" | jq '.'
  
  # Count orders
  ORDER_COUNT=$(echo "$ORDERS_RESPONSE" | jq '.orders | length')
  echo ""
  echo "📊 Total orders found: $ORDER_COUNT"
  
else
  echo "❌ Login failed!"
  echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
fi
