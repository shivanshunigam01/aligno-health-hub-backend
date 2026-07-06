require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./config/logger');
const ensureDirs = require('./utils/ensureDirs');

ensureDirs();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-id'],
  }),
);
app.use(compression());
app.use(cookieParser());

// Razorpay webhook needs raw body for signature verification
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(mongoSanitize());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

app.use('/public', express.static(require('path').join(__dirname, 'public')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
