import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Subscriber } from '../models/index.js';
import { asyncHandler, sendSuccessResponse, sendErrorResponse, formatValidationErrors } from '../middleware/errorHandler.js';
import { sendSubscriptionConfirmationEmail } from '../services/emailService.js';

const router = express.Router();

// Validation middleware
const validateSubscription = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('source')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Source cannot exceed 50 characters')
];

// @route   POST /api/subscriber
// @desc    Subscribe to newsletter
// @access  Public
router.post('/', validateSubscription, asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const { email, source = 'website' } = req.body;

  // Check if email already exists
  const existingSubscriber = await Subscriber.findOne({ email });
  if (existingSubscriber) {
    return sendErrorResponse(res, 'Email is already subscribed', 400);
  }

  const subscriber = new Subscriber({
    email,
    source
  });

  await subscriber.save();

  // Send confirmation emails asynchronously (don't wait for completion)
  setImmediate(async() => {
    try {
      await sendSubscriptionConfirmationEmail({ email });
      console.log('✅ Subscription confirmation emails sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send subscription confirmation email:', emailError.message);
      // Don't fail the request if email fails
    }
  });

  sendSuccessResponse(res, 'Successfully subscribed to newsletter', subscriber, 201);
}));

// @route   GET /api/subscriber
// @desc    Get all subscribers with pagination and filtering
// @access  Public
router.get('/', asyncHandler(async(req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  const filter = {};

  if (req.query.search) {
    filter.email = { $regex: req.query.search, $options: 'i' };
  }

  if (req.query.source) {
    filter.source = req.query.source;
  }

  const subscribers = await Subscriber.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Subscriber.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  const pagination = {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 'Subscribers retrieved successfully', {
    subscribers,
    pagination
  });
}));

// @route   DELETE /api/subscriber/:id
// @desc    Unsubscribe from newsletter
// @access  Public
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid subscriber ID')
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const subscriber = await Subscriber.findById(req.params.id);

  if (!subscriber) {
    return sendErrorResponse(res, 'Subscriber not found', 404);
  }

  await Subscriber.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, 'Successfully unsubscribed from newsletter');
}));

// @route   GET /api/subscriber/stats/summary
// @desc    Get subscriber statistics
// @access  Public
router.get('/stats/summary', asyncHandler(async(req, res) => {
  const stats = await Subscriber.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        website: { $sum: { $cond: [{ $eq: ['$source', 'website'] }, 1, 0] } },
        footer: { $sum: { $cond: [{ $eq: ['$source', 'footer'] }, 1, 0] } },
        popup: { $sum: { $cond: [{ $eq: ['$source', 'popup'] }, 1, 0] } },
        other: { $sum: { $cond: [{ $nin: ['$source', ['website', 'footer', 'popup']] }, 1, 0] } }
      }
    }
  ]);

  const result = stats.length > 0 ? stats[0] : {
    total: 0,
    website: 0,
    footer: 0,
    popup: 0,
    other: 0
  };

  // Remove _id field
  delete result._id;

  sendSuccessResponse(res, 'Subscriber statistics retrieved successfully', result);
}));

export default router;
