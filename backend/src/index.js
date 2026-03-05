require('dotenv').config();
const app = require('./app');
const { connectWithRetry } = require('./config/db');

const PORT = process.env.PORT || 8080;

connectWithRetry()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Grant API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
