const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const advisoryRoutes = require('./routes/advisoryRoutes');
const marketPriceRoutes = require('./routes/marketPriceRoutes');
const irrigationRoutes = require('./routes/irrigationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const fertilizerRoutes = require('./routes/fertilizerRoutes');
const userRoutes = require('./routes/userRoutes');
const govDataRoutes = require('./routes/govDataRoutes');
const connectDB = require('./config/db');
const { startJobs, stopJobs } = require('./jobs');


const http = require('http');
const { Server } = require('socket.io');

// ... imports remain ...
const app = express();
const server = http.createServer(app);

// Security headers and basic hardening
app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Connect to MongoDB
connectDB();

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

const corsOptions = {
  origin: true, // Allow all for dev, restrict in prod
  credentials: true,
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files for uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io Setup
const io = new Server(server, {
  cors: corsOptions,
});

// Make io accessible in routes
app.set('io', io);

// Socket.io logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_admin', () => {
    socket.join('admin-room');
    console.log(`Socket ${socket.id} joined admin-room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


// Body parser with size limit to reduce DoS risk
app.use(
  express.json({
    limit: '10kb',
  })
);

// Basic rate limiting for all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

app.use('/api', apiLimiter);

// Basic health check
app.get('/', (req, res) => {
  res.json({ message: 'Climate-Smart Agriculture API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/irrigation', irrigationRoutes);
app.use('/api/fertilizers', fertilizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/gov-data', govDataRoutes);


// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start background jobs after server is running
  startJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  stopJobs();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  stopJobs();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
// Trigger restart for index recreation
