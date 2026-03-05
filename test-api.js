#!/usr/bin/env node

/**
 * Mobile API Testing Script (Node.js)
 * 
 * Usage: node test-api.js
 * 
 * Prerequisites:
 * - npm install node-fetch (if using Node < 18)
 * - Or use Node 18+ which has fetch built-in
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const EMAIL = 'delivery.dakhla@sonic-delivery.com';
const PASSWORD = 'Delivery@123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI() {
  let token = null;

  try {
    // Step 1: Login
    log('\n🔐 Step 1: Logging in...', 'yellow');
    const loginResponse = await fetch(`${BASE_URL}/api/mobile/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });

    const loginData = await loginResponse.json();
    console.log(JSON.stringify(loginData, null, 2));

    if (!loginData.token) {
      log('❌ Login failed!', 'red');
      return;
    }

    token = loginData.token;
    log('✅ Login successful!', 'green');
    log(`Token: ${token.substring(0, 50)}...`, 'blue');

    // Step 2: Get Profile
    log('\n👤 Step 2: Getting profile...', 'yellow');
    const profileResponse = await fetch(`${BASE_URL}/api/mobile/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const profileData = await profileResponse.json();
    console.log(JSON.stringify(profileData, null, 2));

    // Step 3: Get Orders
    log('\n📦 Step 3: Fetching orders...', 'yellow');
    const ordersResponse = await fetch(`${BASE_URL}/api/mobile/orders?take=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const ordersData = await ordersResponse.json();
    console.log(JSON.stringify(ordersData, null, 2));

    const firstOrder = ordersData.orders?.[0];
    if (firstOrder) {
      log(`\n✅ Found order: ${firstOrder.orderCode} (ID: ${firstOrder.id}, Status: ${firstOrder.status})`, 'green');

      // Step 4: Test Accept Order (if status is ACCEPTED)
      if (firstOrder.status === 'ACCEPTED') {
        log('\n✅ Step 4: Testing accept order...', 'yellow');
        const acceptResponse = await fetch(`${BASE_URL}/api/mobile/orders/${firstOrder.id}/accept`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const acceptData = await acceptResponse.json();
        console.log(JSON.stringify(acceptData, null, 2));
      }

      // Step 5: Test Update Status (if status is ASSIGNED_TO_DELIVERY)
      if (firstOrder.status === 'ASSIGNED_TO_DELIVERY') {
        log('\n📝 Step 5: Testing update order status to DELAY...', 'yellow');
        const updateResponse = await fetch(`${BASE_URL}/api/mobile/orders/${firstOrder.id}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'DELAY',
            reason: 'Test reason from Node.js script',
            notes: 'Testing API endpoint',
            location: '33.5731,-7.5898',
          }),
        });

        const updateData = await updateResponse.json();
        console.log(JSON.stringify(updateData, null, 2));
      }
    } else {
      log('⚠️  No orders found', 'yellow');
    }

    log('\n========================================', 'green');
    log('  Testing Complete!', 'green');
    log('========================================\n', 'green');

    // Print manual test commands
    log('Manual Test Commands:', 'blue');
    log('\nAccept an order:', 'yellow');
    console.log(`curl -X POST "${BASE_URL}/api/mobile/orders/ORDER_ID/accept" \\`);
    console.log(`  -H "Authorization: Bearer ${token.substring(0, 20)}..."`);

    log('\nUpdate order status to DELAY:', 'yellow');
    console.log(`curl -X PATCH "${BASE_URL}/api/mobile/orders/ORDER_ID/status" \\`);
    console.log(`  -H "Authorization: Bearer ${token.substring(0, 20)}..." \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"status":"DELAY","reason":"Test reason"}'`);

    log('\nUpdate order status to DELIVERED:', 'yellow');
    console.log(`curl -X PATCH "${BASE_URL}/api/mobile/orders/ORDER_ID/status" \\`);
    console.log(`  -H "Authorization: Bearer ${token.substring(0, 20)}..." \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"status":"DELIVERED","notes":"Delivered successfully"}'`);

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run the tests
testAPI();

