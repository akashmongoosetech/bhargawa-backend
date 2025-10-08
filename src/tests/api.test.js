import request from 'supertest';
import app from '../src/server.js';

describe('API Endpoints', () => {
  describe('Health Check', () => {
    it('should return server health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('OK');
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const res = await request(app)
        .get('/')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Bhargava Clinic API Server');
    });
  });

  describe('Contact Endpoints', () => {
    it('should create a new contact', async () => {
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message for the contact form.'
      };

      const res = await request(app)
        .post('/api/contact')
        .send(contactData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(contactData.name);
      expect(res.body.data.email).toBe(contactData.email);
    });

    it('should get contacts with pagination', async () => {
      const res = await request(app)
        .get('/api/contact')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('contacts');
      expect(res.body.data).toHaveProperty('pagination');
    });

    it('should get contact statistics', async () => {
      const res = await request(app)
        .get('/api/contact/stats/summary')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('new');
    });
  });

  describe('Appointment Endpoints', () => {
    it('should create a new appointment', async () => {
      const appointmentData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        treatmentType: 'Acne Treatment',
        preferredDate: '2024-12-31',
        preferredTime: '10:00 AM',
        message: 'I would like to schedule an appointment.'
      };

      const res = await request(app)
        .post('/api/appointment')
        .send(appointmentData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(appointmentData.name);
      expect(res.body.data.email).toBe(appointmentData.email);
    });

    it('should get appointments with pagination', async () => {
      const res = await request(app)
        .get('/api/appointment')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('appointments');
      expect(res.body.data).toHaveProperty('pagination');
    });

    it('should get treatments and time slots', async () => {
      const res = await request(app)
        .get('/api/appointment/treatments')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('treatments');
      expect(res.body.data).toHaveProperty('timeSlots');
    });
  });

  describe('Blog Endpoints', () => {
    it('should create a new blog post', async () => {
      const blogData = {
        title: 'Test Blog Post',
        slug: 'test-blog-post',
        excerpt: 'This is a test blog post excerpt for testing purposes.',
        content: 'This is the full content of the test blog post. It contains enough text to meet the minimum requirements for blog post content.',
        status: 'draft'
      };

      const res = await request(app)
        .post('/api/blog')
        .send(blogData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(blogData.title);
      expect(res.body.data.slug).toBe(blogData.slug);
    });

    it('should get blog posts with pagination', async () => {
      const res = await request(app)
        .get('/api/blog')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('blogs');
      expect(res.body.data).toHaveProperty('pagination');
    });
  });

  describe('Subscriber Endpoints', () => {
    it('should subscribe to newsletter', async () => {
      const subscriberData = {
        email: 'subscriber@example.com',
        source: 'test'
      };

      const res = await request(app)
        .post('/api/subscriber')
        .send(subscriberData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(subscriberData.email);
    });

    it('should get subscribers with pagination', async () => {
      const res = await request(app)
        .get('/api/subscriber')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('subscribers');
      expect(res.body.data).toHaveProperty('pagination');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });

    it('should return validation errors for invalid data', async () => {
      const invalidContact = {
        name: 'A', // Too short
        email: 'invalid-email', // Invalid format
        subject: 'Test', // Too short
        message: 'Short' // Too short
      };

      const res = await request(app)
        .post('/api/contact')
        .send(invalidContact)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });
});
