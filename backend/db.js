const Database = require('better-sqlite3');
const path = require('path');
const menuData = require('./menuData');

const dbPath = path.join(__dirname, 'deliciousbites.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
function initializeDatabase() {
  // Menu items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      priceEGP REAL NOT NULL,
      category TEXT NOT NULL,
      image TEXT,
      popular INTEGER DEFAULT 0,
      spicy INTEGER DEFAULT 0,
      dietary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT,
      password TEXT,
      isVerified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    db.exec(`ALTER TABLE users ADD COLUMN isVerified INTEGER DEFAULT 0`);
  } catch (e) {
    // column exists
  }

  // Reservations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      party_size INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT DEFAULT 'confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      reservation_id INTEGER,
      service_mode TEXT NOT NULL,
      subtotal REAL NOT NULL,
      vat REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      paid INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (reservation_id) REFERENCES reservations(id)
    )
  `);

  try {
    db.exec(`ALTER TABLE orders ADD COLUMN paid INTEGER DEFAULT 0`);
  } catch (e) {
    // column exists
  }

  // Order items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    )
  `);

  // Add status and notes columns if they don't exist
  try {
    db.exec(`ALTER TABLE order_items ADD COLUMN status TEXT DEFAULT 'pending'`);
  } catch (e) {
    // column exists
  }
  try {
    db.exec(`ALTER TABLE order_items ADD COLUMN notes TEXT`);
  } catch (e) {
    // column exists
  }

  // Staff users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrate menu data if table is empty
  const count = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();
  if (count.count === 0) {
    const insert = db.prepare(`
      INSERT INTO menu_items (name, description, priceEGP, category, image, popular, spicy, dietary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insert.run(
          item.name,
          item.description,
          item.priceEGP,
          item.category,
          item.image,
          item.popular ? 1 : 0,
          item.spicy || 0,
          item.dietary ? JSON.stringify(item.dietary) : null
        );
      }
    });

    insertMany(menuData);
    console.log(`Migrated ${menuData.length} menu items to database`);
  }
}

// Initialize database on first load
initializeDatabase();

module.exports = db;

