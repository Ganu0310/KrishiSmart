const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

dotenv.config();

const connectDB = require('./config/db');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { startJobs, stopJobs } = require('./jobs');

// ── Routes ────────────────────────────────────────────────
const authRoutes        = require('./routes/authRoutes');
const weatherRoutes     = require('./routes/weatherRoutes');
const advisoryRoutes    = require('./routes/advisoryRoutes');
const marketPriceRoutes = require('./routes/marketPriceRoutes');
const irrigationRoutes  = require('./routes/irrigationRoutes');
const adminRoutes       = require('./routes/adminRoutes');
const fertilizerRoutes  = require('./routes/fertilizerRoutes');
const userRoutes        = require('./routes/userRoutes');
const govDataRoutes     = require('./routes/govDataRoutes');
const schemeRoutes      = require('./routes/schemeRoutes');
const diseaseRoutes     = require('./routes/diseaseRoutes');
const soilRoutes        = require('./routes/soilRoutes');

// ── App Setup ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// Security headers
app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── Database ──────────────────────────────────────────────
connectDB();

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:8083'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// ── Request Logger ────────────────────────────────────────
app.use(requestLogger);

// ── Static Files ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Socket.io ─────────────────────────────────────────────
const io = new Server(server, { cors: corsOptions });
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join_admin', () => {
    socket.join('admin-room');
    console.log(`[Socket] ${socket.id} joined admin-room`);
  });

  socket.on('join_farmer', (userId) => {
    if (userId) {
      socket.join(`farmer-${userId}`);
      console.log(`[Socket] ${socket.id} joined farmer-${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ── Body Parser ───────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Rate Limiters ─────────────────────────────────────────
// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' },
});

// Strict limiter for auth routes (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  skipSuccessfulRequests: true, // Only count failed requests toward the limit
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin-login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Health Check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';

  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbStatus,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Legacy root check
app.get('/', (req, res) => {
  res.json({ message: 'KrishiSmart API is running. See /health for status.' });
});

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/weather',       weatherRoutes);
app.use('/api/advisory',      advisoryRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/irrigation',    irrigationRoutes);
app.use('/api/fertilizers',   fertilizerRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/user',          userRoutes);
app.use('/api/gov-data',      govDataRoutes);
app.use('/api/schemes',       schemeRoutes);
app.use('/api/disease',       diseaseRoutes);
app.use('/api/soil',          soilRoutes);

// ── 404 Handler ───────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global Error Handler ─────────────────────────────────
// Must be LAST middleware (after all routes)
app.use(errorHandler);

// ── Server Start ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 KrishiSmart API running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);

  startJobs();
});

// ── Graceful Shutdown ─────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  stopJobs();
  server.close(async () => {
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');
    console.log('✓ HTTP server closed\n');
    process.exit(0);
  });

  // Force exit after 10s if something hangs
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Unhandled Promise Rejections ──────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UnhandledRejection]', reason);
  // In production you'd want to alert on this, not crash
});

// Trigger nodemon restart

// Trigger nodemon restart 2
