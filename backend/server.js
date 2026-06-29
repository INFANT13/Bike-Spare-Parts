const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/db');

const app = express();

// Standard middlewares
app.use(cors());

// Apply Helmet with resource sharing policies relaxed for local files
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Statically host uploads folder so clients can download product images
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Connect and Sync Database
connectDB();

sequelize.sync({ alter: true })
  .then(() => console.log('Database tables synchronized successfully.'))
  .catch(err => console.error('Database Sync Error:', err.message));

// Route handlers
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Base Health Check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Bike Spare Parts Store REST API is active.' });
});

// Global Error Boundary
app.use((err, req, res, next) => {
  console.error('API Error Exception:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
