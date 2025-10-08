import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Blog } from '../models/index.js';
import { asyncHandler, sendSuccessResponse, sendErrorResponse, formatValidationErrors } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation middleware
const validateBlog = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('slug')
    .trim()
    .isLength({ min: 3, max: 200 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('excerpt')
    .trim()
    .isLength({ min: 20, max: 500 })
    .withMessage('Excerpt must be between 20 and 500 characters'),
  body('content')
    .trim()
    .isLength({ min: 100 })
    .withMessage('Content must be at least 100 characters'),
  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('author')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Author cannot exceed 100 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  body('readTime')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Read time cannot exceed 50 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('sections')
    .optional()
    .isArray()
    .withMessage('Sections must be an array'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be either draft or published'),
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
  body('seoKeywords')
    .optional()
    .isArray()
    .withMessage('SEO keywords must be an array'),
  body('metaTags')
    .optional()
    .isArray()
    .withMessage('Meta tags must be an array')
];

const validateBlogUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ min: 20, max: 500 })
    .withMessage('Excerpt must be between 20 and 500 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 100 })
    .withMessage('Content must be at least 100 characters'),
  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image must be a valid URL'),
  body('author')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Author cannot exceed 100 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  body('readTime')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Read time cannot exceed 50 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('sections')
    .optional()
    .isArray()
    .withMessage('Sections must be an array'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be either draft or published'),
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta description cannot exceed 160 characters'),
  body('seoKeywords')
    .optional()
    .isArray()
    .withMessage('SEO keywords must be an array'),
  body('metaTags')
    .optional()
    .isArray()
    .withMessage('Meta tags must be an array')
];

// @route   POST /api/blog
// @desc    Create a new blog post
// @access  Public
router.post('/', validateBlog, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const blogData = req.body;

  // Check if slug already exists
  const existingBlog = await Blog.findOne({ slug: blogData.slug });
  if (existingBlog) {
    return sendErrorResponse(res, 'A blog post with this slug already exists', 400);
  }

  // Set publishedAt if status is published
  if (blogData.status === 'published') {
    blogData.publishedAt = new Date();
  }

  const blog = new Blog(blogData);
  await blog.save();

  sendSuccessResponse(res, 'Blog post created successfully', blog, 201);
}));

// @route   GET /api/blog
// @desc    Get all blog posts with pagination and filtering
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
  
  if (req.query.category) {
    filter.category = req.query.category;
  }
  
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { excerpt: { $regex: req.query.search, $options: 'i' } },
      { content: { $regex: req.query.search, $options: 'i' } },
      { tags: { $in: [new RegExp(req.query.search, 'i')] } }
    ];
  }

  // Sort by publishedAt for published posts, createdAt for drafts
  const sort = req.query.status === 'published' 
    ? { publishedAt: -1, createdAt: -1 }
    : { createdAt: -1 };

  const blogs = await Blog.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Blog.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  const pagination = {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };

  sendSuccessResponse(res, 'Blog posts retrieved successfully', {
    blogs,
    pagination
  });
}));

// @route   GET /api/blog/:slug
// @desc    Get blog post by slug
// @access  Public
router.get('/:slug', [
  param('slug').isLength({ min: 3, max: 200 }).withMessage('Invalid slug')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const blog = await Blog.findOne({ slug: req.params.slug });
  
  if (!blog) {
    return sendErrorResponse(res, 'Blog post not found', 404);
  }

  // Only return published posts unless specifically requesting drafts
  if (blog.status === 'draft' && req.query.status !== 'draft') {
    return sendErrorResponse(res, 'Blog post not found', 404);
  }

  sendSuccessResponse(res, 'Blog post retrieved successfully', blog);
}));

// @route   PUT /api/blog/:id
// @desc    Update blog post
// @access  Public
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid blog ID'),
  ...validateBlogUpdate
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const blog = await Blog.findById(req.params.id);
  
  if (!blog) {
    return sendErrorResponse(res, 'Blog post not found', 404);
  }

  // Check if slug already exists (excluding current blog)
  if (req.body.slug && req.body.slug !== blog.slug) {
    const existingBlog = await Blog.findOne({ 
      slug: req.body.slug, 
      _id: { $ne: req.params.id } 
    });
    if (existingBlog) {
      return sendErrorResponse(res, 'A blog post with this slug already exists', 400);
    }
  }

  // Handle status changes
  const updateData = req.body;
  if (updateData.status === 'published' && blog.status !== 'published') {
    updateData.publishedAt = new Date();
  }

  const updatedBlog = await Blog.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  sendSuccessResponse(res, 'Blog post updated successfully', updatedBlog);
}));

// @route   DELETE /api/blog/:id
// @desc    Delete blog post
// @access  Public
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid blog ID')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 'Validation failed', 400, formatValidationErrors(errors));
  }

  const blog = await Blog.findById(req.params.id);
  
  if (!blog) {
    return sendErrorResponse(res, 'Blog post not found', 404);
  }

  await Blog.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, 'Blog post deleted successfully');
}));

export default router;
