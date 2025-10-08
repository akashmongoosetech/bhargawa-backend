import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Appointment } from '../models/index.js';
import { asyncHandler, sendSuccessResponse, sendErrorResponse, formatValidationErrors } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation middleware
const validateAppointment = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .trim()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  body('treatmentType')
    .trim()
    .notEmpty()
    .withMessage('Treatment type is required'),
  body('preferredDate')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('preferredTime')
    .trim()
    .notEmpty()
    .withMessage('Preferred time is required'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
];

const validateAppointmentUpdate = [
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no-show'])
    .withMessage('Status must be one of: pending, confirmed, cancelled, completed, no-show'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
  body('confirmedDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid confirmed date'),
  body('confirmedTime')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Confirmed time cannot exceed 50 characters'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('assignedTo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Assigned to cannot exceed 100 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('cancelledReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters')
];

const validateAppointmentConfirm = [
  body('confirmedDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid confirmed date'),
  body('confirmedTime')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Confirmed time cannot exceed 50 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// @route   POST /api/appointment
// @desc    Create a new appointment
// @access  Public
router.post('/', validateAppointment, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const { name, email, phone, treatmentType, preferredDate, preferredTime, message } = req.body;

  // Check if preferred date is not in the past
  const selectedDate = new Date(preferredDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return sendErrorResponse(res, 'Preferred date cannot be in the past', 400);
  }

  const appointment = new Appointment({
    name,
    email,
    phone,
    treatmentType,
    preferredDate: selectedDate,
    preferredTime,
    message
  });

  await appointment.save();

  sendSuccessResponse(res, 'Appointment created successfully', appointment, 201);
}));

// @route   GET /api/appointment
// @desc    Get all appointments with pagination and filtering
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
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
  
  if (req.query.treatmentType) {
    filter.treatmentType = req.query.treatmentType;
  }
  
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } },
      { treatmentType: { $regex: req.query.search, $options: 'i' } },
      { referenceId: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Date filtering
  if (req.query.dateFrom || req.query.dateTo) {
    filter.preferredDate = {};
    if (req.query.dateFrom) {
      filter.preferredDate.$gte = new Date(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      filter.preferredDate.$lte = new Date(req.query.dateTo);
    }
  }

  const appointments = await Appointment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Appointment.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  const pagination = {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 'Appointments retrieved successfully', {
    appointments,
    pagination
  });
}));

// @route   GET /api/appointment/:id
// @desc    Get appointment by ID
// @access  Public
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid appointment ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    return sendErrorResponse(res, 'Appointment not found', 404);
  }

  sendSuccessResponse(res, 'Appointment retrieved successfully', appointment);
}));

// @route   PUT /api/appointment/:id
// @desc    Update appointment
// @access  Public
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid appointment ID'),
  ...validateAppointmentUpdate
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    return sendErrorResponse(res, 'Appointment not found', 404);
  }

  // Update fields
  const updateData = req.body;
  
  // Handle status changes
  if (updateData.status === 'cancelled' && appointment.status !== 'cancelled') {
    updateData.cancelledAt = new Date();
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  sendSuccessResponse(res, 'Appointment updated successfully', updatedAppointment);
}));

// @route   DELETE /api/appointment/:id
// @desc    Delete appointment
// @access  Public
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid appointment ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    return sendErrorResponse(res, 'Appointment not found', 404);
  }

  await Appointment.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, 'Appointment deleted successfully');
}));

// @route   POST /api/appointment/:id/confirm
// @desc    Confirm appointment
// @access  Public
router.post('/:id/confirm', [
  param('id').isMongoId().withMessage('Invalid appointment ID'),
  ...validateAppointmentConfirm
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const appointment = await Appointment.findById(req.params.id);
  
  if (!appointment) {
    return sendErrorResponse(res, 'Appointment not found', 404);
  }

  const updateData = {
    status: 'confirmed',
    ...req.body
  };

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  sendSuccessResponse(res, 'Appointment confirmed successfully', updatedAppointment);
}));

// @route   GET /api/appointment/stats/summary
// @desc    Get appointment statistics
// @access  Public
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const stats = await Appointment.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        noShow: { $sum: { $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0] } },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
        lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
      }
    }
  ]);

  const result = stats.length > 0 ? stats[0] : {
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    noShow: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  };

  // Remove _id field
  delete result._id;

  sendSuccessResponse(res, 'Appointment statistics retrieved successfully', result);
}));

// @route   GET /api/appointment/treatments
// @desc    Get available treatments and time slots
// @access  Public
router.get('/treatments', asyncHandler(async (req, res) => {
  const treatments = [
    'Acne Treatment',
    'Anti-Aging Treatment',
    'Chemical Peels',
    'Pigmentation Treatment',
    'Hair Transplant',
    'PRP Hair Therapy',
    'Hair Loss Treatment',
    'Scalp Treatment',
    'Laser Hair Removal',
    'Laser Skin Resurfacing',
    'Laser Tattoo Removal',
    'Laser Pigmentation Removal',
    'General Consultation'
  ];

  const timeSlots = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
    '6:00 PM'
  ];

  sendSuccessResponse(res, 'Treatments and time slots retrieved successfully', {
    treatments,
    timeSlots
  });
}));

export default router;
