require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const connectDB = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { startCleanupJob } = require('./utils/cleanup');

const uploadRoute = require('./routes/upload');
const verifyRoute = require('./routes/verify');
const downloadRoute = require('./routes/download');

const app = express();

app.use(helmet());

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: clientUrl,
    methods: ['GET', 'POST'],
  })
);

app.use(express.json({ limit: '2mb' }));
app.disable('x-powered-by');
app.use(generalLimiter);

app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));

app.use('/upload', uploadRoute);
app.use('/verify', verifyRoute);
app.use('/download', downloadRoute);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`LockDrop backend running on port ${PORT}`);
    startCleanupJob();
  });
});
