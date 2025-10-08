# Bhargava Clinic Backend

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/bhargava-clinic
MONGODB_TEST_URI=mongodb://localhost:27017/bhargava-clinic-test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/

# CORS Configuration
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# Clinic Information
CLINIC_NAME=Bhargava Clinic
CLINIC_EMAIL=info@bhargavaclinic.com
CLINIC_PHONE=+919329198211
CLINIC_ADDRESS=MPEB office, opposite gate no 4, Madhav Nagar, Ujjain, Madhya Pradesh 456010

# WhatsApp Configuration
WHATSAPP_NUMBER=919329198211
WHATSAPP_MESSAGE=Hello, I would like to book an appointment

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-key
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run linting
npm run lint
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Contact Management
- `POST /api/contact` - Create new contact
- `GET /api/contact` - Get all contacts (with pagination and filters)
- `GET /api/contact/:id` - Get contact by ID
- `PUT /api/contact/:id` - Update contact
- `DELETE /api/contact/:id` - Delete contact
- `GET /api/contact/stats/summary` - Get contact statistics

### Appointment Management
- `POST /api/appointment` - Create new appointment
- `GET /api/appointment` - Get all appointments (with pagination and filters)
- `GET /api/appointment/:id` - Get appointment by ID
- `PUT /api/appointment/:id` - Update appointment
- `DELETE /api/appointment/:id` - Delete appointment
- `POST /api/appointment/:id/confirm` - Confirm appointment
- `GET /api/appointment/stats/summary` - Get appointment statistics
- `GET /api/appointment/treatments` - Get available treatments and time slots

### Blog Management
- `POST /api/blog` - Create new blog post
- `GET /api/blog` - Get all blog posts (with pagination and filters)
- `GET /api/blog/:slug` - Get blog post by slug
- `PUT /api/blog/:id` - Update blog post
- `DELETE /api/blog/:id` - Delete blog post

### Subscriber Management
- `POST /api/subscriber` - Subscribe to newsletter
- `GET /api/subscriber` - Get all subscribers (with pagination)

## Database Models

### Contact
- name, email, subject, message
- status (new, read, replied, archived)
- priority (low, medium, high)
- tags, assignedTo, notes
- timestamps

### Appointment
- name, email, phone, treatmentType
- preferredDate, preferredTime, message
- status (pending, confirmed, cancelled, completed, no-show)
- priority, confirmedDate, confirmedTime
- duration, notes, assignedTo, tags
- referenceId, reminderSent
- timestamps

### Blog
- title, slug, excerpt, content
- image, author, category, readTime
- tags, sections, status (draft, published)
- metaDescription, seoKeywords, metaTags
- timestamps

### Subscriber
- email, source
- timestamps

## Features

- ✅ **No CORS Restrictions** - Accepts requests from any origin
- ✅ **No Rate Limits** - Unlimited requests (configurable)
- ✅ **Comprehensive Validation** - Input validation and sanitization
- ✅ **Error Handling** - Proper error responses
- ✅ **Pagination** - Efficient data pagination
- ✅ **Search & Filtering** - Advanced search capabilities
- ✅ **Statistics** - Real-time statistics
- ✅ **File Upload** - Image upload support
- ✅ **Email Integration** - Optional email notifications
- ✅ **Security** - Helmet, sanitization, compression
- ✅ **Logging** - Request logging with Morgan
- ✅ **Health Check** - Server health monitoring

## Development

The backend is designed to work seamlessly with the frontend React application. All API responses follow the same structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "errors": []
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": [ ... ]
}
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Set strong JWT secrets
4. Configure proper CORS origins
5. Enable rate limiting if needed
6. Set up proper logging
7. Use HTTPS
8. Configure reverse proxy (nginx)

## Testing

The API includes comprehensive tests for all endpoints:

```bash
npm test
```

## Security Features

- Input validation and sanitization
- MongoDB injection prevention
- XSS protection
- CSRF protection
- Rate limiting (configurable)
- Helmet security headers
- Request compression
- Error message sanitization
