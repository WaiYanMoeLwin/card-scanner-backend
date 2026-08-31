const app = require('./app.js');
const {connectDB} = require('./db.js');

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;

const onnxService = require('./services/onnx-service');

// Initialize ONNX sessions before starting the server
onnxService.initializeSessions().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to initialize ONNX sessions:', error);
  process.exit(1); // Exit the process if initialization fails
});
