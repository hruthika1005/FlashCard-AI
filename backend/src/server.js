require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log("Step 1: Starting server...");
  await connectDB();
  console.log("Step 2: MongoDB connected.");

  const server = app.listen(PORT, () => {
  console.log("Step 3: Express started.");
  logger.info(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});

  // Gracefully handle unexpected errors instead of crashing silently
  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.stack}`);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully.');
    server.close(() => process.exit(0));
  });
};

startServer();
