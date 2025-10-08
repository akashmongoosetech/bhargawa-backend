import mongoose from 'mongoose';
import slugify from 'slugify';

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    minlength: [5, 'Subject must be at least 5 characters'],
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'archived'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  assignedTo: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  repliedAt: {
    type: Date
  },
  archivedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ priority: 1 });
contactSchema.index({ createdAt: -1 });

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  treatmentType: {
    type: String,
    required: [true, 'Treatment type is required'],
    trim: true
  },
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required']
  },
  preferredTime: {
    type: String,
    required: [true, 'Preferred time is required'],
    trim: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  confirmedDate: {
    type: Date
  },
  confirmedTime: {
    type: String,
    trim: true
  },
  actualDate: {
    type: Date
  },
  actualTime: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    default: 60, // minutes
    min: [15, 'Duration must be at least 15 minutes'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  assignedTo: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancelledReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  referenceId: {
    type: String,
    unique: true,
    default: () => `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  }
}, {
  timestamps: true
});

// Indexes for better performance
appointmentSchema.index({ email: 1 });
appointmentSchema.index({ phone: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ priority: 1 });
appointmentSchema.index({ treatmentType: 1 });
appointmentSchema.index({ preferredDate: 1 });
appointmentSchema.index({ referenceId: 1 });
appointmentSchema.index({ createdAt: -1 });

// Blog Schema
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    trim: true,
    minlength: [20, 'Excerpt must be at least 20 characters'],
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    minlength: [100, 'Content must be at least 100 characters']
  },
  image: {
    type: String,
    trim: true
  },
  author: {
    type: String,
    trim: true,
    default: 'Bhargava Clinic'
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  readTime: {
    type: String,
    trim: true,
    default: '5 min read'
  },
  tags: [{
    type: String,
    trim: true
  }],
  sections: [{
    title: {
      type: String,
      trim: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: String,
      trim: true
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  seoKeywords: [{
    type: String,
    trim: true
  }],
  metaTags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Generate slug from title before saving
blogSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

// Indexes for better performance
blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ tags: 1 });

// Subscriber Schema
const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  source: {
    type: String,
    trim: true,
    default: 'website'
  }
}, {
  timestamps: true
});

// Indexes for better performance
subscriberSchema.index({ email: 1 });
subscriberSchema.index({ createdAt: -1 });

// Create models
const Contact = mongoose.model('Contact', contactSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const Blog = mongoose.model('Blog', blogSchema);
const Subscriber = mongoose.model('Subscriber', subscriberSchema);

export { Contact, Appointment, Blog, Subscriber };
