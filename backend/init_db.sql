CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'buyer', 'seller')),
    balance REAL DEFAULT 0,
    approved INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sellers (
    userId INTEGER PRIMARY KEY,
    msmeNumber TEXT NOT NULL,
    msmeDoc TEXT NOT NULL,
    address TEXT NOT NULL,
    adharNumber TEXT NOT NULL,
    accountNumber TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sellerId INTEGER NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY(sellerId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyerId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY(buyerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(productId) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyerId INTEGER NOT NULL,
    sellerId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    total REAL NOT NULL,
    paymentStatus TEXT NOT NULL,
    deliveryStatus TEXT NOT NULL,
    FOREIGN KEY(buyerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(sellerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(productId) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seller_unofficial
CREATE TABLE IF NOT EXISTS seller_approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    adminId INTEGER NOT NULL,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(adminId) REFERENCES users(id) ON DELETE CASCADE
);