import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Contact, Appointment, Blog, Subscriber } from '../models/index.js';

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Clear existing data
    await Contact.deleteMany({});
    await Appointment.deleteMany({});
    await Blog.deleteMany({});
    await Subscriber.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Seed contacts
    const contacts = [
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        subject: 'Skin Treatment Inquiry',
        message: 'I am interested in learning more about your acne treatment options. I have been struggling with acne for years and would like to schedule a consultation.',
        status: 'new',
        priority: 'high',
        tags: ['acne', 'consultation', 'skin']
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        subject: 'Hair Restoration Consultation',
        message: 'I would like to discuss hair transplant options. I have been experiencing hair loss and am interested in your PRP therapy treatments.',
        status: 'read',
        priority: 'medium',
        tags: ['hair', 'transplant', 'prp']
      },
      {
        name: 'Emily Davis',
        email: 'emily.davis@email.com',
        subject: 'Laser Treatment Questions',
        message: 'I am considering laser hair removal and would like to know more about the process, pricing, and expected results.',
        status: 'replied',
        priority: 'low',
        tags: ['laser', 'hair-removal', 'pricing']
      },
      {
        name: 'David Wilson',
        email: 'david.wilson@email.com',
        subject: 'Anti-Aging Treatment',
        message: 'I am interested in anti-aging treatments. Could you please provide information about chemical peels and other available options?',
        status: 'archived',
        priority: 'medium',
        tags: ['anti-aging', 'chemical-peels']
      }
    ];

    await Contact.insertMany(contacts);
    console.log('📞 Seeded contacts');

    // Seed appointments
    const appointments = [
      {
        name: 'Jennifer Brown',
        email: 'jennifer.brown@email.com',
        phone: '+1-555-0123',
        treatmentType: 'Acne Treatment',
        preferredDate: new Date('2024-12-15'),
        preferredTime: '10:00 AM',
        message: 'I have sensitive skin and would like to discuss treatment options.',
        status: 'pending',
        priority: 'high',
        tags: ['acne', 'sensitive-skin']
      },
      {
        name: 'Robert Taylor',
        email: 'robert.taylor@email.com',
        phone: '+1-555-0124',
        treatmentType: 'Hair Transplant',
        preferredDate: new Date('2024-12-20'),
        preferredTime: '2:00 PM',
        message: 'Consultation for hair transplant procedure.',
        status: 'confirmed',
        priority: 'medium',
        confirmedDate: new Date('2024-12-20'),
        confirmedTime: '2:00 PM',
        tags: ['hair-transplant', 'consultation']
      },
      {
        name: 'Lisa Anderson',
        email: 'lisa.anderson@email.com',
        phone: '+1-555-0125',
        treatmentType: 'Laser Hair Removal',
        preferredDate: new Date('2024-12-18'),
        preferredTime: '3:00 PM',
        message: 'First session for laser hair removal.',
        status: 'completed',
        priority: 'low',
        actualDate: new Date('2024-12-18'),
        actualTime: '3:00 PM',
        tags: ['laser', 'hair-removal']
      }
    ];

    await Appointment.insertMany(appointments);
    console.log('📅 Seeded appointments');

    // Seed blog posts
    const blogs = [
      {
        title: 'Understanding Acne: Causes, Types, and Treatment Options',
        slug: 'understanding-acne-causes-types-treatment',
        excerpt: 'Learn about the different types of acne, their causes, and the most effective treatment options available at our clinic.',
        content: `
          <h2>What is Acne?</h2>
          <p>Acne is a common skin condition that affects millions of people worldwide. It occurs when hair follicles become clogged with oil and dead skin cells, leading to the formation of pimples, blackheads, and whiteheads.</p>
          
          <h2>Types of Acne</h2>
          <ul>
            <li><strong>Comedonal Acne:</strong> Characterized by blackheads and whiteheads</li>
            <li><strong>Inflammatory Acne:</strong> Includes papules, pustules, and nodules</li>
            <li><strong>Cystic Acne:</strong> Deep, painful cysts that can cause scarring</li>
          </ul>
          
          <h2>Treatment Options</h2>
          <p>At Bhargava Clinic, we offer a range of effective acne treatments including:</p>
          <ul>
            <li>Topical medications</li>
            <li>Oral medications</li>
            <li>Chemical peels</li>
            <li>Laser therapy</li>
            <li>Extraction procedures</li>
          </ul>
          
          <h2>Prevention Tips</h2>
          <p>Preventing acne involves maintaining a good skincare routine, avoiding harsh products, and keeping your skin clean and moisturized.</p>
        `,
        author: 'Dr. Bhargava',
        category: 'Skin Care',
        readTime: '5 min read',
        tags: ['acne', 'skin-care', 'treatment', 'dermatology'],
        status: 'published',
        publishedAt: new Date('2024-11-01'),
        metaDescription: 'Comprehensive guide to understanding acne, its causes, types, and effective treatment options.',
        seoKeywords: ['acne treatment', 'skin care', 'dermatology', 'acne causes']
      },
      {
        title: 'Hair Loss: Understanding the Causes and Modern Solutions',
        slug: 'hair-loss-causes-modern-solutions',
        excerpt: 'Explore the various causes of hair loss and discover the latest treatment options including PRP therapy and hair transplants.',
        content: `
          <h2>Understanding Hair Loss</h2>
          <p>Hair loss affects both men and women and can have various causes including genetics, hormonal changes, medical conditions, and lifestyle factors.</p>
          
          <h2>Common Causes</h2>
          <ul>
            <li>Genetic predisposition (androgenetic alopecia)</li>
            <li>Hormonal changes</li>
            <li>Medical conditions</li>
            <li>Medications</li>
            <li>Stress and lifestyle factors</li>
          </ul>
          
          <h2>Modern Treatment Solutions</h2>
          <p>Our clinic offers advanced hair loss treatments:</p>
          <ul>
            <li><strong>PRP Therapy:</strong> Platelet-rich plasma treatment</li>
            <li><strong>Hair Transplant:</strong> Follicular unit extraction</li>
            <li><strong>Scalp Treatments:</strong> Specialized scalp care</li>
            <li><strong>Medications:</strong> FDA-approved treatments</li>
          </ul>
          
          <h2>When to Seek Treatment</h2>
          <p>Early intervention is key to successful hair loss treatment. Consult with our specialists if you notice excessive hair shedding or thinning.</p>
        `,
        author: 'Dr. Bhargava',
        category: 'Hair Care',
        readTime: '6 min read',
        tags: ['hair-loss', 'hair-transplant', 'prp', 'treatment'],
        status: 'published',
        publishedAt: new Date('2024-11-15'),
        metaDescription: 'Complete guide to hair loss causes and modern treatment solutions including PRP therapy and hair transplants.',
        seoKeywords: ['hair loss treatment', 'hair transplant', 'PRP therapy', 'hair restoration']
      },
      {
        title: 'Laser Treatments: A Complete Guide to Skin and Hair Solutions',
        slug: 'laser-treatments-complete-guide',
        excerpt: 'Discover the benefits of laser treatments for skin rejuvenation, hair removal, and various dermatological conditions.',
        content: `
          <h2>What are Laser Treatments?</h2>
          <p>Laser treatments use focused light energy to target specific skin concerns and hair follicles, providing effective solutions for various cosmetic and medical conditions.</p>
          
          <h2>Types of Laser Treatments</h2>
          <ul>
            <li><strong>Laser Hair Removal:</strong> Permanent hair reduction</li>
            <li><strong>Laser Skin Resurfacing:</strong> Improved texture and tone</li>
            <li><strong>Laser Pigmentation Removal:</strong> Treatment of dark spots</li>
            <li><strong>Laser Tattoo Removal:</strong> Safe tattoo removal</li>
          </ul>
          
          <h2>Benefits of Laser Treatments</h2>
          <ul>
            <li>Precise targeting</li>
            <li>Minimal downtime</li>
            <li>Long-lasting results</li>
            <li>Safe and effective</li>
          </ul>
          
          <h2>What to Expect</h2>
          <p>Laser treatments typically require multiple sessions for optimal results. Our experienced team will create a personalized treatment plan based on your specific needs.</p>
        `,
        author: 'Dr. Bhargava',
        category: 'Laser Treatments',
        readTime: '4 min read',
        tags: ['laser', 'hair-removal', 'skin-resurfacing', 'treatment'],
        status: 'published',
        publishedAt: new Date('2024-12-01'),
        metaDescription: 'Complete guide to laser treatments for skin and hair concerns including benefits, types, and what to expect.',
        seoKeywords: ['laser treatment', 'hair removal', 'skin resurfacing', 'laser therapy']
      }
    ];

    await Blog.insertMany(blogs);
    console.log('📝 Seeded blog posts');

    // Seed subscribers
    const subscribers = [
      {
        email: 'subscriber1@email.com',
        source: 'footer'
      },
      {
        email: 'subscriber2@email.com',
        source: 'website'
      },
      {
        email: 'subscriber3@email.com',
        source: 'popup'
      }
    ];

    await Subscriber.insertMany(subscribers);
    console.log('📧 Seeded subscribers');

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Seeded data:`);
    console.log(`   - ${contacts.length} contacts`);
    console.log(`   - ${appointments.length} appointments`);
    console.log(`   - ${blogs.length} blog posts`);
    console.log(`   - ${subscribers.length} subscribers`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the seeding function
seedDatabase();
