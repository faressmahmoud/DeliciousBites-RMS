const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./db');

const app = express();

// MUST COME FIRST
const server = http.createServer(app);

// MUST COME AFTER server is created
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  }
});


// Let Render choose the port
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: false,
}));

app.use(express.json());

// Test endpoint to verify routing works
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Menu endpoints
app.get('/api/menu', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM menu_items ORDER BY id').all();
    const menuItems = items.map(item => ({
      ...item,
      name: String(item.name || '').trim(), // Database is clean, just trim
      popular: item.popular === 1,
      dietary: item.dietary ? JSON.parse(item.dietary) : null
    }));
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/menu/:category', (req, res) => {
  try {
  const category = req.params.category;
    const items = db.prepare('SELECT * FROM menu_items WHERE category = ? ORDER BY id').all(category);
    const menuItems = items.map(item => ({
      ...item,
      name: String(item.name || '').trim(), // Database is clean, just trim
      popular: item.popular === 1,
      dietary: item.dietary ? JSON.parse(item.dietary) : null
    }));
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/signup', (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const existing = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    if (existing) {
      if (existing.isVerified === 1) {
        return res.status(400).json({ error: 'This phone number is already registered. Please log in.' });
      }
      return res.json({ 
        success: true, 
        verificationRequired: true, 
        phone: phone 
      });
    }

    db.prepare('INSERT INTO users (phone, name, isVerified) VALUES (?, ?, 0)').run(phone, name || null);
    
    res.json({ 
      success: true, 
      verificationRequired: true, 
      phone: phone 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (otp && otp.trim().length > 0) {
      db.prepare('UPDATE users SET isVerified = 1 WHERE phone = ?').run(phone);
      const verifiedUser = db.prepare('SELECT id, phone, name, isVerified FROM users WHERE phone = ?').get(phone);
      res.json({ 
        success: true, 
        user: {
          id: verifiedUser.id,
          phone: verifiedUser.phone,
          name: verifiedUser.name
        }
      });
    } else {
      res.status(400).json({ error: 'Invalid OTP' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login/request-otp', (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    if (!user) {
      return res.status(404).json({ error: 'Phone not found. Please sign up first.' });
    }

    if (user.isVerified !== 1) {
      return res.status(400).json({ error: 'Phone number not verified. Please sign up first.' });
    }

    res.json({ 
      success: true, 
      otpRequired: true, 
      phone: phone 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login/verify-otp', (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified !== 1) {
      return res.status(400).json({ error: 'Phone number not verified. Please sign up first.' });
    }

    if (otp && otp.trim().length > 0) {
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name
        }
      });
    } else {
      res.status(400).json({ error: 'Invalid OTP' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reservation endpoints
app.post('/api/reservations', (req, res) => {
  try {
    const { userId, name, phone, partySize, date, time } = req.body;
    
    if (!name || !phone || !partySize || !date || !time) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = db.prepare(`
      INSERT INTO reservations (user_id, name, phone, party_size, date, time)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId || null, name, phone, partySize, date, time);

    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(result.lastInsertRowid);
    
    // Format reservation for WebSocket event
    const formattedReservation = {
      id: reservation.id,
      customerName: reservation.name,
      date: reservation.date,
      time: reservation.time,
      guestCount: reservation.party_size,
      status: reservation.status || 'confirmed'
    };
    
    // Emit WebSocket event for new reservation
    io.emit('reservation_created', formattedReservation);
    
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all dine-in reservations (for receptionist)
// IMPORTANT: This route must come BEFORE /api/reservations to avoid route conflicts
// Only returns reservations that have associated paid orders (completed reservations)
app.get('/api/reservations/dine-in', (req, res) => {
  try {
    // Get reservations that have associated paid orders
    // This ensures only reservations with completed orders appear in the dashboard
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const reservations = db.prepare(`
      SELECT DISTINCT r.*
      FROM reservations r
      INNER JOIN orders o ON r.id = o.reservation_id
      WHERE r.date >= ?
        AND o.paid = 1
      ORDER BY r.date ASC, r.time ASC
    `).all(today);
    
    console.log('Fetching dine-in reservations with paid orders:', reservations.length, 'found');
    
    // Format reservations to match required structure
    const formattedReservations = reservations.map(r => ({
      id: r.id,
      customerName: r.name,
      date: r.date,
      time: r.time,
      guestCount: r.party_size,
      status: r.status || 'confirmed'
    }));
    
    res.json(formattedReservations);
  } catch (error) {
    console.error('Error fetching dine-in reservations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all reservations (fallback endpoint - returns all reservations)
// IMPORTANT: This must come AFTER /api/reservations/dine-in to avoid route conflicts
app.get('/api/reservations', (req, res) => {
  try {
    const reservations = db.prepare(`
      SELECT * FROM reservations 
      ORDER BY date ASC, time ASC
    `).all();
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get reservations by user ID
app.get('/api/reservations/user/:userId', (req, res) => {
  try {
    const reservations = db
      .prepare('SELECT * FROM reservations WHERE user_id = ? ORDER BY date ASC, time ASC')
      .all(req.params.userId);
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single reservation by ID
app.get('/api/reservations/:id', (req, res) => {
  try {
    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
    if (reservation) {
      res.json(reservation);
    } else {
      res.status(404).json({ error: 'Reservation not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update reservation
app.put('/api/reservations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, partySize, date, time, status } = req.body;
    
    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (partySize !== undefined) {
      updates.push('party_size = ?');
      values.push(partySize);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      values.push(date);
    }
    if (time !== undefined) {
      updates.push('time = ?');
      values.push(time);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const query = `UPDATE reservations SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);
    
    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    // Format reservation for WebSocket event
    const formattedReservation = {
      id: reservation.id,
      customerName: reservation.name,
      date: reservation.date,
      time: reservation.time,
      guestCount: reservation.party_size,
      status: reservation.status || 'confirmed'
    };
    
    // Emit WebSocket event for updated reservation
    io.emit('reservation_updated', formattedReservation);
    
    res.json(reservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete reservation
app.delete('/api/reservations/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    db.prepare('DELETE FROM reservations WHERE id = ?').run(id);
    
    // Emit WebSocket event for deleted reservation
    io.emit('reservation_deleted', { id: parseInt(id) });
    
    res.json({ success: true, message: 'Reservation deleted' });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Order endpoints
app.post('/api/orders', (req, res) => {
  try {
    const { userId, reservationId, serviceMode, items, subtotal, vat, total, paid, deliveryAddress } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    // Validate delivery address for delivery orders
    if (serviceMode === 'delivery' && (!deliveryAddress || !deliveryAddress.trim())) {
      return res.status(400).json({ error: 'Delivery address is required for delivery orders' });
    }

    // Generate confirmation PIN for delivery orders (4-6 digits)
    let confirmationPin = null;
    if (serviceMode === 'delivery') {
      confirmationPin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
    }

    const insertOrder = db.transaction(() => {
      const orderResult = db.prepare(`
        INSERT INTO orders (user_id, reservation_id, service_mode, subtotal, vat, total, paid, delivery_address, confirmation_pin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId || null, reservationId || null, serviceMode, subtotal, vat, total, paid ? 1 : 0, deliveryAddress || null, confirmationPin);

      const orderId = orderResult.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, menu_item_id, quantity, price, status)
        VALUES (?, ?, ?, ?, 'pending')
      `);

      for (const item of items) {
        insertItem.run(orderId, item.id, item.quantity, item.priceEGP);
      }

      return orderId;
    });

    const orderId = insertOrder();
    
    // Fetch order with full details including menu item objects for kitchen display
    const order = db.prepare(`
      SELECT o.*,
             o.confirmation_pin,
             json_group_array(
               json_object(
                 'id', oi.id,
                 'menu_item_id', oi.menu_item_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'status', COALESCE(oi.status, 'pending'),
                 'notes', oi.notes,
                 'menuItem', json_object(
                   'id', mi.id,
                   'name', mi.name,
                   'description', mi.description,
                   'priceEGP', mi.priceEGP,
                   'category', mi.category,
                   'image', mi.image,
                   'popular', CASE WHEN mi.popular = 1 THEN 1 ELSE 0 END,
                   'spicy', COALESCE(mi.spicy, 0),
                   'dietary', mi.dietary
                 )
               )
             ) as items,
             COUNT(oi.id) as items_count,
             r.id as reservation_id
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      LEFT JOIN reservations r ON o.reservation_id = r.id
      WHERE o.id = ?
      GROUP BY o.id
    `).get(orderId);

    // Parse and process items with menuItem objects
    const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
    const processedItems = parsedItems
      .filter(item => item && item.id !== null)
      .map(item => {
        let menuItem = null;
        if (item.menuItem) {
          menuItem = {
            ...item.menuItem,
            popular: item.menuItem.popular === 1,
            dietary: item.menuItem.dietary ? (typeof item.menuItem.dietary === 'string' ? JSON.parse(item.menuItem.dietary) : item.menuItem.dietary) : null
          };
        }
        
        return {
          id: item.id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: item.price,
          status: item.status || 'pending',
          notes: item.notes || null,
          menuItem: menuItem
        };
      });

    // Ensure confirmation PIN is included for delivery orders
    let finalConfirmationPin = order.confirmation_pin;
    if (serviceMode === 'delivery' && !finalConfirmationPin) {
      // Fallback: Generate PIN if somehow missing
      finalConfirmationPin = Math.floor(1000 + Math.random() * 9000).toString();
      // Update the database with the generated PIN
      db.prepare('UPDATE orders SET confirmation_pin = ? WHERE id = ?').run(finalConfirmationPin, orderId);
    }

    const orderWithPaid = {
      ...order,
      paid: order.paid === 1,
      items: processedItems,
      status: order.status || 'pending', // Ensure status is set
      confirmationPin: finalConfirmationPin || null // Include PIN in response for delivery orders
    };
    
    // Emit newOrder event with full structure for kitchen display
    console.log('New order created:', orderWithPaid.id, 'Status:', orderWithPaid.status, 'Service Mode:', orderWithPaid.service_mode);
    io.emit('newOrder', orderWithPaid);
    io.emit('summaryUpdate', { type: 'newOrder' });
    
    if (order.paid === 1) {
      io.emit('revenueUpdate', { type: 'orderPaid', order: orderWithPaid });
    }

    res.json(orderWithPaid);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single order by ID
app.get('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const order = db.prepare(`
      SELECT o.*,
             json_group_array(
               json_object(
                 'id', oi.id,
                 'menu_item_id', oi.menu_item_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'status', COALESCE(oi.status, 'pending')
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `).get(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
    const formattedOrder = {
      ...order,
      items,
      paid: order.paid === 1,
      confirmationPin: order.confirmation_pin || null,
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get order tracking information
app.get('/api/orders/:id/tracking', (req, res) => {
  try {
    const { id } = req.params;
    const order = db.prepare(`
      SELECT o.id, o.status, o.service_mode, o.total, o.delivery_address, o.created_at
      FROM orders o
      WHERE o.id = ?
    `).get(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only allow tracking for delivery orders
    if (order.service_mode !== 'delivery') {
      return res.status(400).json({ error: 'Tracking is only available for delivery orders' });
    }

    // Calculate ETA if order is out for delivery
    let etaMinutes = null;
    let etaTime = null;
    if (order.status === 'out-for-delivery') {
      const now = new Date();
      const created = new Date(order.created_at);
      const minutesSinceCreation = Math.floor((now - created) / (1000 * 60));
      const baseETA = 30;
      const remainingMinutes = Math.max(5, baseETA - minutesSinceCreation);
      etaMinutes = remainingMinutes;
      
      const arrivalTime = new Date(now.getTime() + remainingMinutes * 60000);
      etaTime = arrivalTime.toISOString();
    }

    const trackingData = {
      orderId: order.id,
      status: order.status,
      orderTotal: order.total,
      deliveryAddress: order.delivery_address,
      createdAt: order.created_at,
      etaMinutes: etaMinutes,
      etaTime: etaTime,
      lastUpdated: new Date().toISOString(),
    };

    res.json(trackingData);
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/user/:userId', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, 
             json_group_array(
               json_object(
                 'id', oi.menu_item_id,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all(req.params.userId);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Staff authentication endpoints
app.post('/api/staff/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.prepare('SELECT * FROM staff_users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const result = db.prepare('INSERT INTO staff_users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      name,
      email,
      password, // In production, hash this!
      role || 'staff'
    );

    const user = db.prepare('SELECT id, name, email, role FROM staff_users WHERE id = ?').get(result.lastInsertRowid);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/staff/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT id, name, email, role FROM staff_users WHERE email = ? AND password = ?').get(email, password);
    
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoints
app.get('/api/admin/orders', (req, res) => {
  try {
    const { type, timeRange, status } = req.query;
    let query = `
      SELECT o.*,
             u.name as customerName,
             u.phone as customerPhone,
             json_group_array(
               json_object(
                 'id', oi.id,
                 'menu_item_id', oi.menu_item_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'status', COALESCE(oi.status, 'pending'),
                 'notes', oi.notes,
                 'menuItem', json_object(
                   'id', mi.id,
                   'name', mi.name,
                   'description', mi.description,
                   'priceEGP', mi.priceEGP,
                   'category', mi.category,
                   'image', mi.image,
                   'popular', CASE WHEN mi.popular = 1 THEN 1 ELSE 0 END,
                   'spicy', COALESCE(mi.spicy, 0),
                   'dietary', mi.dietary
                 )
               )
             ) as items,
             COUNT(oi.id) as items_count,
             r.id as reservation_id
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      LEFT JOIN reservations r ON o.reservation_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (type && type !== 'all') {
      query += ' AND o.service_mode = ?';
      params.push(type);
    }

    if (timeRange === 'today') {
      query += " AND DATE(o.created_at) = DATE('now')";
    } else if (timeRange === 'week') {
      query += " AND o.created_at >= datetime('now', '-7 days')";
    }

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC';

    const orders = db.prepare(query).all(...params);
    const ordersWithPaid = orders.map(order => {
      const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
      const validItems = parsedItems
        .filter(item => item && item.id !== null)
        .map(item => {
          // Parse menuItem if it exists and process dietary/popular fields
          let menuItem = null;
          if (item.menuItem) {
            menuItem = {
              ...item.menuItem,
              popular: item.menuItem.popular === 1,
              dietary: item.menuItem.dietary ? (typeof item.menuItem.dietary === 'string' ? JSON.parse(item.menuItem.dietary) : item.menuItem.dietary) : null
            };
          }
          
          return {
            id: item.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            price: item.price,
            status: item.status || 'pending',
            notes: item.notes || null,
            menuItem: menuItem
          };
        });
      return {
        ...order,
        paid: order.paid === 1,
        items: validItems
      };
    });
    res.status(200).json(ordersWithPaid);
  } catch (error) {
    console.error('Admin orders API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/orders/summary', (req, res) => {
  try {
    const { timeRange } = req.query;
    let dateFilter = '';
    
    if (timeRange === 'today') {
      dateFilter = "AND DATE(created_at) = DATE('now')";
    } else if (timeRange === 'week') {
      dateFilter = "AND created_at >= datetime('now', '-7 days')";
    }

    const totalOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE 1=1 ${dateFilter}`).get();
    const completedOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'completed' ${dateFilter}`).get();
    const incompleteOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status != 'completed' ${dateFilter}`).get();

    res.json({
      total: totalOrders.count || 0,
      completed: completedOrders.count || 0,
      incomplete: incompleteOrders.count || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Get order before update to check service_mode
    const orderBefore = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    
    if (status === 'completed') {
      db.prepare('UPDATE orders SET status = ?, paid = 1 WHERE id = ?').run(status, id);
      io.emit('orderPaidChanged', { orderId: id, paid: true });
      io.emit('revenueUpdate', { type: 'orderPaid', orderId: id });
      
      // If order is a delivery order, emit deliveryOrderReady event
      if (orderBefore && orderBefore.service_mode === 'delivery') {
        const deliveryOrder = db.prepare(`
          SELECT o.*, u.name as customerName, u.phone as customerPhone
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          WHERE o.id = ?
        `).get(id);
        
        if (deliveryOrder) {
          io.emit('deliveryOrderReady', {
            id: deliveryOrder.id,
            customerName: deliveryOrder.customerName,
            customerPhone: deliveryOrder.customerPhone,
            deliveryAddress: deliveryOrder.delivery_address,
            total: deliveryOrder.total,
            status: 'completed',
            created_at: deliveryOrder.created_at,
          });
        }
      }
    } else {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    }
    
    io.emit('orderStatusChanged', { orderId: id, status });
    io.emit('summaryUpdate', { type: 'statusChanged' });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/orders/:id/paid', (req, res) => {
  try {
    const { id } = req.params;
    const { paid } = req.body;
    
    db.prepare('UPDATE orders SET paid = ? WHERE id = ?').run(paid ? 1 : 0, id);
    io.emit('orderPaidChanged', { orderId: id, paid });
    
    if (paid) {
      io.emit('revenueUpdate', { type: 'orderPaid', orderId: id });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kitchen endpoints
app.get('/api/kitchen/orders', (req, res) => {
  try {
    // Debug: Check what orders exist
    const allOrdersDebug = db.prepare('SELECT id, status, service_mode FROM orders ORDER BY id DESC LIMIT 10').all();
    console.log('Kitchen API: All recent orders in DB:', JSON.stringify(allOrdersDebug, null, 2));
    
    // Get active orders (pending, preparing) with full menu item details
    const orders = db.prepare(`
      SELECT o.*,
             json_group_array(
               json_object(
                 'id', oi.id,
                 'menu_item_id', oi.menu_item_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'status', COALESCE(oi.status, 'pending'),
                 'notes', oi.notes,
                 'menuItem', json_object(
                   'id', mi.id,
                   'name', mi.name,
                   'description', mi.description,
                   'priceEGP', mi.priceEGP,
                   'category', mi.category,
                   'image', mi.image,
                   'popular', CASE WHEN mi.popular = 1 THEN 1 ELSE 0 END,
                   'spicy', COALESCE(mi.spicy, 0),
                   'dietary', mi.dietary
                 )
               )
             ) as items,
             COUNT(oi.id) as items_count,
             r.id as reservation_id
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      LEFT JOIN reservations r ON o.reservation_id = r.id
      WHERE o.status IN ('pending', 'preparing')
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all();
    
    console.log('Kitchen API: Found', orders.length, 'active orders (pending/preparing)');

    const ordersWithPaid = orders.map(order => {
      const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
      // Filter out null items (from LEFT JOIN when no items exist)
      const validItems = parsedItems
        .filter(item => item && item.id !== null)
        .map(item => {
          // Parse menuItem if it exists and process dietary/popular fields
          let menuItem = null;
          if (item.menuItem) {
            menuItem = {
              ...item.menuItem,
              popular: item.menuItem.popular === 1,
              dietary: item.menuItem.dietary ? (typeof item.menuItem.dietary === 'string' ? JSON.parse(item.menuItem.dietary) : item.menuItem.dietary) : null
            };
          }
          
          return {
            id: item.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            price: item.price,
            status: item.status || 'pending',
            notes: item.notes || null,
            menuItem: menuItem
          };
        });
      return {
        ...order,
        paid: order.paid === 1,
        items: validItems
      };
    });

    console.log('Kitchen API: Returning', ordersWithPaid.length, 'orders');
    res.status(200).json(ordersWithPaid);
  } catch (error) {
    console.error('Kitchen API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/kitchen/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Validate status values for kitchen
    const validStatuses = ['pending', 'preparing', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // If trying to mark as completed, check if all items are ready
    if (status === 'completed') {
      const incompleteItems = db.prepare(`
        SELECT COUNT(*) as count 
        FROM order_items 
        WHERE order_id = ? AND status != 'completed'
      `).get(id);
      
      if (incompleteItems && incompleteItems.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot mark order as ready. Some items are not yet complete.' 
        });
      }
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    
    // Get updated order to return
    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    
    // If order is marked as completed and it's a delivery order, emit deliveryOrderReady event
    if (status === 'completed' && updatedOrder.service_mode === 'delivery') {
      // Fetch full order details with customer info for delivery notification
      const deliveryOrder = db.prepare(`
        SELECT o.*, u.name as customerName, u.phone as customerPhone
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `).get(id);
      
      if (deliveryOrder) {
        io.emit('deliveryOrderReady', {
          id: deliveryOrder.id,
          customerName: deliveryOrder.customerName,
          customerPhone: deliveryOrder.customerPhone,
          deliveryAddress: deliveryOrder.delivery_address,
          total: deliveryOrder.total,
          status: deliveryOrder.status,
          created_at: deliveryOrder.created_at,
        });
      }
    }
    
    // If order is marked as completed and it's a dine-in order, emit orderReadyForWaiter event
    console.log('🔍 Checking if order is dine-in:', { orderId: id, status, service_mode: updatedOrder.service_mode });
    if (status === 'completed' && (updatedOrder.service_mode === 'dine-in' || updatedOrder.service_mode === 'dine_in' || updatedOrder.service_mode === 'Dine-In')) {
      console.log('✅ Order is dine-in and completed, fetching details for waiter notification...');
      // Fetch full order details with items and reservation info for waiter notification
      const waiterOrder = db.prepare(`
        SELECT o.*,
               r.id as reservation_id,
               r.name as reservation_name,
               r.party_size,
               json_group_array(
                 json_object(
                   'id', oi.id,
                   'menu_item_id', oi.menu_item_id,
                   'quantity', oi.quantity,
                   'price', oi.price,
                   'menuItem', json_object(
                     'id', mi.id,
                     'name', mi.name
                   )
                 )
               ) as items
        FROM orders o
        LEFT JOIN reservations r ON o.reservation_id = r.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE o.id = ?
        GROUP BY o.id
      `).get(id);
      
      if (waiterOrder) {
        const items = typeof waiterOrder.items === 'string' ? JSON.parse(waiterOrder.items) : waiterOrder.items || [];
        const formattedItems = items.map(item => ({
          name: item.menuItem?.name || 'Unknown Item',
          quantity: item.quantity
        }));
        
        // Use reservation ID as table identifier (or generate table number from reservation)
        const tableNumber = waiterOrder.reservation_id ? `T${waiterOrder.reservation_id}` : `Order #${waiterOrder.id}`;
        
        const waiterNotification = {
          orderId: parseInt(id),
          tableNumber: tableNumber,
          reservationId: waiterOrder.reservation_id,
          items: formattedItems,
          status: 'completed',
          createdAt: waiterOrder.created_at,
          updatedAt: new Date().toISOString(),
        };
        
        console.log('🍽️ Emitting orderReadyForWaiter event for order:', id, waiterNotification);
        io.emit('orderReadyForWaiter', waiterNotification);
      }
    }
    
    io.emit('orderStatusChanged', { orderId: parseInt(id), status });
    io.emit('kitchenOrderUpdate', { orderId: parseInt(id), status });
    
    res.status(200).json({ 
      success: true, 
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/kitchen/order-items/:itemId/status', (req, res) => {
  try {
    const { itemId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Validate status values
    const validStatuses = ['pending', 'preparing', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Check if item exists
    const existingItem = db.prepare('SELECT id, order_id FROM order_items WHERE id = ?').get(itemId);
    if (!existingItem) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    db.prepare('UPDATE order_items SET status = ? WHERE id = ?').run(status, itemId);
    
    // Get updated item with menu name
    const updatedItem = db.prepare(`
      SELECT oi.*, mi.name as menu_item_name
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.id = ?
    `).get(itemId);
    
    // Emit update
    io.emit('kitchenOrderUpdate', { 
      orderId: existingItem.order_id, 
      itemId: parseInt(itemId), 
      status 
    });
    
    res.status(200).json({ 
      success: true,
      item: {
        id: updatedItem.id,
        orderId: existingItem.order_id,
        status: updatedItem.status,
        menu_item_name: updatedItem.menu_item_name
      }
    });
  } catch (error) {
    console.error('Error updating item status:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/revenue', (req, res) => {
  try {
    const { timeRange } = req.query;
    let dateFilter = '';
    
    if (timeRange === 'today') {
      dateFilter = "AND DATE(created_at) = DATE('now')";
    } else if (timeRange === 'week') {
      dateFilter = "AND created_at >= datetime('now', '-7 days')";
    } else if (timeRange === 'month') {
      dateFilter = "AND created_at >= datetime('now', '-30 days')";
    }

    const revenue = db.prepare(`
      SELECT 
        service_mode,
        SUM(total) as total,
        COUNT(*) as count
      FROM orders
      WHERE (paid = 1 OR status = 'completed') ${dateFilter}
      GROUP BY service_mode
    `).all();

    const summary = {
      today: db.prepare(`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE (paid = 1 OR status = 'completed') AND DATE(created_at) = DATE('now')`).get().total || 0,
      week: db.prepare(`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE (paid = 1 OR status = 'completed') AND created_at >= datetime('now', '-7 days')`).get().total || 0,
      month: db.prepare(`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE (paid = 1 OR status = 'completed') AND created_at >= datetime('now', '-30 days')`).get().total || 0,
      byType: revenue
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delivery endpoints
app.get('/api/delivery/orders', (req, res) => {
  try {
    // Get all delivery orders (include pending and preparing so delivery can see all orders)
    const orders = db.prepare(`
      SELECT o.*, 
             u.name as customerName, 
             u.phone as customerPhone,
             json_group_array(
               json_object(
                 'id', oi.id,
                 'menu_item_id', oi.menu_item_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'status', COALESCE(oi.status, 'pending'),
                 'notes', oi.notes,
                 'menuItem', json_object(
                   'id', mi.id,
                   'name', mi.name,
                   'description', mi.description,
                   'priceEGP', mi.priceEGP,
                   'category', mi.category,
                   'image', mi.image,
                   'popular', CASE WHEN mi.popular = 1 THEN 1 ELSE 0 END,
                   'spicy', COALESCE(mi.spicy, 0),
                   'dietary', mi.dietary
                 )
               )
             ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.service_mode = 'delivery'
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all();

    // Parse items JSON
    const formattedOrders = orders.map(order => {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
      return {
        ...order,
        items,
        verified: order.verified === 1,
        paid: order.paid === 1,
        deliveryAddress: order.delivery_address,
      };
    });

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/delivery/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const order = db.prepare(`
      SELECT o.*, 
             u.name as customerName, 
             u.phone as customerPhone,
             json_group_array(
               json_object(
                 'id', oi.id,
                 'menu_item_id', oi.menu_item_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'status', COALESCE(oi.status, 'pending'),
                 'notes', oi.notes,
                 'menuItem', json_object(
                   'id', mi.id,
                   'name', mi.name,
                   'description', mi.description,
                   'priceEGP', mi.priceEGP,
                   'category', mi.category,
                   'image', mi.image,
                   'popular', CASE WHEN mi.popular = 1 THEN 1 ELSE 0 END,
                   'spicy', COALESCE(mi.spicy, 0),
                   'dietary', mi.dietary
                 )
               )
             ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.id = ? AND o.service_mode = 'delivery'
      GROUP BY o.id
    `).get(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
    const formattedOrder = {
      ...order,
      items,
      verified: order.verified === 1,
      paid: order.paid === 1,
      deliveryAddress: order.delivery_address,
      confirmation_pin: order.confirmation_pin, // Include PIN for delivery man to validate
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching delivery order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update delivery order (for updating address)
app.put('/api/delivery/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryAddress } = req.body;
    
    // Check if order exists and is a delivery order
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND service_mode = ?').get(id, 'delivery');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update delivery address
    if (deliveryAddress !== undefined) {
      db.prepare('UPDATE orders SET delivery_address = ? WHERE id = ?').run(deliveryAddress, id);
    }

    // Fetch updated order with full details
    const updatedOrder = db.prepare(`
      SELECT o.*, 
             u.name as customerName, 
             u.phone as customerPhone,
             json_group_array(
               json_object(
                 'id', oi.id,
                 'menu_item_id', oi.menu_item_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'status', COALESCE(oi.status, 'pending'),
                 'notes', oi.notes,
                 'menuItem', json_object(
                   'id', mi.id,
                   'name', mi.name,
                   'description', mi.description,
                   'priceEGP', mi.priceEGP,
                   'category', mi.category,
                   'image', mi.image,
                   'popular', CASE WHEN mi.popular = 1 THEN 1 ELSE 0 END,
                   'spicy', COALESCE(mi.spicy, 0),
                   'dietary', mi.dietary
                 )
               )
             ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.id = ?
      GROUP BY o.id
    `).get(id);

    const items = typeof updatedOrder.items === 'string' ? JSON.parse(updatedOrder.items) : updatedOrder.items || [];
    const formattedOrder = {
      ...updatedOrder,
      items,
      verified: updatedOrder.verified === 1,
      paid: updatedOrder.paid === 1,
      deliveryAddress: updatedOrder.delivery_address,
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Error updating delivery order:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/delivery/orders/:id/verify', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if order exists and is a delivery order
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND service_mode = ?').get(id, 'delivery');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is ready for verification (status must be completed)
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Order must be ready for pickup before verification' });
    }

    // Update order as verified
    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET verified = 1, verified_at = ? WHERE id = ?').run(now, id);

    // Fetch updated order
    const updatedOrder = db.prepare(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(id);

    const formattedOrder = {
      ...updatedOrder,
      verified: true,
      verified_at: now,
      deliveryAddress: updatedOrder.delivery_address,
    };

    io.emit('orderStatusChanged', { orderId: parseInt(id), status: updatedOrder.status });
    
    res.json(formattedOrder);
  } catch (error) {
    console.error('Error verifying order:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/delivery/orders/:id/acknowledge', (req, res) => {
  try {
    const { id } = req.params;
    
    // Mark notification as acknowledged
    db.prepare('UPDATE orders SET acknowledged = 1 WHERE id = ?').run(id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error acknowledging notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Waiter endpoints
app.get('/api/waiter/orders', (req, res) => {
  try {
    const { filter = 'ready' } = req.query; // filter: 'ready', 'served', 'all'
    
    let whereClause = "WHERE o.service_mode IN ('dine-in', 'dine_in', 'Dine-In')";
    
    if (filter === 'ready') {
      whereClause += " AND o.status = 'completed' AND (o.served IS NULL OR o.served = 0)";
    } else if (filter === 'served') {
      whereClause += " AND o.served = 1";
    }
    // 'all' shows all dine-in orders regardless of status
    
    const orders = db.prepare(`
      SELECT o.*,
             r.id as reservation_id,
             r.name as reservation_name,
             r.party_size,
             json_group_array(
               json_object(
                 'id', oi.id,
                 'menu_item_id', oi.menu_item_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'menuItem', json_object(
                   'id', mi.id,
                   'name', mi.name
                 )
               )
             ) as items
      FROM orders o
      LEFT JOIN reservations r ON o.reservation_id = r.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all();
    
    const formattedOrders = orders.map(order => {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
      const formattedItems = items.map(item => ({
        name: item.menuItem?.name || 'Unknown Item',
        quantity: item.quantity
      }));
      
      const tableNumber = order.reservation_id ? `T${order.reservation_id}` : `Order #${order.id}`;
      
      return {
        orderId: order.id,
        tableNumber: tableNumber,
        reservationId: order.reservation_id,
        items: formattedItems,
        status: order.status,
        served: order.served === 1,
        servedAt: order.served_at,
        createdAt: order.created_at,
        updatedAt: order.updated_at || order.created_at,
      };
    });
    
    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders for waiter:', error);
    res.status(500).json({ error: error.message });
  }
});

// Keep backward compatibility
app.get('/api/waiter/orders/ready', (req, res) => {
  // Use the same logic as the main endpoint with filter=ready
  try {
    const readyOrders = db.prepare(`
      SELECT o.*,
             r.id as reservation_id,
             r.name as reservation_name,
             r.party_size,
             json_group_array(
               json_object(
                 'id', oi.id,
                 'menu_item_id', oi.menu_item_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'menuItem', json_object(
                   'id', mi.id,
                   'name', mi.name
                 )
               )
             ) as items
      FROM orders o
      LEFT JOIN reservations r ON o.reservation_id = r.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.service_mode IN ('dine-in', 'dine_in')
        AND o.status = 'completed'
        AND (o.served IS NULL OR o.served = 0)
      GROUP BY o.id
      ORDER BY o.created_at ASC
    `).all();
    
    const formattedOrders = readyOrders.map(order => {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
      const formattedItems = items.map(item => ({
        name: item.menuItem?.name || 'Unknown Item',
        quantity: item.quantity
      }));
      
      const tableNumber = order.reservation_id ? `T${order.reservation_id}` : `Order #${order.id}`;
      
      return {
        orderId: order.id,
        tableNumber: tableNumber,
        reservationId: order.reservation_id,
        items: formattedItems,
        status: order.status,
        served: order.served === 1,
        servedAt: order.served_at,
        createdAt: order.created_at,
        updatedAt: order.updated_at || order.created_at,
      };
    });
    
    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching ready orders for waiter:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/waiter/orders/:id/mark-served', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if order exists and is a dine-in order
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND service_mode IN (?, ?)').get(id, 'dine-in', 'dine_in');
    if (!order) {
      return res.status(404).json({ error: 'Order not found or not a dine-in order' });
    }
    
    // Check if order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Order must be completed before marking as served' });
    }
    
    // Mark order as served
    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET served = 1, served_at = ? WHERE id = ?').run(now, id);
    
    // Fetch updated order
    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    
    // Emit WebSocket event to notify that order was served
    io.emit('orderServed', { orderId: parseInt(id) });
    io.emit('orderStatusChanged', { orderId: parseInt(id), status: 'served' });
    
    res.json({ 
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        served: updatedOrder.served === 1,
        served_at: now
      }
    });
  } catch (error) {
    console.error('Error marking order as served:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark order as out for delivery
app.post('/api/delivery/orders/:id/start-delivery', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if order exists and is a delivery order
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND service_mode = ?').get(id, 'delivery');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Guard: Order must be verified before starting delivery
    if (!order.verified || order.verified === 0) {
      return res.status(400).json({ error: 'Order must be verified before starting delivery' });
    }

    // Update order status to out-for-delivery
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('out-for-delivery', id);

    // Fetch updated order
    const updatedOrder = db.prepare(`
      SELECT o.*, 
             u.name as customerName, 
             u.phone as customerPhone,
             json_group_array(
               json_object(
                 'id', oi.id,
                 'menu_item_id', oi.menu_item_id,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'status', COALESCE(oi.status, 'pending'),
                 'notes', oi.notes,
                 'menuItem', json_object(
                   'id', mi.id,
                   'name', mi.name,
                   'description', mi.description,
                   'priceEGP', mi.priceEGP,
                   'category', mi.category,
                   'image', mi.image,
                   'popular', CASE WHEN mi.popular = 1 THEN 1 ELSE 0 END,
                   'spicy', COALESCE(mi.spicy, 0),
                   'dietary', mi.dietary
                 )
               )
             ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.id = ?
      GROUP BY o.id
    `).get(id);

    const items = typeof updatedOrder.items === 'string' ? JSON.parse(updatedOrder.items) : updatedOrder.items || [];
    const formattedOrder = {
      ...updatedOrder,
      items,
      verified: updatedOrder.verified === 1,
      paid: updatedOrder.paid === 1,
      deliveryAddress: updatedOrder.delivery_address,
      confirmation_pin: updatedOrder.confirmation_pin,
    };

    // Emit WebSocket event for real-time tracking update
    io.emit('orderStatusChanged', { orderId: parseInt(id), status: 'out-for-delivery' });
    
    res.json(formattedOrder);
  } catch (error) {
    console.error('Error starting delivery:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/delivery/orders/:id/deliver', (req, res) => {
  try {
    const { id } = req.params;
    const { confirmationMethod, confirmationPin } = req.body;
    
    // Check if order exists and is a delivery order
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND service_mode = ?').get(id, 'delivery');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Guard: Order must be verified before delivery
    if (!order.verified || order.verified === 0) {
      return res.status(400).json({ error: 'Order must be verified before marking as delivered' });
    }

    // Validate PIN is provided
    if (!confirmationPin || !confirmationPin.trim()) {
      return res.status(400).json({ error: 'Confirmation PIN is required' });
    }

    // Validate PIN matches the order's stored confirmation PIN
    if (!order.confirmation_pin || order.confirmation_pin.trim() !== confirmationPin.trim()) {
      return res.status(400).json({ error: 'Invalid confirmation PIN. Please check and try again.' });
    }

    // Store PIN as confirmation
    const confirmationText = `PIN: ${confirmationPin.trim()}`;

    // Update order as delivered
    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, customer_confirmation = ?, delivered_at = ? WHERE id = ?')
      .run('delivered', confirmationText, now, id);

    // Fetch updated order
    const updatedOrder = db.prepare(`
      SELECT o.*, u.name as customerName, u.phone as customerPhone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(id);

    const formattedOrder = {
      ...updatedOrder,
      verified: updatedOrder.verified === 1,
      deliveryAddress: updatedOrder.delivery_address,
      customer_confirmation: confirmationText,
      delivered_at: now,
    };

    // Emit WebSocket events for real-time updates
    io.emit('orderStatusChanged', { orderId: parseInt(id), status: 'delivered' });
    io.emit('summaryUpdate', { type: 'statusChanged' });
    
    res.json(formattedOrder);
  } catch (error) {
    console.error('Error marking order as delivered:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/delivery/notifications', (req, res) => {
  try {
    // Get all delivery orders that are ready for pickup and not yet acknowledged
    const orders = db.prepare(`
      SELECT o.id, o.status, o.created_at,
             u.name as customerName,
             o.delivery_address as deliveryAddress,
             o.acknowledged
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.service_mode = 'delivery'
        AND o.status = 'completed'
      ORDER BY o.created_at DESC
    `).all();

    const notifications = orders.map(order => ({
      id: order.id,
      customerName: order.customerName,
      deliveryAddress: order.deliveryAddress,
      status: order.status,
      acknowledged: order.acknowledged === 1,
      created_at: order.created_at,
    }));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Admin client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Admin client disconnected:', socket.id);
  });
});

app.locals.io = io;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

