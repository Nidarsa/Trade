const sqlite3 = require('sqlite3').verbose();
const logger = require('winston');

// Initialize database connection
const db = new sqlite3.Database('database.db', (err) => {
  if (err) {
    logger.error(`Database connection error: ${err.message}`);
    process.exit(1);
  }
  // Enable foreign key constraints
  db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) {
      logger.error(`Error enabling foreign keys: ${err.message}`);
      process.exit(1);
    }
    logger.info('Database connection established with foreign keys enabled');
  });
});

// Helper function to check if a table exists
const tableExists = async (tableName) => {
  return new Promise((resolve) => {
    db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName],
      (err, row) => {
        if (err) {
          logger.error(`Error checking table existence: ${err.message}`);
          resolve(false);
        } else {
          resolve(!!row);
        }
      }
    );
  });
};

// Initialize schema only if necessary
const initializeSchema = async () => {
  try {
    // Check if the 'users' table exists as a proxy for schema initialization
    const schemaExists = await tableExists('users');

    if (schemaExists) {
      logger.info('Database schema already initialized, skipping creation');
      return;
    }

    const schema = `
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'seller', 'buyer')),
        balance REAL DEFAULT 0,
        approved INTEGER DEFAULT 0
      );

      CREATE TABLE sellers (
        userId INTEGER PRIMARY KEY,
        msmeNumber TEXT NOT NULL,
        msmeDoc TEXT NOT NULL,
        address TEXT NOT NULL,
        adharNumber TEXT NOT NULL,
        accountNumber TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sellerId INTEGER NOT NULL,
        image TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (sellerId) REFERENCES users(id)
      );

      CREATE INDEX idx_products_id_sellerId ON products(id, sellerId);

      CREATE TABLE cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyerId INTEGER NOT NULL,
        productId INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (buyerId) REFERENCES users(id),
        FOREIGN KEY (productId) REFERENCES products(id)
      );

      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyerId INTEGER NOT NULL,
        sellerId INTEGER NOT NULL,
        productId INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        total REAL NOT NULL,
        paymentStatus TEXT NOT NULL CHECK(paymentStatus IN ('pending', 'completed', 'failed', 'canceled')),
        deliveryStatus TEXT NOT NULL CHECK(deliveryStatus IN ('pending', 'shipped', 'delivered', 'canceled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyerId) REFERENCES users(id),
        FOREIGN KEY (sellerId) REFERENCES users(id),
        FOREIGN KEY (productId) REFERENCES products(id)
      );

      CREATE TABLE seller_approvals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        adminId INTEGER NOT NULL,
        approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (adminId) REFERENCES users(id)
      );
    `;

    await new Promise((resolve, reject) => {
      db.exec(schema, (err) => {
        if (err) {
          logger.error(`Database schema creation error: ${err.message}`);
          reject(err);
        } else {
          logger.info('Database schema initialized');
          resolve();
        }
      });
    });
  } catch (err) {
    logger.error(`Failed to initialize schema: ${err.message}`);
    throw err;
  }
};

// Basic migration function for future schema changes
const applyMigrations = async () => {
  try {
    // Example migration: Add a new column to 'products' table if it doesn't exist
    const addColumnQuery = `
      ALTER TABLE products ADD COLUMN category TEXT;
    `;
    const productsTableExists = await tableExists('products');

    if (productsTableExists) {
      // Check if the 'category' column exists (SQLite doesn't support direct column existence check)
      // Instead, try adding the column and handle the error if it already exists
      await new Promise((resolve, reject) => {
        db.run(addColumnQuery, (err) => {
          if (err && err.message.includes('duplicate column name')) {
            logger.info('Column "category" already exists in products table');
            resolve();
          } else if (err) {
            logger.error(`Migration error: ${err.message}`);
            reject(err);
          } else {
            logger.info('Added "category" column to products table');
            resolve();
          }
        });
      });
    }

    logger.info('All migrations applied successfully');
  } catch (err) {
    logger.error(`Failed to apply migrations: ${err.message}`);
    throw err;
  }
};

// Initialize database and apply migrations
const initializeDatabase = async () => {
  try {
    await initializeSchema();
    await applyMigrations();
    logger.info('Database fully initialized and migrations applied');
  } catch (err) {
    logger.error(`Database initialization failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = db;
module.exports.initializeSchema = initializeSchema;
module.exports.initializeDatabase = initializeDatabase;