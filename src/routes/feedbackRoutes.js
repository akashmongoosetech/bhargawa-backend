import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { Feedback } from '../models/index.js';
import { asyncHandler, sendSuccessResponse, sendErrorResponse, formatValidationErrors } from '../middleware/errorHandler.js';
import { sendFeedbackConfirmationEmail } from '../services/emailService.js';

/* global setImmediate */

const router = express.Router();

// Validation middleware
const validateFeedback = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('treatment')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Treatment type must be between 2 and 100 characters'),
  body('review')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Review must be between 10 and 1000 characters'),
  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image must be a valid URL')
];

const validateFeedbackUpdate = [
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be one of: pending, approved, rejected'),
  body('isApproved')
    .optional()
    .isBoolean()
    .withMessage('isApproved must be a boolean'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('featured must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Admin notes cannot exceed 500 characters')
];

// @route   POST /api/feedback
// @desc    Create a new feedback
// @access  Public
router.post('/', validateFeedback, asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const { name, email, rating, treatment, review, image } = req.body;

  // Check if user already submitted feedback
  const existingFeedback = await Feedback.findOne({ email });
  if (existingFeedback) {
    return sendErrorResponse(res, 'You have already submitted feedback. Thank you!', 409);
  }

  const feedback = new Feedback({
    name,
    email,
    rating,
    treatment,
    review,
    image: image || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'approved',
    isApproved: true,
    approvedAt: new Date()
  });

  await feedback.save();

  // Send confirmation email asynchronously
  setImmediate(async() => {
    try {
      await sendFeedbackConfirmationEmail({ name, email, rating, treatment, review });
      console.log('✅ Feedback confirmation email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send feedback confirmation email:', emailError.message);
    }
  });

  sendSuccessResponse(res, 'Feedback submitted successfully. Thank you for your review!', feedback, 201);
}));

// @route   GET /api/feedback
// @desc    Get all feedback with pagination and filtering
// @access  Public
router.get('/', asyncHandler(async(req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  const filter = {};

  // For public access, only show approved feedback by default
  if (req.query.admin !== 'true') {
    filter.isApproved = true;
    filter.status = 'approved';
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.rating) {
    filter.rating = parseInt(req.query.rating);
  }

  if (req.query.treatment) {
    filter.treatment = { $regex: req.query.treatment, $options: 'i' };
  }

  if (req.query.featured) {
    filter.featured = req.query.featured === 'true';
  }

  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { treatment: { $regex: req.query.search, $options: 'i' } },
      { review: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Date filtering
  if (req.query.dateFrom || req.query.dateTo) {
    filter.createdAt = {};
    if (req.query.dateFrom) {
      filter.createdAt.$gte = new Date(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      filter.createdAt.$lte = new Date(req.query.dateTo);
    }
  }

  // Sort order: featured first, then by approved date, then by creation date
  const sortOrder = req.query.admin === 'true'
    ? { createdAt: -1 }
    : { featured: -1, approvedAt: -1, createdAt: -1 };

  const feedback = await Feedback.find(filter)
    .sort(sortOrder)
    .skip(skip)
    .limit(limit);

  const total = await Feedback.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  const pagination = {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 'Feedback retrieved successfully', {
    feedback,
    pagination
  });
}));

// @route   GET /api/feedback/featured
// @desc    Get featured feedback for display
// @access  Public
router.get('/featured', asyncHandler(async(req, res) => {
  const limit = parseInt(req.query.limit) || 6;

  const featuredFeedback = await Feedback.find({
    isApproved: true,
    status: 'approved',
    featured: true
  })
    .sort({ approvedAt: -1, createdAt: -1 })
    .limit(limit);

  sendSuccessResponse(res, 'Featured feedback retrieved successfully', featuredFeedback);
}));

// @route   GET /api/feedback/stats
// @desc    Get feedback statistics
// @access  Public
router.get('/stats/summary', asyncHandler(async(req, res) => {
  const [totalCount, approvedCount, pendingCount, rejectedCount, featuredCount, ratings] = await Promise.all([
    Feedback.countDocuments(),
    Feedback.countDocuments({ isApproved: true, status: 'approved' }),
    Feedback.countDocuments({ status: 'pending' }),
    Feedback.countDocuments({ status: 'rejected' }),
    Feedback.countDocuments({ featured: true }),
    Feedback.aggregate([
      { $match: { isApproved: true, status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);

  // Calculate average rating
  const ratingCounts = ratings.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const totalRatings = Object.values(ratingCounts).reduce((sum, count) => sum + count, 0);
  const totalRatingValue = Object.entries(ratingCounts).reduce((sum, [rating, count]) => sum + (rating * count), 0);
  const averageRating = totalRatings > 0 ? (totalRatingValue / totalRatings).toFixed(1) : 0;

  const stats = {
    total: totalCount,
    approved: approvedCount,
    pending: pendingCount,
    rejected: rejectedCount,
    featured: featuredCount,
    averageRating: parseFloat(averageRating),
    ratingDistribution: ratingCounts
  };

  sendSuccessResponse(res, 'Feedback statistics retrieved successfully', stats);
}));

// @route   GET /api/feedback/:id
// @desc    Get feedback by ID
// @access  Public
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid feedback ID')
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return sendErrorResponse(res, 'Feedback not found', 404);
  }

  sendSuccessResponse(res, 'Feedback retrieved successfully', feedback);
}));

// @route   PUT /api/feedback/:id
// @desc    Update feedback (admin only)
// @access  Public (should be protected in production)
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid feedback ID'),
  ...validateFeedbackUpdate
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return sendErrorResponse(res, 'Feedback not found', 404);
  }

  const updateData = req.body;

  // Handle approval status changes
  if (updateData.status === 'approved' && feedback.status !== 'approved') {
    updateData.isApproved = true;
    updateData.approvedAt = new Date();
  } else if (updateData.status === 'rejected') {
    updateData.isApproved = false;
    updateData.approvedAt = null;
  }

  // Handle isApproved changes
  if (updateData.isApproved === true && !feedback.isApproved) {
    updateData.status = 'approved';
    updateData.approvedAt = new Date();
  } else if (updateData.isApproved === false) {
    updateData.status = 'rejected';
    updateData.approvedAt = null;
  }

  const updatedFeedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  sendSuccessResponse(res, 'Feedback updated successfully', updatedFeedback);
}));

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback
// @access  Public (should be protected in production)
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid feedback ID')
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return sendErrorResponse(res, 'Feedback not found', 404);
  }

  await Feedback.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, 'Feedback deleted successfully');
}));

// @route   POST /api/feedback/:id/approve
// @desc    Approve feedback
// @access  Public (should be protected in production)
router.post('/:id/approve', [
  param('id').isMongoId().withMessage('Invalid feedback ID')
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return sendErrorResponse(res, 'Feedback not found', 404);
  }

  const updatedFeedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    {
      status: 'approved',
      isApproved: true,
      approvedAt: new Date()
    },
    { new: true, runValidators: true }
  );

  sendSuccessResponse(res, 'Feedback approved successfully', updatedFeedback);
}));

// @route   POST /api/feedback/:id/feature
// @desc    Toggle featured status
// @access  Public (should be protected in production)
router.post('/:id/feature', [
  param('id').isMongoId().withMessage('Invalid feedback ID')
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return sendErrorResponse(res, 'Feedback not found', 404);
  }

  const updatedFeedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { featured: !feedback.featured },
    { new: true, runValidators: true }
  );

  const message = updatedFeedback.featured ? 'Feedback featured successfully' : 'Feedback unfeatured successfully';
  sendSuccessResponse(res, message, updatedFeedback);
}));


export default router;
