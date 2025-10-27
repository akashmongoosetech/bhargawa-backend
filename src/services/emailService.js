import nodemailer from 'nodemailer';

// Email configuration with enhanced options
const createTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates
    },
    // Enhanced connection settings for production
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // Connection timeout settings
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,    // 30 seconds
    socketTimeout: 60000       // 60 seconds
  };

  // Production-specific Gmail configuration
  if (process.env.NODE_ENV === 'production' && config.host === 'smtp.gmail.com') {
    config.service = 'gmail';
    config.secure = false;
    config.requireTLS = true;
    config.tls = {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    };
  }

  console.log('📧 Creating email transporter with config:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    service: config.service || 'none',
    user: config.auth.user ? config.auth.user.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'not-set'
  });

  return nodemailer.createTransport(config);
};

// Enhanced send email function with better error handling
export const sendEmail = async(options) => {
  // Enhanced email configuration check
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const emailDetails = {
      to: options.to,
      subject: options.subject,
      from: `"${process.env.CLINIC_NAME || 'Bhargava Clinic'}" <${process.env.EMAIL_USER || 'not-configured'}>`,
      htmlLength: options.html?.length || 0,
      timestamp: new Date().toISOString()
    };

    console.log('=== EMAIL NOT CONFIGURED: Email would be sent ===');
    console.log('Email Details:', JSON.stringify(emailDetails, null, 2));
    console.log('=====================================');

    return {
      success: true,
      messageId: 'not-configured-' + Date.now(),
      preview: emailDetails
    };
  }

  // Enhanced environment logging for production debugging
  console.log('🔧 Email Configuration Check:');
  console.log('- Environment:', process.env.NODE_ENV);
  console.log('- Host:', process.env.EMAIL_HOST || 'smtp.gmail.com');
  console.log('- Port:', process.env.EMAIL_PORT || 587);
  console.log('- Secure:', process.env.EMAIL_SECURE === 'true');
  console.log('- User configured:', !!process.env.EMAIL_USER);
  console.log('- Password configured:', !!process.env.EMAIL_PASS);
  console.log('- Attempting to send to:', options.to);

  try {
    const transporter = createTransporter();

    // Enhanced connection verification with timeout
    console.log('🔗 Attempting to verify email server connection...');
    const verifyPromise = transporter.verify();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email server verification timeout (30s)')), 30000)
    );

    await Promise.race([verifyPromise, timeoutPromise]);
    console.log('✅ Email server connection verified successfully');

    const mailOptions = {
      from: `"${process.env.CLINIC_NAME || 'Bhargava Clinic'}" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || generateTextVersion(options.html),
      ...(options.cc && { cc: options.cc }),
      ...(options.bcc && { bcc: options.bcc }),
      ...(options.replyTo && { replyTo: options.replyTo }),
      // Add headers for better email deliverability
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'Bhargava Clinic Mail System 1.0'
      }
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };
  } catch (error) {
    console.error('❌ Email sending failed:', {
      error: error.message,
      code: error.code,
      command: error.command,
      to: options.to,
      subject: options.subject,
      timestamp: new Date().toISOString(),
      emailHost: process.env.EMAIL_HOST,
      emailPort: process.env.EMAIL_PORT,
      environment: process.env.NODE_ENV,
      responseCode: error.responseCode,
      response: error.response
    });

    // Provide more specific error messages for common issues
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check EMAIL_USER and EMAIL_PASS in production environment.';
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Cannot connect to email server. Check network connectivity and firewall settings.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Email server hostname not found. Check EMAIL_HOST configuration.';
    }

    throw new Error(`Failed to send email to ${options.to}: ${errorMessage}`);
  }
};

// Helper function to generate text version from HTML
const generateTextVersion = (html) => {
  if (!html) {return '';}
  return html
    .replace(/<style[^>]*>.*?<\/style>/gs, '')
    .replace(/<script[^>]*>.*?<\/script>/gs, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Base email template with modern design
const getBaseTemplate = (title, content, headerColor = '#667eea') => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        /* Modern CSS Reset */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        /* Base Styles */
        body { 
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
            line-height: 1.6; 
            color: #2d3748; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .email-header {
            background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .clinic-logo {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }
        
        .clinic-tagline {
            font-size: 14px;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .email-content {
            padding: 40px 30px;
            background: #ffffff;
        }
        
        .greeting {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 24px;
            font-weight: 600;
        }
        
        .message-box {
            background: #f8fafc;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            border-left: 4px solid ${headerColor};
        }
        
        .info-grid {
            display: grid;
            gap: 12px;
            margin: 20px 0;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .info-label {
            font-weight: 600;
            color: #4a5568;
        }
        
        .info-value {
            color: #2d3748;
            text-align: right;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 24px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .contact-info {
            background: #f7fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
        }
        
        .contact-item {
            margin: 8px 0;
            color: #4a5568;
        }
        
        .contact-item strong {
            color: #2d3748;
        }
        
        .footer {
            background: #1a202c;
            color: #a0aec0;
            padding: 30px;
            text-align: center;
            font-size: 12px;
            line-height: 1.5;
        }
        
        .social-links {
            margin: 20px 0;
        }
        
        .social-link {
            display: inline-block;
            margin: 0 10px;
            color: #a0aec0;
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .social-link:hover {
            color: white;
        }
        
        .unsubscribe {
            color: #718096;
            font-size: 11px;
            margin-top: 15px;
        }
        
        /* Responsive Design */
        @media (max-width: 600px) {
            body { padding: 10px; }
            .email-header { padding: 30px 20px; }
            .email-content { padding: 30px 20px; }
            .cta-button { display: block; text-align: center; }
        }
        
        /* Animation */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .email-container {
            animation: fadeIn 0.5s ease-out;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="clinic-logo">BHARGAVA CLINIC</div>
            <div class="clinic-tagline">Skin & Hair Specialists | Excellence in Dermatology</div>
        </div>
        
        <div class="email-content">
            ${content}
        </div>
        
        <div class="footer">
            <div class="contact-info">
                <div class="contact-item"><strong>📍 Address:</strong> ${process.env.CLINIC_ADDRESS || 'Your Clinic Address'}</div>
                <div class="contact-item"><strong>📞 Phone:</strong> ${process.env.CLINIC_PHONE || '+91 93291 98211'}</div>
                <div class="contact-item"><strong>📧 Email:</strong> ${process.env.CLINIC_EMAIL || 'contact@bhargavaclinic.com'}</div>
                <div class="contact-item"><strong>🕒 Hours:</strong> ${process.env.CLINIC_HOURS || 'Mon-Sat: 9AM-7PM, Sun: 10AM-2PM'}</div>
            </div>
            
            <div class="social-links">
                <a href="${process.env.SOCIAL_FACEBOOK || '#'}" class="social-link">Facebook</a>
                <a href="${process.env.SOCIAL_INSTAGRAM || '#'}" class="social-link">Instagram</a>
                <a href="${process.env.SOCIAL_TWITTER || '#'}" class="social-link">Twitter</a>
                <a href="${process.env.SOCIAL_LINKEDIN || '#'}" class="social-link">LinkedIn</a>
            </div>
            
            <p>&copy; ${new Date().getFullYear()} Bhargava Clinic. All rights reserved.</p>
            <p class="unsubscribe">
                This email was sent to you as part of our service communications. 
                If you wish to unsubscribe from similar emails, 
                <a href="${process.env.UNSUBSCRIBE_URL || '#'}" style="color: #a0aec0;">click here</a>.
            </p>
        </div>
    </div>
</body>
</html>
`;

// Contact form email templates
export const sendContactConfirmationEmail = async(contactData) => {
  const { name, email, subject, message, phone } = contactData;

  const userEmailContent = `
        <h1 style="color: #2d3748; margin-bottom: 20px;">Thank You for Contacting Bhargava Clinic</h1>
        
        <div class="greeting">Dear ${name},</div>
        
        <p>Thank you for reaching out to Bhargava Clinic. We have received your message and appreciate you taking the time to contact us. Our team is dedicated to providing you with the best possible care and support.</p>
        
        <div class="message-box">
            <h3 style="color: #2d3748; margin-bottom: 16px;">Your Message Details</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Subject:</span>
                    <span class="info-value">${subject}</span>
                </div>
                ${phone ? `
                <div class="info-item">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${phone}</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <span class="info-label">Submitted:</span>
                    <span class="info-value">${new Date().toLocaleString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}</span>
                </div>
            </div>
            
            <div style="margin-top: 16px;">
                <strong>Your Message:</strong>
                <div style="background: white; padding: 16px; border-radius: 8px; margin-top: 8px; border: 1px solid #e2e8f0;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
        </div>

        <p><strong>What happens next?</strong></p>
        <ul style="margin: 16px 0; padding-left: 20px;">
            <li>Our team will review your inquiry within 1 business day</li>
            <li>We'll contact you using your preferred method</li>
            <li>We'll provide personalized recommendations based on your needs</li>
        </ul>

        <p>For urgent concerns, please don't hesitate to call us directly at <strong>${process.env.CLINIC_PHONE || '+91 93291 98211'}</strong>.</p>

        <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="cta-button">Visit Our Website</a>
        </div>

        <p>We look forward to assisting you with your skin and hair care needs.</p>

        <p style="margin-top: 32px;">
            Warm regards,<br>
            <strong>Dr. Bhargava and Team</strong><br>
            <em>Bhargava Clinic - Skin & Hair Specialists</em>
        </p>
    `;

  const adminEmailContent = `
        <h1 style="color: #2d3748; margin-bottom: 20px;">New Contact Form Submission</h1>
        
        <p>A new contact form submission requires your attention. Here are the complete details:</p>
        
        <div class="message-box">
            <h3 style="color: #2d3748; margin-bottom: 16px;">Contact Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${email}</span>
                </div>
                ${phone ? `
                <div class="info-item">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${phone}</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <span class="info-label">Subject:</span>
                    <span class="info-value">${subject}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Submitted:</span>
                    <span class="info-value">${new Date().toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>

        <div class="message-box">
            <h3 style="color: #2d3748; margin-bottom: 16px;">Message Content</h3>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                ${message.replace(/\n/g, '<br>')}
            </div>
        </div>

        <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="color: #c53030; margin-bottom: 8px;">⚠️ Action Required</h4>
            <p style="color: #744210; margin: 0;">Please respond to this inquiry within <strong>24 hours</strong> to maintain our service standards.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${email}" class="cta-button" style="margin-right: 10px;">📧 Reply via Email</a>
            ${phone ? `<a href="tel:${phone.replace(/\D/g, '')}" class="cta-button">📞 Call Patient</a>` : ''}
        </div>

        <p style="font-size: 14px; color: #718096;">
            <strong>Next Steps:</strong> Review the inquiry, prepare a response, and contact the patient with personalized recommendations.
        </p>
    `;

  try {
    // Send confirmation to user
    await sendEmail({
      to: email,
      subject: `Thank You for Contacting Bhargava Clinic - ${subject}`,
      html: getBaseTemplate('Contact Confirmation - Bhargava Clinic', userEmailContent, '#667eea')
    });

    // Send notification to admin
    await sendEmail({
      to: process.env.CLINIC_EMAIL || process.env.EMAIL_USER,
      subject: `📧 New Contact Form: ${subject} - ${name}`,
      html: getBaseTemplate('New Contact Form Submission', adminEmailContent, '#e53e3e'),
      cc: process.env.CLINIC_CC_EMAILS?.split(',')
    });

    return { success: true, message: 'Contact emails sent successfully' };
  } catch (error) {
    console.error('Failed to send contact emails:', error);
    throw error;
  }
};

// Appointment booking email templates
export const sendAppointmentConfirmationEmail = async(appointmentData) => {
  const { name, email, phone, treatmentType, preferredDate, preferredTime, message, age, gender } = appointmentData;

  const formattedDate = new Date(preferredDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const userEmailContent = `
        <h1 style="color: #2d3748; margin-bottom: 20px;">Appointment Request Received</h1>
        
        <div class="greeting">Dear ${name},</div>
        
        <p>Thank you for choosing Bhargava Clinic for your dermatology needs. We have received your appointment request and are excited to help you achieve your skin and hair goals.</p>
        
        <div class="message-box">
            <h3 style="color: #2d3748; margin-bottom: 16px;">Appointment Details</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Treatment Type:</span>
                    <span class="info-value">${treatmentType}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Preferred Date:</span>
                    <span class="info-value">${formattedDate}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Preferred Time:</span>
                    <span class="info-value">${preferredTime}</span>
                </div>
                ${age ? `
                <div class="info-item">
                    <span class="info-label">Age:</span>
                    <span class="info-value">${age}</span>
                </div>
                ` : ''}
                ${gender ? `
                <div class="info-item">
                    <span class="info-label">Gender:</span>
                    <span class="info-value">${gender}</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <span class="info-label">Contact:</span>
                    <span class="info-value">${phone}</span>
                </div>
            </div>
            
            ${message ? `
            <div style="margin-top: 16px;">
                <strong>Additional Notes:</strong>
                <div style="background: white; padding: 16px; border-radius: 8px; margin-top: 8px; border: 1px solid #e2e8f0;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
            ` : ''}
        </div>

        <div style="background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="color: #276749; margin-bottom: 8px;">📋 Next Steps</h4>
            <ul style="margin: 0; padding-left: 20px; color: #276749;">
                <li>Our team will contact you within <strong>4 business hours</strong> to confirm your appointment</li>
                <li>We'll discuss preparation instructions if needed</li>
                <li>You'll receive a reminder 24 hours before your appointment</li>
            </ul>
        </div>

        <p><strong>Please note:</strong> This is a request for an appointment. Your appointment will be confirmed once our team contacts you and finalizes the timing.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="tel:${process.env.CLINIC_PHONE || '+919329198211'}" class="cta-button" style="margin-right: 10px;">📞 Call Us Now</a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/treatments" class="cta-button">💡 Learn About Treatments</a>
        </div>

        <div class="contact-info">
            <h4 style="margin-bottom: 12px;">📍 Clinic Location</h4>
            <p style="margin: 8px 0;"><strong>Address:</strong> ${process.env.CLINIC_ADDRESS || 'Your Clinic Address'}</p>
            <p style="margin: 8px 0;"><strong>Landmark:</strong> ${process.env.CLINIC_LANDMARK || 'Nearby landmark'}</p>
            <p style="margin: 8px 0;"><strong>Parking:</strong> ${process.env.CLINIC_PARKING || 'Available'}</p>
        </div>

        <p style="margin-top: 32px;">
            Best regards,<br>
            <strong>Dr. Bhargava and Team</strong><br>
            <em>Bhargava Clinic - Skin & Hair Specialists</em>
        </p>
    `;

  const adminEmailContent = `
        <h1 style="color: #2d3748; margin-bottom: 20px;">New Appointment Request</h1>
        
        <p>A new appointment request has been submitted and requires confirmation.</p>
        
        <div class="message-box">
            <h3 style="color: #2d3748; margin-bottom: 16px;">Patient Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Full Name:</span>
                    <span class="info-value">${name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${email}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${phone}</span>
                </div>
                ${age ? `
                <div class="info-item">
                    <span class="info-label">Age:</span>
                    <span class="info-value">${age}</span>
                </div>
                ` : ''}
                ${gender ? `
                <div class="info-item">
                    <span class="info-label">Gender:</span>
                    <span class="info-value">${gender}</span>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="message-box">
            <h3 style="color: #2d3748; margin-bottom: 16px;">Appointment Details</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Treatment:</span>
                    <span class="info-value">${treatmentType}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Preferred Date:</span>
                    <span class="info-value">${formattedDate}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Preferred Time:</span>
                    <span class="info-value">${preferredTime}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Submitted:</span>
                    <span class="info-value">${new Date().toLocaleString('en-IN')}</span>
                </div>
            </div>
            
            ${message ? `
            <div style="margin-top: 16px;">
                <strong>Patient Notes:</strong>
                <div style="background: white; padding: 16px; border-radius: 8px; margin-top: 8px; border: 1px solid #e2e8f0;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
            ` : ''}
        </div>

        <div style="background: #fed7d7; border: 1px solid #feb2b2; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="color: #c53030; margin-bottom: 8px;">🚨 Immediate Action Required</h4>
            <p style="color: #744210; margin: 0;">
                <strong>Contact patient within 4 hours</strong> to confirm appointment availability and provide preliminary instructions.
            </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${email}" class="cta-button" style="margin-right: 10px;">📧 Email Patient</a>
            <a href="tel:${phone.replace(/\D/g, '')}" class="cta-button" style="margin-right: 10px;">📞 Call Patient</a>
            <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin/appointments'}" class="cta-button">📋 View in Dashboard</a>
        </div>

        <div style="background: #e6fffa; border: 1px solid #81e6d9; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="color: #234e52; margin-bottom: 8px;">💡 Suggested Next Steps</h4>
            <ol style="margin: 0; padding-left: 20px; color: #234e52;">
                <li>Check doctor availability for requested time</li>
                <li>Contact patient to confirm or suggest alternatives</li>
                <li>Send confirmed appointment details</li>
                <li>Add to calendar and set reminders</li>
            </ol>
        </div>
    `;

  try {
    // Send confirmation to user
    await sendEmail({
      to: email,
      subject: 'Appointment Request Received - Bhargava Clinic',
      html: getBaseTemplate('Appointment Request Confirmation', userEmailContent, '#4ecdc4')
    });

    // Send notification to admin
    await sendEmail({
      to: process.env.CLINIC_EMAIL || process.env.EMAIL_USER,
      subject: `📅 New Appointment: ${name} - ${treatmentType}`,
      html: getBaseTemplate('New Appointment Request', adminEmailContent, '#ed8936'),
      cc: process.env.CLINIC_CC_EMAILS?.split(','),
      bcc: process.env.CLINIC_BCC_EMAILS?.split(',')
    });

    return { success: true, message: 'Appointment emails sent successfully' };
  } catch (error) {
    console.error('Failed to send appointment emails:', error);
    throw error;
  }
};

// Newsletter subscription email templates
export const sendSubscriptionConfirmationEmail = async(subscriberData) => {
  const { email, name = 'Subscriber' } = subscriberData;

  const userEmailContent = `
        <h1 style="color: #2d3748; margin-bottom: 20px;">Welcome to Our Dermatology Community! </h1>
        
        <div class="greeting">Dear ${name},</div>
        
        <p>Thank you for subscribing to the Bhargava Clinic newsletter! You've taken an important step toward better skin and hair health by joining our community of wellness-conscious individuals.</p>
        
        <div style="background: linear-gradient(135deg, #a8e6cf 0%, #ffd3a5 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 24px 0; color: white;">
            <h2 style="margin-bottom: 16px;">🎉 Welcome Bonus!</h2>
            <p style="font-size: 18px; margin: 0;">As a new subscriber, you'll receive exclusive access to skin care tips and special offers.</p>
        </div>

        <div class="message-box">
            <h3 style="color: #2d3748; margin-bottom: 16px;">What You'll Receive</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                <div style="text-align: center; padding: 16px;">
                    <div style="font-size: 24px; margin-bottom: 8px;">💡</div>
                    <h4 style="margin-bottom: 8px;">Expert Tips</h4>
                    <p style="font-size: 14px;">Weekly skin & hair care advice from our specialists</p>
                </div>
                <div style="text-align: center; padding: 16px;">
                    <div style="font-size: 24px; margin-bottom: 8px;">🔬</div>
                    <h4 style="margin-bottom: 8px;">Latest Research</h4>
                    <p style="font-size: 14px;">Updates on new treatments and technologies</p>
                </div>
                <div style="text-align: center; padding: 16px;">
                    <div style="font-size: 24px; margin-bottom: 8px;">💰</div>
                    <h4 style="margin-bottom: 8px;">Exclusive Offers</h4>
                    <p style="font-size: 14px;">Special discounts and promotional deals</p>
                </div>
                <div style="text-align: center; padding: 16px;">
                    <div style="font-size: 24px; margin-bottom: 8px;">📚</div>
                    <h4 style="margin-bottom: 8px;">Educational Content</h4>
                    <p style="font-size: 14px;">In-depth articles and success stories</p>
                </div>
            </div>
        </div>

        <p><strong>First Newsletter:</strong> Look out for our welcome edition in your inbox within 24 hours!</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/blog" class="cta-button" style="margin-right: 10px;">📚 Read Our Blog</a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/treatments" class="cta-button">💡 Explore Treatments</a>
        </div>

        <div style="background: #f0f4ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="color: #434190; margin-bottom: 8px;">🔒 Your Privacy Matters</h4>
            <p style="margin: 0; font-size: 14px;">
                We respect your inbox. You'll receive 1-2 emails per month with valuable content. 
                You can unsubscribe at any time using the link in our emails.
            </p>
        </div>

        <p style="margin-top: 32px;">
            Warm regards,<br>
            <strong>Dr. Bhargava and Team</strong><br>
            <em>Bhargava Clinic - Skin & Hair Specialists</em>
        </p>
    `;

  const adminEmailContent = `
        <h1 style="color: #2d3748; margin-bottom: 20px;">New Newsletter Subscription</h1>
        
        <p>Great news! A new subscriber has joined your newsletter community.</p>
        
        <div class="message-box">
            <h3 style="color: #2d3748; margin-bottom: 16px;">Subscriber Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${email}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Subscribed:</span>
                    <span class="info-value">${new Date().toLocaleString('en-IN')}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total Subscribers:</span>
                    <span class="info-value">[Auto-increment counter]</span>
                </div>
            </div>
        </div>

        <div style="background: #c6f6d5; border: 1px solid #9ae6b4; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="color: #276749; margin-bottom: 8px;">📈 Growth Update</h4>
            <p style="color: #276749; margin: 0;">
                Your newsletter community is growing! Consider sending a special welcome series to engage new subscribers.
            </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${email}" class="cta-button" style="margin-right: 10px;">👋 Send Welcome</a>
            <a href="${process.env.NEWSLETTER_DASHBOARD || '#'}" class="cta-button">📊 View Analytics</a>
        </div>

        <p style="font-size: 14px; color: #718096;">
            <strong>Next Steps:</strong> Add this subscriber to your mailing list and include them in your next newsletter broadcast.
        </p>
    `;

  try {
    // Send welcome email to subscriber
    await sendEmail({
      to: email,
      subject: 'Welcome to Bhargava Clinic Newsletter! 🎉',
      html: getBaseTemplate('Welcome to Our Newsletter', userEmailContent, '#a8e6cf')
    });

    // Send notification to admin
    await sendEmail({
      to: process.env.CLINIC_EMAIL || process.env.EMAIL_USER,
      subject: `📢 New Newsletter Subscriber: ${email}`,
      html: getBaseTemplate('New Newsletter Subscription', adminEmailContent, '#ffd3a5')
    });

    return { success: true, message: 'Subscription emails sent successfully' };
  } catch (error) {
    console.error('Failed to send subscription emails:', error);
    throw error;
  }
};

// Feedback email templates
export const sendFeedbackConfirmationEmail = async(feedbackData) => {
  const { name, email, rating, treatment, review, visitDate } = feedbackData;

  const userEmailContent = `
        <h1 style="color: #2d3748; margin-bottom: 20px;">Thank You for Your Valuable Feedback!</h1>
        
        <div class="greeting">Dear ${name},</div>
        
        <p>Thank you for taking the time to share your experience with Bhargava Clinic. Your feedback is incredibly valuable in helping us maintain our high standards of care and continuously improve our services.</p>
        
        <div class="message-box">
            <h3 style="color: #2d3748; margin-bottom: 16px;">Your Review Summary</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Treatment Received:</span>
                    <span class="info-value">${treatment}</span>
                </div>
                ${visitDate ? `
                <div class="info-item">
                    <span class="info-label">Visit Date:</span>
                    <span class="info-value">${new Date(visitDate).toLocaleDateString('en-IN')}</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <span class="info-label">Your Rating:</span>
                    <span class="info-value">
                        <span style="color: #fbbf24; font-size: 18px;">
                            ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}
                        </span>
                        (${rating}/5)
                    </span>
                </div>
            </div>
            
            <div style="margin-top: 16px;">
                <strong>Your Review:</strong>
                <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 8px; border: 1px solid #e2e8f0; font-style: italic; line-height: 1.8;">
                    "${review}"
                </div>
            </div>
        </div>

        ${rating >= 4 ? `
        <div style="background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="color: #276749; margin-bottom: 8px;">🌟 We're Thrilled!</h4>
            <p style="color: #276749; margin: 0;">
                Thank you for your wonderful rating! We're delighted that you had a positive experience 
                and appreciate you sharing your feedback with us.
            </p>
        </div>
        ` : rating >= 3 ? `
        <div style="background: #fefcbf; border: 1px solid #faf089; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="color: #744210; margin-bottom: 8px;">💡 Thank You for Your Honest Feedback</h4>
            <p style="color: #744210; margin: 0;">
                We appreciate your honest feedback and are always looking for ways to improve. 
                Your comments will help us enhance our services.
            </p>
        </div>
        ` : `
        <div style="background: #fed7d7; border: 1px solid #feb2b2; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="color: #c53030; margin-bottom: 8px;">🔄 We're Committed to Improvement</h4>
            <p style="color: #744210; margin: 0;">
                We sincerely appreciate your honest feedback and apologize that your experience 
                didn't meet your expectations. We're committed to addressing your concerns.
            </p>
        </div>
        `}

        <p><strong>What happens next?</strong></p>
        <ul style="margin: 16px 0; padding-left: 20px;">
            <li>Our team will review your feedback</li>
            <li>Your review may be featured on our website (with your permission)</li>
            <li>We'll use your insights to improve our services</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/testimonials" class="cta-button" style="margin-right: 10px;">📖 Read Other Testimonials</a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/book-appointment" class="cta-button">📅 Book Next Visit</a>
        </div>

        <p>Your trust in our services means everything to us. We look forward to continuing to serve your skin and hair care needs.</p>

        <p style="margin-top: 32px;">
            Gratefully yours,<br>
            <strong>Dr. Bhargava and Team</strong><br>
            <em>Bhargava Clinic - Skin & Hair Specialists</em>
        </p>
    `;

  const adminEmailContent = `
        <h1 style="color: #2d3748; margin-bottom: 20px;">New Patient Feedback Received</h1>
        
        <p>A patient has submitted feedback about their experience. Here's what they shared:</p>
        
        <div class="message-box">
            <h3 style="color: #2d3748; margin-bottom: 16px;">Patient Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Patient Name:</span>
                    <span class="info-value">${name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${email}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Treatment:</span>
                    <span class="info-value">${treatment}</span>
                </div>
                ${visitDate ? `
                <div class="info-item">
                    <span class="info-label">Visit Date:</span>
                    <span class="info-value">${new Date(visitDate).toLocaleDateString('en-IN')}</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <span class="info-label">Rating:</span>
                    <span class="info-value">
                        <span style="color: #fbbf24; font-size: 16px;">
                            ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}
                        </span>
                        (${rating}/5)
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-label">Submitted:</span>
                    <span class="info-value">${new Date().toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>

        <div class="message-box">
            <h3 style="color: #2d3748; margin-bottom: 16px;">Patient Review</h3>
            <div style="background: white; padding: 24px; border-radius: 8px; border: 2px solid #e2e8f0; font-style: italic; line-height: 1.8;">
                "${review}"
            </div>
        </div>

        ${rating >= 4 ? `
        <div style="background: #c6f6d5; border: 1px solid #9ae6b4; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="color: #276749; margin-bottom: 8px;">✅ Positive Feedback</h4>
            <p style="color: #276749; margin: 0;">
                This positive feedback can be featured on our website and social media (with patient permission).
            </p>
        </div>
        ` : rating >= 3 ? `
        <div style="background: #fefcbf; border: 1px solid #faf089; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="color: #744210; margin-bottom: 8px;">📝 Mixed Feedback</h4>
            <p style="color: #744210; margin: 0;">
                Consider following up with the patient to address any concerns and improve their experience.
            </p>
        </div>
        ` : `
        <div style="background: #fed7d7; border: 1px solid #feb2b2; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="color: #c53030; margin-bottom: 8px;">🚨 Needs Immediate Attention</h4>
            <p style="color: #744210; margin: 0;">
                <strong>Urgent:</strong> Please contact the patient immediately to address their concerns 
                and prevent negative word-of-mouth.
            </p>
        </div>
        `}

        <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${email}" class="cta-button" style="margin-right: 10px;">📧 Thank Patient</a>
            ${rating < 4 ? `<a href="tel:${email}" class="cta-button" style="margin-right: 10px;">📞 Follow Up Call</a>` : ''}
            <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin/feedback'}" class="cta-button">📋 Manage Feedback</a>
        </div>

        <div style="background: #e6fffa; border: 1px solid #81e6d9; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h4 style="color: #234e52; margin-bottom: 8px;">💡 Action Plan</h4>
            <ol style="margin: 0; padding-left: 20px; color: #234e52;">
                <li>Review the feedback with relevant team members</li>
                <li>Decide on appropriate follow-up action</li>
                <li>Consider featuring positive reviews</li>
                <li>Address any service gaps identified</li>
            </ol>
        </div>
    `;

  try {
    // Send confirmation to user
    await sendEmail({
      to: email,
      subject: 'Thank You for Your Feedback - Bhargava Clinic',
      html: getBaseTemplate('Feedback Received', userEmailContent, '#ffd89b')
    });

    // Send notification to admin
    await sendEmail({
      to: process.env.CLINIC_EMAIL || process.env.EMAIL_USER,
      subject: `📝 New Patient Feedback: ${name} - ${rating}/5 Stars - ${treatment}`,
      html: getBaseTemplate('New Patient Feedback', adminEmailContent, '#667eea'),
      cc: process.env.CLINIC_CC_EMAILS?.split(','),
      bcc: process.env.CLINIC_BCC_EMAILS?.split(',')
    });

    return { success: true, message: 'Feedback emails sent successfully' };
  } catch (error) {
    console.error('Failed to send feedback emails:', error);
    throw error;
  }
};

// Additional utility function for sending custom emails
export const sendCustomEmail = async(to, subject, content, options = {}) => {
  const emailContent = `
        <h1 style="color: #2d3748; margin-bottom: 20px;">${subject}</h1>
        <div class="greeting">${options.greeting || 'Dear Valued Patient,'}</div>
        <div style="line-height: 1.8;">
            ${content}
        </div>
        ${options.cta ? `
        <div style="text-align: center; margin: 30px 0;">
            <a href="${options.cta.url}" class="cta-button">${options.cta.text}</a>
        </div>
        ` : ''}
    `;

  return await sendEmail({
    to,
    subject,
    html: getBaseTemplate(subject, emailContent, options.headerColor || '#667eea'),
    ...options
  });
};

export default {
  sendEmail,
  sendContactConfirmationEmail,
  sendAppointmentConfirmationEmail,
  sendSubscriptionConfirmationEmail,
  sendFeedbackConfirmationEmail,
  sendCustomEmail
};
