const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/students', require('./routes/students'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date(), 
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Disserto API' });
});

// Define PORT
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 