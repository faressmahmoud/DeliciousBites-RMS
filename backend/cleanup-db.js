/**
 * Database Cleanup Script
 * 
 * This script removes all test data while preserving:
 * - Menu items (seed data)
 * - Staff users (demo accounts)
 * - Database schema
 * 
 * Run with: node backend/cleanup-db.js
 */

const db = require('./db');

console.log('🧹 Starting database cleanup...\n');

// Start transaction for safety
const cleanup = db.transaction(() => {
  // 1. Delete all order items (cascade will handle orders)
  const orderItemsDeleted = db.prepare('DELETE FROM order_items').run();
  console.log(`✅ Deleted ${orderItemsDeleted.changes} order items`);

  // 2. Delete all orders
  const ordersDeleted = db.prepare('DELETE FROM orders').run();
  console.log(`✅ Deleted ${ordersDeleted.changes} orders`);

  // 3. Delete all reservations
  const reservationsDeleted = db.prepare('DELETE FROM reservations').run();
  console.log(`✅ Deleted ${reservationsDeleted.changes} reservations`);

  // 4. Delete all customer users (keep staff users)
  const usersDeleted = db.prepare('DELETE FROM users').run();
  console.log(`✅ Deleted ${usersDeleted.changes} customer users`);

  // 5. Delete all staff users (we'll recreate demo accounts)
  const staffDeleted = db.prepare('DELETE FROM staff_users').run();
  console.log(`✅ Deleted ${staffDeleted.changes} staff users`);

  // 6. Reset AUTOINCREMENT counters (optional, but keeps IDs clean)
  db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('orders', 'order_items', 'reservations', 'users', 'staff_users')`);
  console.log(`✅ Reset AUTOINCREMENT counters`);

  // 7. Re-seed demo staff accounts
  const insertStaff = db.prepare(`
    INSERT INTO staff_users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `);

  const demoAccounts = [
    { name: 'Manager', email: 'manager@example.com', password: 'password123', role: 'manager' },
    { name: 'Kitchen Staff', email: 'kitchen@example.com', password: 'password123', role: 'kitchen' },
    { name: 'Waiter', email: 'waiter@example.com', password: 'password123', role: 'waiter' },
    { name: 'Receptionist', email: 'reception@example.com', password: 'password123', role: 'reception' },
    { name: 'Delivery Driver', email: 'delivery@example.com', password: 'password123', role: 'delivery' },
  ];

  for (const account of demoAccounts) {
    try {
      insertStaff.run(account.name, account.email, account.password, account.role);
      console.log(`✅ Created demo account: ${account.email} (${account.role})`);
    } catch (error) {
      if (error.message.includes('UNIQUE constraint')) {
        console.log(`⚠️  Account ${account.email} already exists, skipping...`);
      } else {
        console.error(`❌ Error creating ${account.email}:`, error.message);
      }
    }
  }

  // 8. Verify menu items are intact
  const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();
  console.log(`\n✅ Menu items preserved: ${menuCount.count} items`);

  // 9. Verify cleanup
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const reservationCount = db.prepare('SELECT COUNT(*) as count FROM reservations').get();
  const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff_users').get();

  console.log('\n📊 Database Status:');
  console.log(`   Orders: ${orderCount.count}`);
  console.log(`   Users: ${userCount.count}`);
  console.log(`   Reservations: ${reservationCount.count}`);
  console.log(`   Staff Users: ${staffCount.count}`);
  console.log(`   Menu Items: ${menuCount.count}`);

  console.log('\n✨ Database cleanup completed successfully!');
});

// Run cleanup
try {
  cleanup();
} catch (error) {
  console.error('❌ Error during cleanup:', error);
  process.exit(1);
}

