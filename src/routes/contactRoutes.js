import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Contact } from '../models/index.js';
import { asyncHandler, sendSuccessResponse, sendErrorResponse, formatValidationErrors } from '../middleware/errorHandler.js';
import { sendContactConfirmationEmail } from '../services/emailService.js';

const router = express.Router();

// Validation middleware
const validateContact = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters')
];

const validateContactUpdate = [
  body('status')
    .optional()
    .isIn(['new', 'read', 'replied', 'archived'])
    .withMessage('Status must be one of: new, read, replied, archived'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('assignedTo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Assigned to cannot exceed 100 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// @route   POST /api/contact
// @desc    Create a new contact
// @access  Public
router.post('/', validateContact, asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const { name, email, subject, message } = req.body;

  const contact = new Contact({
    name,
    email,
    subject,
    message
  });

  await contact.save();

  // Send confirmation emails asynchronously (don't wait for completion)
  try {
    sendContactConfirmationEmail({ name, email, subject, message });
  } catch (emailError) {
    console.error('Failed to send contact confirmation email:', emailError);
    // Don't fail the request if email fails
  }

  sendSuccessResponse(res, 'Contact created successfully', contact, 201);
}));

// @route   GET /api/contact
// @desc    Get all contacts with pagination and filtering
// @access  Public
router.get('/', asyncHandler(async(req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { subject: { $regex: req.query.search, $options: 'i' } },
      { message: { $regex: req.query.search, $options: 'i' } }
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

  const contacts = await Contact.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Contact.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  const pagination = {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 'Contacts retrieved successfully', {
    contacts,
    pagination
  });
}));

// @route   GET /api/contact/:id
// @desc    Get contact by ID
// @access  Public
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid contact ID')
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    return sendErrorResponse(res, 'Contact not found', 404);
  }

  sendSuccessResponse(res, 'Contact retrieved successfully', contact);
}));

// @route   PUT /api/contact/:id
// @desc    Update contact
// @access  Public
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid contact ID'),
  ...validateContactUpdate
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    return sendErrorResponse(res, 'Contact not found', 404);
  }

  // Update fields
  const updateData = req.body;

  // Handle status changes
  if (updateData.status === 'replied' && contact.status !== 'replied') {
    updateData.repliedAt = new Date();
  }

  if (updateData.status === 'archived' && contact.status !== 'archived') {
    updateData.archivedAt = new Date();
  }

  const updatedContact = await Contact.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  sendSuccessResponse(res, 'Contact updated successfully', updatedContact);
}));

// @route   DELETE /api/contact/:id
// @desc    Delete contact
// @access  Public
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid contact ID')
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    return sendErrorResponse(res, 'Contact not found', 404);
  }

  await Contact.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, 'Contact deleted successfully');
}));

// @route   GET /api/contact/stats/summary
// @desc    Get contact statistics
// @access  Public
router.get('/stats/summary', asyncHandler(async(req, res) => {
  const stats = await Contact.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
        replied: { $sum: { $cond: [{ $eq: ['$status', 'replied'] }, 1, 0] } },
        archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
        lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
      }
    }
  ]);

  const result = stats.length > 0 ? stats[0] : {
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
    archived: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  };

  // Remove _id field
  delete result._id;

  sendSuccessResponse(res, 'Contact statistics retrieved successfully', result);
}));

export default router;
