const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('winston');
const db = require('./config/db');

// Configure logging
logger.configure({
  transports: [
    new logger.transports.Console({
      format: logger.format.combine(
        logger.format.timestamp(),
        logger.format.printf(({ timestamp, level, message }) => `${timestamp} - ${level.toUpperCase()} - ${message}`)
      )
    })
  ]
});

// Initialize Express app
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Configuration
const UPLOAD_FOLDER = 'uploads';
const ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx']);
const SECRET_KEY = 'your-secret-key'; // Replace with secure key in production
const PORT = 5000;

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Initialize database schema and admin user
const initDb = async () => {
  try {
    await db.initializeSchema();

    // Create default admin user
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO users (name, username, email, password, phone, address, role, balance, approved)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Admin User', 'admin', adminEmail, hashedPassword, '1234567890', 'Admin Address', 'admin', 0, 1],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    logger.info('Database initialized, admin user created if not exists');
  } catch (err) {
    logger.error(`Database initialization error: ${err.message}`);
    process.exit(1);
  }
};

// Middleware to verify JWT
const tokenRequired = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    logger.warn('Token missing');
    return res.status(401).json({ message: 'Token is missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const data = jwt.verify(token, SECRET_KEY);
    db.get('SELECT id, role FROM users WHERE id = ?', [data.user_id], (err, user) => {
      if (err || !user) {
        logger.warn('Token user not found');
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = user;
      next();
    });
  } catch (err) {
    logger.warn(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
    return res.status(401).json({ message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
  }
};

// Debug route registration
const debugRoute = (method, path) => {
  console.log(`Registering ${method} route: ${path}`);
  logger.debug(`Registering ${method} route: ${path}`);
};
debugRoute('GET', '/api/auth/verify');
app.get('/api/auth/verify', tokenRequired, (req, res) => {
  db.get('SELECT id, name, username, email, role, balance FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) {
      logger.warn(`User not found for verify: ${req.user.id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    logger.info(`Token verified for userId ${req.user.id}`);
    res.json({ user });
  });
});
// Auth Routes
debugRoute('POST', '/api/auth/register');
app.post('/api/auth/register', async (req, res) => {
  const { name, username, email, password, phone, address, role } = req.body;
  if (!name || !username || !email || !password || !phone || !address || !role) {
    logger.warn('Missing fields in registration request');
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (name, username, email, password, phone, address, role, balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [name, username, email, hashedPassword, phone, address, role],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            logger.warn(`Registration failed: User ${email} already exists`);
            return res.status(400).json({ message: 'User already exists' });
          }
          logger.error(`Database error during registration: ${err.message}`);
          return res.status(500).json({ message: 'Internal server error' });
        }
        logger.info(`User registered: ${email}, userId: ${this.lastID}`);
        res.status(201).json({ message: 'User registered', userId: this.lastID });
      }
    );
  } catch (err) {
    logger.error(`Error during registration: ${err.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

debugRoute('POST', '/api/auth/login');
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    logger.warn('Missing email or password in login request');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user || !(await bcrypt.compare(password, user.password))) {
      logger.warn(`Login failed for ${email}: Invalid credentials`);
      return res.status(400).json({ message: 'User not found or invalid password' });
    }
    if (user.role === 'seller' && !user.approved) {
      logger.warn(`Login failed for ${email}: Seller not approved`);
      return res.status(403).json({ message: 'Seller not approved' });
    }

    const token = jwt.sign(
      { user_id: user.id, role: user.role },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    logger.info(`User logged in: ${email}`);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance
      }
    });
  });
});

// Admin Routes
debugRoute('GET', '/api/admin/pending-sellers');
app.get('/api/admin/pending-sellers', (req, res) => {
  db.all(
    `SELECT u.id, u.name, u.email, s.msmeNumber, s.address, s.msmeDoc, s.adharNumber, s.accountNumber
     FROM users u
     JOIN sellers s ON u.id = s.userId
     WHERE u.approved = 0 AND u.role = 'seller'`,
    (err, sellers) => {
      if (err) {
        logger.error(`Database error in get_pending_sellers: ${err.message}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
      logger.info(`Fetched ${sellers.length} pending sellers`);
      res.json(sellers);
    }
  );
});

debugRoute('PUT', '/api/admin/approve-seller/:userId');
app.put('/api/admin/approve-seller/:userId', (req, res) => {
  const { userId } = req.params;
  db.get(
    `SELECT u.id FROM users u JOIN sellers s ON u.id = s.userId
     WHERE u.id = ? AND u.role = 'seller' AND u.approved = 0`,
    [userId],
    (err, seller) => {
      if (err || !seller) {
        logger.warn(`Cannot approve: Seller ${userId} not found or already approved`);
        return res.status(404).json({ message: 'Seller not found or already approved' });
      }
      db.run(
        `UPDATE users SET approved = 1 WHERE id = ? AND role = 'seller'`,
        [userId],
        (err) => {
          if (err) {
            logger.error(`Database error in approve_seller: ${err.message}`);
            return res.status(500).json({ message: 'Internal server error' });
          }
          db.run(
            `INSERT INTO seller_approvals (userId, adminId) VALUES (?, ?)`,
            [userId, 1],
            (err) => {
              if (err) {
                logger.error(`Database error in approve_seller: ${err.message}`);
                return res.status(500).json({ message: 'Internal server error' });
              }
              logger.info(`Seller approved: userId ${userId} by adminId 1`);
              res.json({ message: 'Seller approved' });
            }
          );
        }
      );
    }
  );
});

debugRoute('GET', '/api/admin/approval-history');
app.get('/api/admin/approval-history', (req, res) => {
  db.all(
    `SELECT sa.id, sa.userId, sa.adminId, sa.approved_at,
            u.name AS seller_name, u.email AS seller_email,
            a.name AS admin_name
     FROM seller_approvals sa
     JOIN users u ON sa.userId = u.id
     JOIN users a ON sa.adminId = a.id
     ORDER BY sa.approved_at DESC`,
    (err, history) => {
      if (err) {
        logger.error(`Database error in get_approval_history: ${err.message}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
      logger.info(`Fetched ${history.length} approval records`);
      res.json(history);
    }
  );
});

debugRoute('GET', '/api/admin/all-users');
app.get('/api/admin/all-users', (req, res) => {
  db.all(
    `SELECT u.id, u.name, u.email, u.phone, u.address, u.role, u.balance, u.approved,
            s.msmeNumber, s.adharNumber, s.accountNumber
     FROM users u
     LEFT JOIN sellers s ON u.id = s.userId
     WHERE u.role IN ('buyer', 'seller')`,
    (err, users) => {
      if (err) {
        logger.error(`Database error in get_all_users: ${err.message}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
      logger.info(`Fetched ${users.length} users (buyers and sellers)`);
      res.json(users);
    }
  );
});

debugRoute('GET', '/api/admin/download-doc/:filename');
app.get('/api/admin/download-doc/:filename', (req, res) => {
  const filePath = path.join(UPLOAD_FOLDER, req.params.filename);
  if (!fs.existsSync(filePath)) {
    logger.error(`File not found: ${filePath}`);
    return res.status(404).json({ message: 'File not found' });
  }
  logger.info(`Serving file: ${filePath}`);
  res.download(filePath);
});

// Seller Routes
debugRoute('POST', '/api/seller/register');
app.post('/api/seller/register', upload.single('msmeDoc'), (req, res) => {
  const { userId, msmeNumber, address, adharNumber, accountNumber } = req.body;
  if (!userId || !msmeNumber || !address || !adharNumber || !accountNumber || !req.file) {
    logger.warn('Missing fields or file in seller registration');
    return res.status(400).json({ message: 'All fields and file are required' });
  }

  const userIdNum = parseInt(userId);
  if (isNaN(userIdNum)) {
    logger.warn(`Invalid userId format: ${userId}`);
    return res.status(400).json({ message: 'User ID must be a number' });
  }

  db.get('SELECT * FROM users WHERE id = ? AND role = "seller"', [userIdNum], (err, user) => {
    if (err || !user) {
      logger.warn(`Invalid userId ${userId}: Not found or not a seller`);
      return res.status(400).json({ message: 'Invalid user ID or user is not a seller' });
    }
    db.run(
      `INSERT INTO sellers (userId, msmeNumber, msmeDoc, address, adharNumber, accountNumber)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userIdNum, msmeNumber, req.file.filename, address, adharNumber, accountNumber],
      (err) => {
        if (err) {
          logger.error(`Error registering seller: ${err.message}`);
          return res.status(400).json({ message: 'Error registering seller' });
        }
        logger.info(`Seller registered: userId ${userIdNum}`);
        res.json({ message: 'Seller details submitted, awaiting approval' });
      }
    );
  });
});

// Product Routes
debugRoute('POST', '/api/product/add');
app.post('/api/product/add', tokenRequired, (req, res) => {
  if (req.user.role !== 'seller') {
    logger.warn(`Unauthorized product add attempt by user ${req.user.id}`);
    return res.status(403).json({ message: 'Only sellers can add products' });
  }

  const { image, description, price, quantity } = req.body;
  if (!image || !description || !price || !quantity) {
    logger.warn('Missing fields in add_product');
    return res.status(400).json({ message: 'All fields are required' });
  }

  db.run(
    `INSERT INTO products (sellerId, image, description, price, quantity)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, image, description, price, quantity],
    (err) => {
      if (err) {
        logger.error(`Database error in add_product: ${err.message}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
      logger.info(`Product added by sellerId ${req.user.id}`);
      res.json({ message: 'Product added' });
    }
  );
});

debugRoute('GET', '/api/product');
app.get('/api/product', tokenRequired, (req, res) => {
  db.all('SELECT * FROM products', (err, products) => {
    if (err) {
      logger.error(`Database error in get_products: ${err.message}`);
      return res.status(500).json({ message: 'Internal server error' });
    }
    logger.info(`Fetched ${products.length} products for user ${req.user.id}`);
    res.json(products);
  });
});

// Cart Routes
debugRoute('POST', '/api/cart/add');
app.post('/api/cart/add', tokenRequired, (req, res) => {
  if (req.user.role !== 'buyer') {
    logger.warn(`Unauthorized cart add attempt by user ${req.user.id}`);
    return res.status(403).json({ message: 'Only buyers can add to cart' });
  }

  const { productId, quantity } = req.body;
  if (!productId || !quantity) {
    logger.warn('Missing fields in add_to_cart');
    return res.status(400).json({ message: 'Product ID and quantity are required' });
  }

  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
    if (err || !product) {
      logger.warn(`Product not found: ${productId}`);
      return res.status(400).json({ message: 'Product not found' });
    }
    if (product.quantity < quantity) {
      logger.warn(`Insufficient stock for product: ${productId}`);
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    db.run(
      `INSERT INTO cart (buyerId, productId, quantity)
       VALUES (?, ?, ?)`,
      [req.user.id, productId, quantity],
      (err) => {
        if (err) {
          logger.error(`Database error in add_to_cart: ${err.message}`);
          return res.status(500).json({ message: 'Internal server error' });
        }
        logger.info(`Product ${productId} added to cart for buyerId ${req.user.id}`);
        res.json({ message: 'Product added to cart' });
      }
    );
  });
});

debugRoute('GET', '/api/cart');
app.get('/api/cart', tokenRequired, (req, res) => {
  db.all(
    `SELECT c.id, c.productId, c.quantity, p.description, p.price, p.image
     FROM cart c JOIN products p ON c.productId = p.id
     WHERE c.buyerId = ?`,
    [req.user.id],
    (err, items) => {
      if (err) {
        logger.error(`Database error in get_cart: ${err.message}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
      logger.info(`Fetched ${items.length} cart items for buyerId ${req.user.id}`);
      res.json(items);
    }
  );
});

debugRoute('DELETE', '/api/cart');
app.delete('/api/cart', tokenRequired, (req, res) => {
  db.run('DELETE FROM cart WHERE buyerId = ?', [req.user.id], (err) => {
    if (err) {
      logger.error(`Database error in clear_cart: ${err.message}`);
      return res.status(500).json({ message: `Internal server error: ${err.message}` });
    }
    logger.info(`Cart cleared for buyerId ${req.user.id}`);
    res.json({ message: 'Cart cleared' });
  });
});

// Balance Routes
debugRoute('GET', '/api/balance');
debugRoute('PUT', '/api/balance');
app.route('/api/balance')
  .get(tokenRequired, (req, res) => {
    db.get('SELECT balance FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err || !user) {
        logger.warn(`User not found for balance: ${req.user.id}`);
        return res.status(404).json({ message: 'User not found' });
      }
      logger.info(`Fetched balance for userId ${req.user.id}`);
      res.json({ balance: user.balance });
    });
  })
  .put(tokenRequired, (req, res) => {
    if (req.user.role !== 'admin') {
      logger.warn(`Unauthorized balance update attempt by user ${req.user.id}`);
      return res.status(403).json({ message: 'Only admins can update balances' });
    }
    const { userId, balance } = req.body;
    if (!userId || balance === undefined || balance < 0) {
      logger.warn('Missing or invalid fields in balance update');
      return res.status(400).json({ message: 'User ID and valid balance are required' });
    }
    db.get('SELECT id FROM users WHERE id = ?', [userId], (err, user) => {
      if (err || !user) {
        logger.warn(`Target user not found: ${userId}`);
        return res.status(404).json({ message: 'Target user not found' });
      }
      db.run('UPDATE users SET balance = ? WHERE id = ?', [balance, userId], (err) => {
        if (err) {
          logger.error(`Database error in update_balance: ${err.message}`);
          return res.status(500).json({ message: 'Internal server error' });
        }
        logger.info(`Balance updated for userId ${userId} to ${balance}`);
        res.json({ message: 'Balance updated' });
      });
    });
  });

debugRoute('POST', '/api/balance/add');
app.post('/api/balance/add', tokenRequired, (req, res) => {
  if (req.user.role !== 'buyer') {
    logger.warn(`Unauthorized balance add attempt by user ${req.user.id}`);
    return res.status(403).json({ message: 'Only buyers can add balance' });
  }
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    logger.warn('Invalid or missing amount in add_balance');
    return res.status(400).json({ message: 'Valid amount is required' });
  }
  db.run(
    'UPDATE users SET balance = balance + ? WHERE id = ?',
    [amount, req.user.id],
    (err) => {
      if (err) {
        logger.error(`Database error in add_balance: ${err.message}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
      logger.info(`Added ${amount} to balance for userId ${req.user.id}`);
      res.json({ message: 'Balance added' });
    }
  );
});

// Payment Routes
debugRoute('POST', '/api/payment/process');
app.post('/api/payment/process', tokenRequired, (req, res) => {
  const { cartItems, items } = req.body; // Support both cartItems and direct items
  const buyerId = req.user.id;

  // Validate input
  const paymentItems = cartItems || items || [];
  if (!Array.isArray(paymentItems) || paymentItems.length === 0) {
    logger.warn('Missing or invalid payment items');
    return res.status(400).json({ message: 'Payment items are required' });
  }

  for (const item of paymentItems) {
    if (!item.productId || !item.quantity || item.quantity <= 0 || !Number.isInteger(item.productId) || !Number.isInteger(item.quantity)) {
      logger.warn(`Invalid payment item: ${JSON.stringify(item)}`);
      return res.status(400).json({ message: 'Invalid item data: productId and quantity must be positive integers' });
    }
    // Validate sellerId if provided
    if (item.sellerId && (!Number.isInteger(item.sellerId) || item.sellerId <= 0)) {
      logger.warn(`Invalid sellerId: ${item.sellerId}`);
      return res.status(400).json({ message: 'Invalid sellerId' });
    }
  }

  logger.debug(`Processing payment items: ${JSON.stringify(paymentItems)}`);

  db.get('SELECT balance FROM users WHERE id = ?', [buyerId], (err, buyer) => {
    if (err || !buyer) {
      logger.warn(`Buyer not found: ${buyerId}`);
      return res.status(404).json({ message: 'Buyer not found' });
    }

    let total = 0;
    const orders = [];
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          logger.error(`Transaction start error: ${err.message}`);
          return res.status(500).json({ message: 'Internal server error' });
        }
      });

      // Fetch products
      const productIds = paymentItems.map(item => item.productId);
      db.all('SELECT id, sellerId, price, quantity FROM products WHERE id IN (' + productIds.map(() => '?').join(',') + ')', productIds, (err, products) => {
        if (err) {
          db.run('ROLLBACK');
          logger.error(`Database error fetching products: ${err.message}`);
          return res.status(500).json({ message: 'Internal server error' });
        }

        const productMap = new Map(products.map(p => [p.id, p]));
        for (const item of paymentItems) {
          const product = productMap.get(item.productId);
          if (!product) {
            db.run('ROLLBACK');
            logger.warn(`Product not found: ${item.productId}`);
            return res.status(400).json({ message: `Product not found: ${item.productId}` });
          }
          // Validate sellerId if provided
          if (item.sellerId && item.sellerId !== product.sellerId) {
            db.run('ROLLBACK');
            logger.warn(`Seller mismatch for product ${item.productId}: provided ${item.sellerId}, expected ${product.sellerId}`);
            return res.status(400).json({ message: `Seller mismatch for product ${item.productId}` });
          }
          if (product.quantity < item.quantity) {
            db.run('ROLLBACK');
            logger.warn(`Insufficient stock for product: ${item.productId}`);
            return res.status(400).json({ message: `Insufficient stock for product: ${item.productId}` });
          }
          total += product.price * item.quantity;
        }

        if (buyer.balance < total) {
          db.run('ROLLBACK');
          logger.warn(`Insufficient balance for buyerId ${buyerId}: ${buyer.balance} < ${total}`);
          return res.status(400).json({ message: 'Insufficient balance' });
        }

        try {
          // Insert orders
          const orderStmt = db.prepare(
            `INSERT INTO orders (buyerId, sellerId, productId, quantity, total, paymentStatus, deliveryStatus, created_at)
             VALUES (?, ?, ?, ?, ?, 'completed', 'pending', CURRENT_TIMESTAMP)`
          );
          const updateProductStmt = db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');
          const deleteCartStmt = cartItems ? db.prepare('DELETE FROM cart WHERE id = ?') : null;

          for (const item of paymentItems) {
            const product = productMap.get(item.productId);
            const itemTotal = product.price * item.quantity;
            orderStmt.run([buyerId, product.sellerId, item.productId, item.quantity, itemTotal], function (err) {
              if (err) {
                throw new Error(`Order insertion failed: ${err.message}`);
              }
              orders.push({ orderId: this.lastID, sellerId: product.sellerId, total: itemTotal });
            });
            updateProductStmt.run([item.quantity, item.productId]);
            if (cartItems && item.id) {
              deleteCartStmt.run([item.id]);
            }
          }

          orderStmt.finalize();
          updateProductStmt.finalize();
          if (deleteCartStmt) deleteCartStmt.finalize();

          // Update balances
          db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [total, buyerId], (err) => {
            if (err) throw new Error(`Buyer balance update failed: ${err.message}`);
          });
          for (const order of orders) {
            db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [order.total, order.sellerId], (err) => {
              if (err) throw new Error(`Seller balance update failed: ${err.message}`);
            });
          }

          db.run('COMMIT', (err) => {
            if (err) {
              logger.error(`Transaction commit error: ${err.message}`);
              return res.status(500).json({ message: 'Internal server error' });
            }
            logger.info(`Payment processed for buyerId ${buyerId}, total: ${total}, orders: ${orders.map(o => o.orderId).join(',')}`);
            res.json({ message: 'Payment processed, orders created', orders });
          });
        } catch (err) {
          db.run('ROLLBACK');
          logger.error(`Payment processing error: ${err.message}`);
          res.status(500).json({ message: 'Payment processing failed' });
        }
      });
    });
  });
});
// Order Status Routes
debugRoute('GET', '/api/orders');
app.get('/api/orders', tokenRequired, (req, res) => {
  const query = req.user.role === 'buyer'
    ? `SELECT o.*, p.description, p.image
       FROM orders o JOIN products p ON o.productId = p.id
       WHERE o.buyerId = ?`
    : `SELECT o.*, p.description, p.image
       FROM orders o JOIN products p ON o.productId = p.id
       WHERE o.sellerId = ?`;

  db.all(query, [req.user.id], (err, orders) => {
    if (err) {
      logger.error(`Database error in get_orders: ${err.message}`);
      return res.status(500).json({ message: 'Internal server error' });
    }
    logger.info(`Fetched ${orders.length} orders for userId ${req.user.id}`);
    res.json(orders);
  });
});

