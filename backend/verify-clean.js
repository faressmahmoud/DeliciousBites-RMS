/**
 * Database Verification Script
 * 
 * Verifies that the database is clean and ready for testing
 */

const db = require('./db');

console.log('🔍 Verifying database state...\n');

// Check counts
const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();
const orderItemCount = db.prepare('SELECT COUNT(*) as count FROM order_items').get();
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
const reservationCount = db.prepare('SELECT COUNT(*) as count FROM reservations').get();
const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff_users').get();
const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();

console.log('📊 Database Counts:');
console.log(`   Orders: ${orderCount.count} (expected: 0)`);
console.log(`   Order Items: ${orderItemCount.count} (expected: 0)`);
console.log(`   Users: ${userCount.count} (expected: 0)`);
console.log(`   Reservations: ${reservationCount.count} (expected: 0)`);
console.log(`   Staff Users: ${staffCount.count} (expected: 5)`);
console.log(`   Menu Items: ${menuCount.count} (expected: 15)`);

// Check staff users
console.log('\n👥 Staff Users:');
const staffUsers = db.prepare('SELECT id, name, email, role FROM staff_users ORDER BY role').all();
staffUsers.forEach(user => {
  console.log(`   ✅ ${user.email} (${user.role}) - ${user.name}`);
});

// Verify delivery account exists
const deliveryUser = db.prepare('SELECT * FROM staff_users WHERE email = ?').get('delivery@example.com');
if (deliveryUser) {
  console.log('\n✅ Delivery demo account verified: delivery@example.com');
} else {
  console.log('\n❌ ERROR: Delivery demo account NOT FOUND!');
}

// Check menu items
console.log(`\n🍽️  Menu Items: ${menuCount.count} items preserved`);

// Summary
const isClean = orderCount.count === 0 && 
                orderItemCount.count === 0 && 
                userCount.count === 0 && 
                reservationCount.count === 0 &&
                staffCount.count === 5 &&
                menuCount.count === 15 &&
                deliveryUser !== undefined;

if (isClean) {
  console.log('\n✨ Database is clean and ready for testing!');
} else {
  console.log('\n⚠️  WARNING: Database may not be fully clean. Please review the counts above.');
}

