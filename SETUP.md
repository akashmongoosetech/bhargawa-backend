# Bhargava Clinic Backend - Quick Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd bhargawa-backend
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit configuration (optional)
nano .env
```

### 3. Database Setup
```bash
# Make sure MongoDB is running
# For local development, install MongoDB locally or use MongoDB Atlas

# Seed the database with sample data
npm run db:seed
```

### 4. Start Development Server
```bash
# Start the server
npm run dev

# Server will be available at http://localhost:5000
```

## 📋 Prerequisites

- **Node.js** (v18.0.0 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn**

## 🔧 Configuration

### Environment Variables (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/bhargava-clinic

# Security (change in production)
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret-key

# CORS (no restrictions as requested)
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# Clinic Information
CLINIC_NAME=Bhargava Clinic
CLINIC_EMAIL=info@bhargavaclinic.com
CLINIC_PHONE=+919329198211
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🔍 API Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Create Contact
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Test Subject",
    "message": "This is a test message."
  }'
```

### Create Appointment
```bash
curl -X POST http://localhost:5000/api/appointment \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "treatmentType": "Acne Treatment",
    "preferredDate": "2024-12-31",
    "preferredTime": "10:00 AM"
  }'
```

## 📊 API Endpoints

### Health & Info
- `GET /` - API information
- `GET /health` - Server health status

### Contact Management
- `POST /api/contact` - Create contact
- `GET /api/contact` - List contacts (with pagination)
- `GET /api/contact/:id` - Get contact by ID
- `PUT /api/contact/:id` - Update contact
- `DELETE /api/contact/:id` - Delete contact
- `GET /api/contact/stats/summary` - Contact statistics

### Appointment Management
- `POST /api/appointment` - Create appointment
- `GET /api/appointment` - List appointments (with pagination)
- `GET /api/appointment/:id` - Get appointment by ID
- `PUT /api/appointment/:id` - Update appointment
- `DELETE /api/appointment/:id` - Delete appointment
- `POST /api/appointment/:id/confirm` - Confirm appointment
- `GET /api/appointment/stats/summary` - Appointment statistics
- `GET /api/appointment/treatments` - Get treatments & time slots

### Blog Management
- `POST /api/blog` - Create blog post
- `GET /api/blog` - List blog posts (with pagination)
- `GET /api/blog/:slug` - Get blog post by slug
- `PUT /api/blog/:id` - Update blog post
- `DELETE /api/blog/:id` - Delete blog post

### Subscriber Management
- `POST /api/subscriber` - Subscribe to newsletter
- `GET /api/subscriber` - List subscribers (with pagination)
- `DELETE /api/subscriber/:id` - Unsubscribe
- `GET /api/subscriber/stats/summary` - Subscriber statistics

## 🛠️ Development

### Project Structure
```
bhargawa-backend/
├── src/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── tests/          # Test files
│   ├── scripts/        # Utility scripts
│   └── server.js       # Main server file
├── uploads/            # File uploads directory
├── package.json
├── .env.example
└── README.md
```

### Code Style
- **ES6+ JavaScript** with modules
- **Express.js** framework
- **Mongoose** for MongoDB
- **Jest** for testing
- **ESLint** for code quality

### Key Features
- ✅ **No CORS restrictions** (as requested)
- ✅ **No rate limits** (as requested)
- ✅ **Comprehensive validation**
- ✅ **Error handling**
- ✅ **Pagination support**
- ✅ **Search & filtering**
- ✅ **Statistics endpoints**
- ✅ **File upload support**
- ✅ **Security middleware**
- ✅ **Request logging**

## 🚀 Production Deployment

### 1. Environment Setup
```bash
# Set production environment
NODE_ENV=production

# Use production MongoDB
MONGODB_URI=mongodb://your-production-db

# Set strong secrets
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret
```

### 2. Security Considerations
- Use HTTPS in production
- Set proper CORS origins
- Enable rate limiting if needed
- Use environment variables for secrets
- Regular security updates

### 3. Performance Optimization
- Enable compression
- Use connection pooling
- Implement caching
- Monitor performance metrics

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
mongod --version

# For macOS with Homebrew
brew services start mongodb-community

# For Ubuntu/Debian
sudo systemctl start mongod
```

**Port Already in Use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=3000
```

**Permission Errors**
```bash
# Fix uploads directory permissions
chmod 755 src/uploads
```

## 📞 Support

For issues or questions:
- Check the logs: `npm run dev`
- Run tests: `npm test`
- Check database connection
- Verify environment variables

## 🎯 Integration with Frontend

The backend is designed to work seamlessly with the React frontend:

1. **API Structure**: All responses follow the same format
2. **CORS**: No restrictions for easy development
3. **Validation**: Comprehensive input validation
4. **Error Handling**: Consistent error responses
5. **Pagination**: Efficient data pagination
6. **Search**: Advanced search capabilities

The frontend can connect to the backend by setting:
```env
VITE_API_URL=http://localhost:5000
```

## 🏆 Features Summary

- **Complete CRUD operations** for all entities
- **Advanced filtering and search**
- **Real-time statistics**
- **Comprehensive validation**
- **Error handling and logging**
- **Security middleware**
- **File upload support**
- **Database seeding**
- **Comprehensive testing**
- **Production-ready configuration**

The backend is now ready to serve the Bhargava Clinic frontend application! 🎉
