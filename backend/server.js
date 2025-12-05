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
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

app.get('/api/reservations/user/:userId', (req, res) => {
  try {
    const reservations = db
      .prepare('SELECT * FROM reservations WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.params.userId);
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Order endpoints
app.post('/api/orders', (req, res) => {
  try {
    const { userId, reservationId, serviceMode, items, subtotal, vat, total, paid } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    const insertOrder = db.transaction(() => {
      const orderResult = db.prepare(`
        INSERT INTO orders (user_id, reservation_id, service_mode, subtotal, vat, total, paid)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userId || null, reservationId || null, serviceMode, subtotal, vat, total, paid ? 1 : 0);

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
    
    // Fetch order with full details including menu item names for kitchen display
    const order = db.prepare(`
      SELECT o.*,
             json_group_array(
               json_object(
                 'id', oi.id,
                 'menu_item_id', oi.menu_item_id,
                 'menu_item_name', mi.name,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'status', COALESCE(oi.status, 'pending'),
                 'notes', oi.notes
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

    const orderWithPaid = {
      ...order,
      paid: order.paid === 1,
      status: order.status || 'pending', // Ensure status is set
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []
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
             json_group_array(
               json_object(
                 'id', oi.menu_item_id,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items,
             COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
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
    const ordersWithPaid = orders.map(order => ({ ...order, paid: order.paid === 1 }));
    res.json(ordersWithPaid);
  } catch (error) {
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
    
    if (status === 'completed') {
      db.prepare('UPDATE orders SET status = ?, paid = 1 WHERE id = ?').run(status, id);
      io.emit('orderPaidChanged', { orderId: id, paid: true });
      io.emit('revenueUpdate', { type: 'orderPaid', orderId: id });
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
                 'menu_item_name', COALESCE(mi.name, 'Unknown Item'),
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'status', COALESCE(oi.status, 'pending'),
                 'notes', oi.notes
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
      const validItems = parsedItems.filter(item => item && item.id !== null);
      return {
        ...order,
        paid: order.paid === 1,
        items: validItems
      };
    });

    console.log('Kitchen API: Returning', ordersWithPaid.length, 'orders');
    res.json(ordersWithPaid);
  } catch (error) {
    console.error('Kitchen API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/kitchen/orders/:id/status', (req, res) => {
  try {
    // Get active orders (pending, preparing) with full menu item details
    const orders = db.prepare(`
      SELECT o.*,
             json_group_array(
               json_object(
                 'id', oi.id,
                 'menu_item_id', oi.menu_item_id,
                 'menu_item_name', mi.name,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'status', COALESCE(oi.status, 'pending'),
                 'notes', oi.notes
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

    const ordersWithPaid = orders.map(order => ({
      ...order,
      paid: order.paid === 1,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []
    }));

    res.json(ordersWithPaid);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/kitchen/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status values for kitchen
    const validStatuses = ['pending', 'preparing', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // If trying to mark as completed, check if all items are ready
    if (status === 'completed') {
      const incompleteItems = db.prepare(`
        SELECT COUNT(*) as count 
        FROM order_items 
        WHERE order_id = ? AND status != 'completed'
      `).get(id);
      
      if (incompleteItems.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot mark order as ready. Some items are not yet complete.' 
        });
      }
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    
    io.emit('orderStatusChanged', { orderId: parseInt(id), status });
    io.emit('kitchenOrderUpdate', { orderId: parseInt(id), status });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/kitchen/order-items/:itemId/status', (req, res) => {
  try {
    const { itemId } = req.params;
    const { status } = req.body;
    
    // Validate status values
    const validStatuses = ['pending', 'preparing', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    db.prepare('UPDATE order_items SET status = ? WHERE id = ?').run(status, itemId);
    
    // Get order ID to emit update
    const orderItem = db.prepare('SELECT order_id FROM order_items WHERE id = ?').get(itemId);
    if (orderItem) {
      io.emit('kitchenOrderUpdate', { orderId: orderItem.order_id, itemId: parseInt(itemId), status });
    }
    
    res.json({ success: true });
  } catch (error) {
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

