# Testing Scenario: Waiter Alerts (User Story 12)

## Prerequisites
- Backend server running on port 5001
- Frontend server running (usually port 3000)
- Database initialized with `served` and `served_at` columns

## Test Scenario Overview
This scenario tests the complete flow from kitchen marking an order as ready to waiter serving it.

---

## Step 1: Create a Dine-In Order

### As a Customer:
1. Open the customer interface (http://localhost:3000)
2. Log in or sign up as a customer
3. Navigate to Menu
4. Add items to cart (e.g., "Beef Tenderloin" x2, "Crispy Fries" x1)
5. Go to Cart
6. Select **Service Mode: Dine-In**
7. If prompted, create or select a reservation
8. Proceed to Checkout
9. Complete payment
10. **Note the Order ID** (e.g., Order #15)

### Expected Result:
- Order is created successfully
- Order appears in Kitchen Dashboard with status "pending"

---

## Step 2: Kitchen Prepares Order

### As Kitchen Staff:
1. Open Kitchen Dashboard (http://localhost:3000/kitchen-dashboard)
2. Find the order you just created (should show as "pending")
3. Click **"Start Preparing"** button
   - Order status should change to "preparing"
4. Complete individual items:
   - For each item, click **"Complete Item"** button
   - Item status should show "✓ Item Completed"
5. Once all items are completed, click **"Complete Order"** button
   - Order status should change to "completed"

### Expected Result:
- Order status is now "completed"
- **WebSocket event `orderReadyForWaiter` should be emitted** (check browser console)
- Order should appear in Waiter Dashboard immediately (if waiter dashboard is open)

---

## Step 3: Verify Real-Time Alert (Waiter Dashboard)

### As a Waiter:
1. Open Waiter Dashboard (http://localhost:3000/waiter-dashboard)
   - If already open, the alert should appear automatically
   - If opening fresh, alerts should load on page load
2. **Verify the alert card shows:**
   - ✅ Table number (e.g., "T5" or "Order #15")
   - ✅ Order ID (e.g., "Order #15")
   - ✅ Item list with quantities:
     - "2x Beef Tenderloin"
     - "1x Crispy Fries"
   - ✅ "Ready" badge (green)
   - ✅ "Mark as Served" button

### Expected Result:
- Alert appears in real-time without page refresh
- Alert persists on the screen
- All order details are visible and correct

---

## Step 4: Test Persistent Alerts

### As a Waiter:
1. **Refresh the Waiter Dashboard page** (F5 or Cmd+R)
2. **Verify:**
   - ✅ The same alert is still visible
   - ✅ Order details are still correct
   - ✅ Alert did not disappear

### Expected Result:
- Alerts persist across page refreshes
- All ready-to-serve orders are loaded from the backend

---

## Step 5: Mark Order as Served

### As a Waiter:
1. On the alert card, click **"Mark as Served"** button
2. **Verify:**
   - ✅ Button shows "Marking as Served..." while processing
   - ✅ Alert card disappears from the list
   - ✅ No error messages appear

### Expected Result:
- Order is marked as served in the database
- Alert is removed from the waiter's view
- WebSocket event `orderServed` is emitted (check console)

---

## Step 6: Verify Multiple Orders

### As a Customer (Create Second Order):
1. Create another dine-in order with different items
2. Note the new Order ID

### As Kitchen Staff:
1. Mark the second order as "completed" (follow Step 2)

### As a Waiter:
1. **Verify:**
   - ✅ Both orders appear in the alert list
   - ✅ Each order has its own card
   - ✅ Table numbers are different
   - ✅ Items are correct for each order

### Expected Result:
- Multiple alerts can be displayed simultaneously
- Each alert is independent

---

## Step 7: Test WebSocket Disconnection/Reconnection

### As a Waiter:
1. Open browser console (F12)
2. **Temporarily disconnect network** (or close backend)
3. **Reconnect network** (or restart backend)
4. **Verify:**
   - ✅ Waiter Dashboard reconnects automatically
   - ✅ Existing alerts remain visible
   - ✅ New alerts can still be received

### Expected Result:
- WebSocket reconnects gracefully
- No data loss during disconnection

---

## Step 8: Edge Cases

### Test 8.1: No Ready Orders
1. Mark all orders as served
2. **Verify:**
   - ✅ Waiter Dashboard shows "No orders ready to serve at this time."
   - ✅ No errors in console

### Test 8.2: Invalid Order ID
1. Try to mark a non-existent order as served (via API or console)
2. **Verify:**
   - ✅ Error message is shown
   - ✅ No crash occurs

### Test 8.3: Delivery Order (Should Not Appear)
1. Create a **delivery** order (not dine-in)
2. Mark it as completed in kitchen
3. **Verify:**
   - ✅ Order does NOT appear in Waiter Dashboard
   - ✅ Only dine-in orders appear

---

## Step 9: Backend API Verification

### Test API Endpoints Directly:

#### GET /api/waiter/orders/ready
```bash
curl http://localhost:5001/api/waiter/orders/ready
```

**Expected Response:**
```json
[
  {
    "orderId": 15,
    "tableNumber": "T5",
    "reservationId": 5,
    "items": [
      { "name": "Beef Tenderloin", "quantity": 2 },
      { "name": "Crispy Fries", "quantity": 1 }
    ],
    "status": "completed",
    "createdAt": "2025-12-05T...",
    "updatedAt": "2025-12-05T..."
  }
]
```

#### POST /api/waiter/orders/:id/mark-served
```bash
curl -X POST http://localhost:5001/api/waiter/orders/15/mark-served
```

**Expected Response:**
```json
{
  "success": true,
  "order": {
    "id": 15,
    "status": "completed",
    "served": true,
    "served_at": "2025-12-05T..."
  }
}
```

---

## Step 10: Database Verification

### Check Database:
```sql
-- Check if served column exists
SELECT served, served_at FROM orders WHERE id = 15;

-- Should show:
-- served: 1
-- served_at: 2025-12-05T...
```

---

## Success Criteria Checklist

- [ ] Kitchen can mark dine-in orders as "completed"
- [ ] WebSocket event `orderReadyForWaiter` is emitted
- [ ] Waiter Dashboard shows alert in real-time
- [ ] Alert shows correct table number, order ID, and items
- [ ] Alerts persist across page refreshes
- [ ] Waiter can mark order as served
- [ ] Alert disappears after marking as served
- [ ] Multiple orders can be displayed simultaneously
- [ ] Only dine-in orders appear (not delivery/pickup)
- [ ] API endpoints return correct data
- [ ] Database correctly stores `served` status

---

## Troubleshooting

### Issue: Alerts not appearing
- **Check:** Browser console for WebSocket connection errors
- **Check:** Backend console for `orderReadyForWaiter` event emission
- **Check:** Order service_mode is 'dine-in' or 'dine_in'
- **Check:** Order status is 'completed'

### Issue: Alert disappears on refresh
- **Check:** GET /api/waiter/orders/ready endpoint is working
- **Check:** Order has `served = 0` or `served IS NULL` in database

### Issue: "Mark as Served" not working
- **Check:** Browser console for API errors
- **Check:** Backend console for POST /api/waiter/orders/:id/mark-served errors
- **Check:** Order exists and is a dine-in order

---

## Notes
- Table numbers are derived from reservation IDs (format: "T{reservation_id}")
- If no reservation, table number shows as "Order #{order_id}"
- WebSocket events use Socket.IO (same infrastructure as delivery alerts)
- All alerts are persistent until explicitly marked as served