debugRoute('PUT', '/api/orders/update-status/:orderId');
app.put('/api/orders/update-status/:orderId', tokenRequired, (req, res) => {
  if (req.user.role !== 'seller') {
    logger.warn(`Unauthorized order status update attempt by user ${req.user.id}`);
    return res.status(403).json({ message: 'Only sellers can update order status' });
  }

  const { paymentStatus, deliveryStatus } = req.body;
  if (!paymentStatus || !deliveryStatus) {
    logger.warn('Missing fields in update_order_status');
    return res.status(400).json({ message: 'Payment status and delivery status are required' });
  }

  const validPaymentStatuses = ['pending', 'completed', 'failed'];
  const validDeliveryStatuses = ['pending', 'shipped', 'delivered'];
  if (!validPaymentStatuses.includes(paymentStatus) || !validDeliveryStatuses.includes(deliveryStatus)) {
    logger.warn(`Invalid status values: paymentStatus=${paymentStatus}, deliveryStatus=${deliveryStatus}`);
    return res.status(400).json({
      message: `Invalid status: paymentStatus must be one of ${validPaymentStatuses}, deliveryStatus must be one of ${validDeliveryStatuses}`
    });
  }

  db.run(
    `UPDATE orders SET paymentStatus = ?, deliveryStatus = ?
     WHERE id = ? AND sellerId = ?`,
    [paymentStatus, deliveryStatus, req.params.orderId, req.user.id],
    function (err) {
      if (err) {
        logger.error(`Database error in update_order_status: ${err.message}`);
        return res.status(500).json({ message: `Internal server error: ${err.message}` });
      }
      if (this.changes === 0) {
        logger.warn(`No order found or unauthorized: orderId ${req.params.orderId}, sellerId ${req.user.id}`);
        return res.status(404).json({ message: 'Order not found or unauthorized' });
      }
      logger.info(`Order status updated: orderId ${req.params.orderId}`);
      res.json({ message: 'Order status updated' });
    }
  );
});
debugRoute('POST', '/api/orders/cancel');
app.post('/api/orders/cancel', tokenRequired, (req, res) => {
  const { orderId } = req.body;
  const userId = req.user.id;
  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required' });
  }
  db.get(
    'SELECT userId, productId, quantity FROM orders WHERE id = ? AND paymentStatus = ? AND deliveryStatus = ?',
    [orderId, 'pending', 'pending'],
    (err, order) => {
      if (err) {
        logger.error(`Order cancel error: ${err.message}`);
        return res.status(500).json({ message: 'Server error' });
      }
      if (!order) {
        return res.status(404).json({ message: 'Order not found or cannot be canceled' });
      }
      if (order.userId !== userId) {
        logger.warn(`Unauthorized cancel attempt: userId ${userId}, orderId ${orderId}`);
        return res.status(403).json({ message: 'Unauthorized' });
      }
      db.run(
        'UPDATE orders SET paymentStatus = ?, deliveryStatus = ? WHERE id = ?',
        ['canceled', 'canceled', orderId],
        (err) => {
          if (err) {
            logger.error(`Order cancel error: ${err.message}`);
            return res.status(400).json({ message: 'Failed to cancel order' });
          }
          // Restore product stock
          db.run(
            'UPDATE products SET quantity = quantity + ? WHERE id = ?',
            [order.quantity, order.productId],
            (err) => {
              if (err) {
                logger.error(`Stock restore error: ${err.message}`);
              }
              logger.info(`Order canceled: orderId ${orderId}, userId ${userId}`);
              res.json({ message: 'Order canceled successfully' });
            }
          );
        }
      );
    }
  );
});
// Start server
const startServer = async () => {
  try {
    await initDb();
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();