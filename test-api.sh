#!/bin/bash

# Mobile API Testing Script
# This script tests the delivery man mobile API endpoints

# Configuration
BASE_URL="http://localhost:3000"
EMAIL="delivery.dakhla@sonic-delivery.com"
PASSWORD="Delivery@123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Mobile API Testing Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Login
echo -e "${YELLOW}🔐 Step 1: Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/mobile/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ] || [ "$TOKEN" == "" ]; then
  echo -e "${RED}❌ Login failed! Please check your credentials and server.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Login successful!${NC}"
echo -e "${BLUE}Token: ${TOKEN:0:50}...${NC}"
echo ""

# Step 2: Get Profile
echo -e "${YELLOW}👤 Step 2: Getting profile...${NC}"
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/mobile/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$PROFILE_RESPONSE" | jq '.' 2>/dev/null || echo "$PROFILE_RESPONSE"
echo ""

# Step 3: Get Orders
echo -e "${YELLOW}📦 Step 3: Fetching orders...${NC}"
ORDERS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/mobile/orders?take=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$ORDERS_RESPONSE" | jq '.' 2>/dev/null || echo "$ORDERS_RESPONSE"

# Extract first order ID if available
FIRST_ORDER_ID=$(echo "$ORDERS_RESPONSE" | jq -r '.orders[0].id' 2>/dev/null)
FIRST_ORDER_STATUS=$(echo "$ORDERS_RESPONSE" | jq -r '.orders[0].status' 2>/dev/null)
FIRST_ORDER_CODE=$(echo "$ORDERS_RESPONSE" | jq -r '.orders[0].orderCode' 2>/dev/null)

echo ""
if [ "$FIRST_ORDER_ID" != "null" ] && [ -n "$FIRST_ORDER_ID" ]; then
  echo -e "${GREEN}✅ Found order: $FIRST_ORDER_CODE (ID: $FIRST_ORDER_ID, Status: $FIRST_ORDER_STATUS)${NC}"
else
  echo -e "${YELLOW}⚠️  No orders found${NC}"
fi
echo ""

# Step 4: Test Accept Order (if order is ACCEPTED)
if [ "$FIRST_ORDER_STATUS" == "ACCEPTED" ] && [ "$FIRST_ORDER_ID" != "null" ]; then
  echo -e "${YELLOW}✅ Step 4: Testing accept order (ID: $FIRST_ORDER_ID)...${NC}"
  ACCEPT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/mobile/orders/$FIRST_ORDER_ID/accept" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  echo "$ACCEPT_RESPONSE" | jq '.' 2>/dev/null || echo "$ACCEPT_RESPONSE"
  echo ""
fi

# Step 5: Test Update Status (if order is ASSIGNED_TO_DELIVERY)
if [ "$FIRST_ORDER_STATUS" == "ASSIGNED_TO_DELIVERY" ] && [ "$FIRST_ORDER_ID" != "null" ]; then
  echo -e "${YELLOW}📝 Step 5: Testing update order status (ID: $FIRST_ORDER_ID)...${NC}"
  echo -e "${BLUE}Testing DELAY status...${NC}"
  
  UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/mobile/orders/$FIRST_ORDER_ID/status" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "DELAYED",
      "reason": "Test reason from script",
      "notes": "Testing API endpoint",
      "location": "33.5731,-7.5898"
    }')
  
  echo "$UPDATE_RESPONSE" | jq '.' 2>/dev/null || echo "$UPDATE_RESPONSE"
  echo ""
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Testing Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Manual Test Commands:${NC}"
echo ""
echo -e "${YELLOW}Accept an order:${NC}"
echo "curl -X POST \"$BASE_URL/api/mobile/orders/ORDER_ID/accept\" \\"
echo "  -H \"Authorization: Bearer $TOKEN\""
echo ""
echo -e "${YELLOW}Update order status to DELAY:${NC}"
echo "curl -X PATCH \"$BASE_URL/api/mobile/orders/ORDER_ID/status\" \\"
echo "  -H \"Authorization: Bearer $TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"status\":\"DELAY\",\"reason\":\"Test reason\"}'"
echo ""
echo -e "${YELLOW}Update order status to DELIVERED:${NC}"
echo "curl -X PATCH \"$BASE_URL/api/mobile/orders/ORDER_ID/status\" \\"
echo "  -H \"Authorization: Bearer $TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"status\":\"DELIVERED\",\"notes\":\"Delivered successfully\"}'"
echo ""

