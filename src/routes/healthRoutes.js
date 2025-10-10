import express from 'express';
import mongoose from 'mongoose';
import { asyncHandler, sendSuccessResponse, sendErrorResponse } from '../middleware/errorHandler.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// Health check endpoint
router.get('/', asyncHandler(async(req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    database: {
      status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    }
  };

  sendSuccessResponse(res, 'Server is healthy', healthCheck);
}));

// Test email endpoint with enhanced debugging
router.post('/test-email', asyncHandler(async(req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    const testEmailHtml = `
      <h2>Test Email from Bhargava Clinic</h2>
      <p>This is a test email to verify email functionality.</p>
      <p><strong>Subject:</strong> ${subject || 'Default Test Email'}</p>
      <p><strong>Message:</strong> ${message || 'Testing email service configuration'}</p>
      <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
      <p><strong>Server Time:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Server Info:</strong></p>
      <ul>
        <li>Email Host: ${process.env.EMAIL_HOST || 'Not configured'}</li>
        <li>Email Port: ${process.env.EMAIL_PORT || 'Not configured'}</li>
        <li>Email User: ${process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Not configured'}</li>
        <li>Password Set: ${process.env.EMAIL_PASS ? 'Yes' : 'No'}</li>
      </ul>
      <p>If you receive this email, the email service is working correctly!</p>
    `;

    const emailOptions = {
      to: to || process.env.CLINIC_EMAIL || 'test@example.com',
      subject: `Test Email - ${subject || 'Bhargava Clinic'} - ${new Date().toLocaleString()}`,
      html: testEmailHtml
    };

    console.log('📧 Sending test email:', {
      to: emailOptions.to,
      subject: emailOptions.subject,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    const result = await sendEmail(emailOptions);

    sendSuccessResponse(res, 'Test email sent successfully', {
      ...result,
      to: emailOptions.to,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      emailConfig: {
        host: process.env.EMAIL_HOST || 'Not configured',
        port: process.env.EMAIL_PORT || 'Not configured',
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Not configured',
        passwordConfigured: !!process.env.EMAIL_PASS
      }
    });
  } catch (error) {
    console.error('Test email failed:', {
      error: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack
    });
    
    sendErrorResponse(res, `Test email failed: ${error.message}`, 500, {
      error: error.message,
      code: error.code,
      response: error.response,
      emailConfig: {
        host: process.env.EMAIL_HOST || 'Not configured',
        port: process.env.EMAIL_PORT || 'Not configured',
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Not configured',
        passwordConfigured: !!process.env.EMAIL_PASS
      }
    });
  }
}));

// CORS debugging endpoint
router.get('/cors-test', asyncHandler(async(req, res) => {
  const corsInfo = {
    origin: req.get('Origin') || 'No origin header',
    userAgent: req.get('User-Agent'),
    method: req.method,
    headers: req.headers,
    corsConfig: {
      allowedOrigin: process.env.CORS_ORIGIN || '*',
      credentials: process.env.CORS_CREDENTIALS === 'true',
      environment: process.env.NODE_ENV
    },
    timestamp: new Date().toISOString()
  };
  
  console.log('🔧 CORS Test Request:', corsInfo);
  
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  sendSuccessResponse(res, 'CORS test successful', corsInfo);
}));

// OPTIONS handler for preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});

export default router;
