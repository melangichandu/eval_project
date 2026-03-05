const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const eligibilityRoutes = require('./routes/eligibility');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4000';
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'grant-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/eligibility', eligibilityRoutes);

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 5 MB.' });
  }
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
