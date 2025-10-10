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

// Test email endpoint
router.post('/test-email', asyncHandler(async(req, res) => {
  try {
    const testEmailHtml = `
      <h2>Test Email from Bhargava Clinic</h2>
      <p>This is a test email to verify email functionality.</p>
      <p>Sent at: ${new Date().toLocaleString()}</p>
      <p>If you receive this email, the email service is working correctly!</p>
    `;

    await sendEmail({
      to: process.env.CLINIC_EMAIL || 'akashraikwar763@gmail.com',
      subject: 'Test Email - Bhargava Clinic',
      html: testEmailHtml
    });

    sendSuccessResponse(res, 'Test email sent successfully', {
      to: process.env.CLINIC_EMAIL || 'akashraikwar763@gmail.com',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test email failed:', error.message);
    sendErrorResponse(res, `Test email failed: ${error.message}`, 500);
  }
}));

export default router;
