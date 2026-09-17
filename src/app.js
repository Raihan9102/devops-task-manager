'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const path = require('path');
const { PORT, API_VERSION, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, CORS_ORIGIN } = require('./config/app');
const { connectDB } = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const client = require('prom-client');

// Collect default system metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ prefix: 'nodejs_' });

// Custom HTTP request duration metric
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

const app = express();

// ─── Security Middlewares ───────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
  })
);
app.use(cors({ origin: CORS_ORIGIN }));   // CORS
app.use(
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    message: { status: 'fail', message: 'Too many requests, slow down!' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ─── Parsing & Logging ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Track HTTP metrics for Prometheus
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.baseUrl || req.path || 'unknown';
    httpRequestDuration.observe(
      { method: req.method, route, code: res.statusCode },
      durationInSeconds
    );
  });
  next();
});

// ─── Prometheus Metrics Endpoint ──────────────────────────────────────────
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ─── Static Frontend Dashboard ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/tasks`, taskRoutes);

// ─── API Docs & Info ────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    message: '🚀 DevOps Task Manager API',
    version: `v${process.env.npm_package_version || '1.0.0'}`,
    docs: `${req.protocol}://${req.get('host')}/api/${API_VERSION}`,
    health: `${req.protocol}://${req.get('host')}/health`,
    metrics: `${req.protocol}://${req.get('host')}/metrics`,
    endpoints: {
      auth: `/api/${API_VERSION}/auth`,
      tasks: `/api/${API_VERSION}/tasks`,
    },
  });
});

// Root route serves Web Dashboard UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 API Base: http://localhost:${PORT}/api/${API_VERSION}`);
    console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('⚠️  SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\n⚠️  SIGINT received. Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Process terminated');
      process.exit(0);
    });
  });
};

if (require.main === module) {
  startServer().catch((err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;
