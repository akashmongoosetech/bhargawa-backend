import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Gallery } from '../models/index.js';
import { asyncHandler, sendSuccessResponse, sendErrorResponse, formatValidationErrors } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation middleware
const validateGallery = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('category')
    .isIn(['before-after', 'clinic'])
    .withMessage('Category must be either before-after or clinic'),
  body('beforeUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Before URL must be a valid URL'),
  body('afterUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('After URL must be a valid URL'),
  body('url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),
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

const validateGalleryUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('category')
    .optional()
    .isIn(['before-after', 'clinic'])
    .withMessage('Category must be either before-after or clinic'),
  body('beforeUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Before URL must be a valid URL'),
  body('afterUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('After URL must be a valid URL'),
  body('url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a positive integer'),
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

// @route   POST /api/gallery
// @desc    Create a new gallery item
// @access  Public
router.post('/', validateGallery, asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const galleryData = req.body;

  const gallery = new Gallery(galleryData);
  await gallery.save();

  sendSuccessResponse(res, 'Gallery item created successfully', gallery, 201);
}));

// @route   GET /api/gallery
// @desc    Get all gallery items with pagination and filtering
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

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { tags: { $in: [new RegExp(req.query.search, 'i')] } }
    ];
  }

  const sort = req.query.sort === 'order' ? { order: 1, createdAt: -1 } : { createdAt: -1 };

  const galleryItems = await Gallery.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Gallery.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  const pagination = {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 'Gallery items retrieved successfully', {
    galleryItems,
    pagination
  });
}));

// @route   GET /api/gallery/:id
// @desc    Get gallery item by ID
// @access  Public
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid gallery ID')
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const gallery = await Gallery.findById(req.params.id);

  if (!gallery) {
    return sendErrorResponse(res, 'Gallery item not found', 404);
  }

  sendSuccessResponse(res, 'Gallery item retrieved successfully', gallery);
}));

// @route   PUT /api/gallery/:id
// @desc    Update gallery item
// @access  Public
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid gallery ID'),
  ...validateGalleryUpdate
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const gallery = await Gallery.findById(req.params.id);

  if (!gallery) {
    return sendErrorResponse(res, 'Gallery item not found', 404);
  }

  const updatedGallery = await Gallery.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  sendSuccessResponse(res, 'Gallery item updated successfully', updatedGallery);
}));

// @route   DELETE /api/gallery/:id
// @desc    Delete gallery item
// @access  Public
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid gallery ID')
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const gallery = await Gallery.findById(req.params.id);

  if (!gallery) {
    return sendErrorResponse(res, 'Gallery item not found', 404);
  }

  await Gallery.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, 'Gallery item deleted successfully');
}));

// @route   PUT /api/gallery/:id/order
// @desc    Update gallery item order
// @access  Public
router.put('/:id/order', [
  param('id').isMongoId().withMessage('Invalid gallery ID'),
  body('order').isInt({ min: 0 }).withMessage('Order must be a positive integer')
], asyncHandler(async(req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const gallery = await Gallery.findById(req.params.id);

  if (!gallery) {
    return sendErrorResponse(res, 'Gallery item not found', 404);
  }

  const updatedGallery = await Gallery.findByIdAndUpdate(
    req.params.id,
    { order: req.body.order },
    { new: true }
  );

  sendSuccessResponse(res, 'Gallery item order updated successfully', updatedGallery);
}));

export default router;
