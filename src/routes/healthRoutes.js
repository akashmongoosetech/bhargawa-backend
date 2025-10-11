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

// Test email endpoint with enhanced debugging and multiple provider support
router.post('/test-email', asyncHandler(async(req, res) => {
  try {
    const { to, subject, message, provider } = req.body;
    
    // If provider is specified, temporarily override the environment
    if (provider) {
      process.env.EMAIL_PROVIDER = provider;
    }
    
    const currentProvider = process.env.EMAIL_PROVIDER || 'gmail';
    
    const testEmailHtml = `
      <h2>Test Email from Bhargava Clinic</h2>
      <p>This is a test email to verify email functionality.</p>
      <p><strong>Provider:</strong> ${currentProvider}</p>
      <p><strong>Subject:</strong> ${subject || 'Default Test Email'}</p>
      <p><strong>Message:</strong> ${message || 'Testing email service configuration'}</p>
      <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
      <p><strong>Server Time:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Server Info:</strong></p>
      <ul>
        <li>Email Provider: ${currentProvider}</li>
        <li>Email Host: ${process.env.EMAIL_HOST || 'Not configured'}</li>
        <li>Email Port: ${process.env.EMAIL_PORT || 'Not configured'}</li>
        <li>Email User: ${process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Not configured'}</li>
        <li>Password Set: ${process.env.EMAIL_PASS ? 'Yes' : 'No'}</li>
        <li>SendGrid API Key: ${process.env.SENDGRID_API_KEY ? 'Yes' : 'No'}</li>
        <li>Mailgun User: ${process.env.MAILGUN_SMTP_USER ? 'Yes' : 'No'}</li>
        <li>AWS Keys: ${process.env.AWS_ACCESS_KEY_ID ? 'Yes' : 'No'}</li>
      </ul>
      <p>If you receive this email, the email service is working correctly!</p>
    `;

    const emailOptions = {
      to: to || process.env.CLINIC_EMAIL || 'test@example.com',
      subject: `Test Email - ${subject || 'Bhargava Clinic'} - ${new Date().toLocaleString()}`,
      html: testEmailHtml
    };

    console.log('📧 Sending test email:', {
      provider: currentProvider,
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
        provider: currentProvider,
        host: process.env.EMAIL_HOST || 'Not configured',
        port: process.env.EMAIL_PORT || 'Not configured',
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Not configured',
        passwordConfigured: !!process.env.EMAIL_PASS,
        sendgridConfigured: !!process.env.SENDGRID_API_KEY,
        mailgunConfigured: !!(process.env.MAILGUN_SMTP_USER && process.env.MAILGUN_SMTP_PASS),
        awsConfigured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
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

// EMAIL DIAGNOSTICS ENDPOINT - Comprehensive email system diagnostics
router.post('/diagnose-email', asyncHandler(async(req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    
    // Configuration Check
    configuration: {
      gmail: {
        configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Not configured',
        passwordSet: !!process.env.EMAIL_PASS,
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true'
      },
      sendgrid: {
        configured: !!process.env.SENDGRID_API_KEY,
        apiKeySet: !!process.env.SENDGRID_API_KEY
      },
      mailgun: {
        configured: !!(process.env.MAILGUN_SMTP_USER && process.env.MAILGUN_SMTP_PASS),
        userSet: !!process.env.MAILGUN_SMTP_USER,
        passwordSet: !!process.env.MAILGUN_SMTP_PASS
      },
      aws: {
        configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        keySet: !!process.env.AWS_ACCESS_KEY_ID,
        secretSet: !!process.env.AWS_SECRET_ACCESS_KEY,
        host: process.env.AWS_SES_HOST
      }
    },
    
    // System Info
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    },
    
    // Recommendations
    recommendations: []
  };
  
  // Generate recommendations based on configuration
  const currentProvider = process.env.EMAIL_PROVIDER || 'gmail';
  
  if (!diagnostics.configuration.gmail.configured && currentProvider === 'gmail') {
    diagnostics.recommendations.push({
      type: 'error',
      message: 'Gmail not configured. Set EMAIL_USER and EMAIL_PASS environment variables.',
      action: 'Generate Gmail App Password and set EMAIL_PASS'
    });
  }
  
  if (!diagnostics.configuration.sendgrid.configured && currentProvider === 'sendgrid') {
    diagnostics.recommendations.push({
      type: 'error', 
      message: 'SendGrid not configured. Set SENDGRID_API_KEY environment variable.',
      action: 'Sign up at SendGrid and generate API key'
    });
  }
  
  if (currentProvider === 'gmail' && diagnostics.configuration.gmail.configured) {
    diagnostics.recommendations.push({
      type: 'warning',
      message: 'Using Gmail for production. Consider switching to SendGrid for better deliverability.',
      action: 'Set EMAIL_PROVIDER=sendgrid and configure SendGrid'
    });
  }
  
  if (!diagnostics.configuration.gmail.configured && 
      !diagnostics.configuration.sendgrid.configured && 
      !diagnostics.configuration.mailgun.configured && 
      !diagnostics.configuration.aws.configured) {
    diagnostics.recommendations.push({
      type: 'error',
      message: 'No email provider configured. Emails will not be sent.',
      action: 'Configure at least one email provider'
    });
  }
  
  sendSuccessResponse(res, 'Email diagnostics completed', diagnostics);
}));

// SMTP CONNECTION TEST - Test SMTP connectivity without sending email
router.post('/test-smtp-connection', asyncHandler(async(req, res) => {
  const { provider } = req.body;
  
  if (provider) {
    process.env.EMAIL_PROVIDER = provider;
  }
  
  try {
    const { createTransporter } = await import('../services/emailService.js');
    const transporter = createTransporter();
    
    console.log('🔌 Testing SMTP connection...');
    const startTime = Date.now();
    
    await transporter.verify();
    
    const connectionTime = Date.now() - startTime;
    
    sendSuccessResponse(res, 'SMTP connection successful', {
      provider: process.env.EMAIL_PROVIDER || 'gmail',
      connectionTime: `${connectionTime}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    
    sendErrorResponse(res, `SMTP connection failed: ${error.message}`, 500, {
      provider: process.env.EMAIL_PROVIDER || 'gmail',
      error: error.message,
      code: error.code,
      response: error.response,
      timestamp: new Date().toISOString()
    });
  }
}));

export default router;
