const { createClient } = require('@sanity/client');
const path = require('path');
const fs = require('fs');

const client = createClient({
  projectId: '2gdjnoi2',
  dataset: 'production',
  apiVersion: '2026-02-01',
  token: 'sk3Siocd2x3A3cJvRxFVtSCR6YoQwHLPqnoqpN1xeikBeEMjg3jntHkEFN1u4OxzFKnGH5sBeUpZ2DeQZlhM9SzXUUnW4YekS9AyaG6LYC4xnwV0D6lh21Gy7kllGRWzcfWtdzgicbaFSsjslbTKmFDdg7wGwssFSvebuA4cGs4ilrkwLEVH',
  useCdn: false,
});

async function migrateSiteSettings() {
  console.log('==> Migrating siteSettings...');
  const doc = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    siteName: 'ReelScale',
    siteUrl: 'https://reelscale.in',
    tagline: 'Short-Form Video Production & Instagram Reels Agency in Hyderabad',
    contactEmail: 'contact@reelscale.in',
    contactPhone: '+91 99662 39433',
    whatsappNumber: '919966239433',
    officeAddress: 'Hyderabad, Telangana, India',
    headerNav: [
      { _key: 'nav-1', label: 'Work', href: '/works', isExternal: false },
      { _key: 'nav-2', label: 'Services', href: '/services/restaurant-reels', isExternal: false },
      { _key: 'nav-3', label: 'Pricing', href: '/pricing', isExternal: false },
      { _key: 'nav-4', label: 'Growth', href: '/growth', isExternal: false },
      { _key: 'nav-5', label: 'About', href: '/about', isExternal: false },
      { _key: 'nav-6', label: 'Blog', href: '/blog', isExternal: false },
    ],
    footerNav: [
      { _key: 'fnav-1', label: 'Home', href: '/', isExternal: false },
      { _key: 'fnav-2', label: 'Work', href: '/works', isExternal: false },
      { _key: 'fnav-3', label: 'Pricing', href: '/pricing', isExternal: false },
      { _key: 'fnav-4', label: 'Growth', href: '/growth', isExternal: false },
      { _key: 'fnav-5', label: 'About', href: '/about', isExternal: false },
      { _key: 'fnav-6', label: 'Blog', href: '/blog', isExternal: false },
    ],
    socialLinks: [
      { _key: 'soc-1', platform: 'Instagram', url: 'https://instagram.com/reelscale' },
      { _key: 'soc-2', platform: 'WhatsApp', url: 'https://wa.me/919966239433' },
    ],
    footerCopyright: '© 2026 ReelScale. All rights reserved.',
  };
  await client.createOrReplace(doc);
  console.log('✓ siteSettings migrated successfully.');
}

async function migratePricingPlans() {
  console.log('==> Migrating pricingPlans...');
  const plans = [
    {
      _id: 'plan-plus',
      _type: 'pricingPlan',
      title: 'Plus',
      slug: { _type: 'slug', current: 'plus' },
      category: 'reel-production',
      price: '14,499',
      numericPrice: 14499,
      currency: '₹',
      cadence: 'per month',
      tier: 'standard',
      featured: false,
      features: [
        '6 Reels Delivered / Month',
        'Professional Reel Editing',
        'Viral Style Transitions',
        'Caption Optimization',
        'Brand Consistency Styling',
        'Instant Delivery',
        '1 Revision Per Reel',
      ],
      ctaText: 'Start Your Reel',
      ctaLink: 'https://wa.me/919966239433?text=Hello%20ReelScale%2C%20I%27d%20like%20to%20schedule%20a%20content%20shoot%20for%20Plus%20plan.',
      order: 1,
    },
    {
      _id: 'plan-pro',
      _type: 'pricingPlan',
      title: 'Pro',
      slug: { _type: 'slug', current: 'pro' },
      category: 'reel-production',
      price: '19,999',
      numericPrice: 19999,
      currency: '₹',
      cadence: 'per month',
      tier: 'featured',
      featured: true,
      features: [
        '8 Reels Delivered / Month',
        'Professional + Cinematic Editing',
        'Advanced Visual Transitions',
        'Engagement-Focused Hooks',
        'Caption + CTA Optimization',
        '1 Monthly Strategy Call',
        '1 Hour Priority Delivery',
        'Unlimited Revisions',
      ],
      ctaText: 'Start your Reel',
      ctaLink: 'https://wa.me/919966239433?text=Hello%20ReelScale%2C%20I%27d%20like%20to%20schedule%20a%20content%20shoot%20for%20Pro%20plan.',
      order: 2,
    },
    {
      _id: 'plan-luxe',
      _type: 'pricingPlan',
      title: 'Luxe',
      slug: { _type: 'slug', current: 'luxe' },
      category: 'reel-production',
      price: '27,999',
      numericPrice: 27999,
      currency: '₹',
      cadence: 'per month',
      tier: 'luxe',
      featured: false,
      features: [
        '12 Reels Delivered / Month',
        'Premium Cinematic Editing',
        'Advanced Motion Effects',
        'Viral Scripting Support',
        'High-Converting CTA Structuring',
        'Dedicated Content Strategist',
        '2 Monthly Strategy Calls',
        '2 Hour Priority Delivery',
        'Unlimited Revisions',
      ],
      ctaText: 'Start Your Reel',
      ctaLink: 'https://wa.me/919966239433?text=Hello%20ReelScale%2C%20I%27d%20like%20to%20schedule%20a%20content%20shoot%20for%20Luxe%20plan.',
      order: 3,
    },
    {
      _id: 'plan-growth-starter',
      _type: 'pricingPlan',
      title: 'Growth Starter',
      slug: { _type: 'slug', current: 'growth-starter' },
      category: 'growth',
      price: '14,999',
      numericPrice: 14999,
      currency: '₹',
      cadence: 'per month',
      tier: 'standard',
      featured: false,
      features: [
        '8 Optimized Reels Management',
        'Complete Page Optimization',
        'Strategic Bio & Story Highlights',
        'Weekly Performance Reporting',
        'Trend Research & Audio Tracking',
      ],
      ctaText: 'Start Growth',
      ctaLink: 'https://wa.me/919966239433?text=Hello%20ReelScale%2C%20I%27d%20like%20to%20get%20started%20with%20Growth%20Starter.',
      order: 4,
    },
    {
      _id: 'plan-growth-scale',
      _type: 'pricingPlan',
      title: 'Growth Scale',
      slug: { _type: 'slug', current: 'growth-scale' },
      category: 'growth',
      price: '24,999',
      numericPrice: 24999,
      currency: '₹',
      cadence: 'per month',
      tier: 'featured',
      featured: true,
      features: [
        '16 Optimized Reels Management',
        'Active Community Management',
        'Daily Story Sequences',
        'Hashtag & Keyword SEO',
        'Monthly Strategy Blueprint',
        'Priority Creative Support',
      ],
      ctaText: 'Scale Your Brand',
      ctaLink: 'https://wa.me/919966239433?text=Hello%20ReelScale%2C%20I%27d%20like%20to%20scale%20with%20Growth%20Scale.',
      order: 5,
    },
    {
      _id: 'plan-growth-dominance',
      _type: 'pricingPlan',
      title: 'Growth Dominance',
      slug: { _type: 'slug', current: 'growth-dominance' },
      category: 'growth',
      price: '34,999',
      numericPrice: 34999,
      currency: '₹',
      cadence: 'per month',
      tier: 'luxe',
      featured: false,
      features: [
        '24 Optimized Reels Management',
        'Full Organic Social Takeover',
        'Dedicated Account Manager',
        'Daily Story Content & Polls',
        'Influencer Collaboration Curation',
        'Bi-weekly Strategic Review Calls',
      ],
      ctaText: 'Dominate Social',
      ctaLink: 'https://wa.me/919966239433?text=Hello%20ReelScale%2C%20I%27m%20ready%20for%20Growth%20Dominance.',
      order: 6,
    },
  ];

  for (const p of plans) {
    await client.createOrReplace(p);
  }
  console.log(`✓ ${plans.length} pricing plans migrated successfully.`);
}

async function migrateTestimonials() {
  console.log('==> Migrating testimonials...');
  const testimonials = [
    {
      _id: 'testi-jak',
      _type: 'testimonial',
      name: 'Jak',
      role: 'CEO, Jak Interiors',
      company: 'Jak Interiors',
      quote:
        "Working with ReelScale has completely changed how we present our villa projects online. Their team captured every detail beautifully and delivered premium-quality reels that truly reflect our craftsmanship. We've received significantly more inquiries and stronger engagement since partnering with them.",
      stars: 5,
      result: '4.2x',
      resultLabel: 'Engagement Lift',
      avatarInitials: 'JI',
      order: 1,
    },
    {
      _id: 'testi-parthu',
      _type: 'testimonial',
      name: 'Parthu',
      role: 'CEO, Parthu Interiors',
      company: 'Parthu Interiors',
      quote:
        'We wanted our 3BHK interior projects to stand out, and ReelScale exceeded our expectations. The storytelling, camera work, and editing are on another level. Every reel feels premium, and our clients constantly mention the quality of our social media presence.',
      stars: 5,
      result: '1.2M',
      resultLabel: 'Organic Reach',
      avatarInitials: 'PI',
      order: 2,
    },
    {
      _id: 'testi-avinash',
      _type: 'testimonial',
      name: 'Avinash',
      role: 'Founder, Avinash Hair & Beauty Lounge',
      company: 'Avinash Hair & Beauty Lounge',
      quote:
        "ReelScale perfectly captured the experience of our salon. The videos looked cinematic, the turnaround was fast, and the content helped us reach many new customers organically. They're now our go-to team for content creation.",
      stars: 5,
      result: '2x',
      resultLabel: 'Leads in 24hrs',
      avatarInitials: 'AS',
      order: 3,
    },
  ];

  for (const t of testimonials) {
    await client.createOrReplace(t);
  }
  console.log(`✓ ${testimonials.length} testimonials migrated successfully.`);
}

async function migratePageSeo() {
  console.log('==> Migrating pageSeo...');
  const seoList = [
    {
      _id: 'seo-home',
      _type: 'pageSeo',
      pageId: 'home',
      title: 'Home Page',
      metaTitle: 'ReelScale — Premium Reel Production & Video Editing Agency in Hyderabad',
      metaDescription:
        'ReelScale is Hyderabad’s premier reel shoot and video editing agency. We film, script, and edit viral, cinematic Instagram Reels for cafes, salons, gyms, and brands.',
      canonicalUrl: 'https://reelscale.in',
    },
    {
      _id: 'seo-about',
      _type: 'pageSeo',
      pageId: 'about',
      title: 'About Us',
      metaTitle: 'About Us | ReelScale — Short-Form Video Production Agency in Hyderabad',
      metaDescription:
        'Discover the team behind ReelScale, a leading reel shoot and video editing agency in Hyderabad. We write, film, and edit cinematic Instagram Reels and commercial videos.',
      canonicalUrl: 'https://reelscale.in/about',
    },
    {
      _id: 'seo-pricing',
      _type: 'pageSeo',
      pageId: 'pricing',
      title: 'Pricing Page',
      metaTitle: 'Pricing Plans | ReelScale — Simple & Scalable Video Production Cost',
      metaDescription:
        "Explore transparent pricing packages for professional reels shoots and video editing services in Hyderabad. Scale your brand's social media presence with no hidden costs.",
      canonicalUrl: 'https://reelscale.in/pricing',
    },
    {
      _id: 'seo-works',
      _type: 'pageSeo',
      pageId: 'works',
      title: 'Works / Portfolio',
      metaTitle: 'Our Portfolio & Reels Case Studies | ReelScale Hyderabad',
      metaDescription:
        'Watch premium cinematic Instagram Reels, brand videos, and commercial campaigns created by ReelScale in Hyderabad. View our high-retention video production portfolio.',
      canonicalUrl: 'https://reelscale.in/works',
    },
    {
      _id: 'seo-growth',
      _type: 'pageSeo',
      pageId: 'growth',
      title: 'Growth Management',
      metaTitle: 'Instagram Reels Growth & Page Management Agency in Hyderabad | ReelScale',
      metaDescription:
        'Complete end-to-end Instagram page management and reels strategy in Hyderabad. From content calendar mapping to trend research, captions, and profile optimization.',
      canonicalUrl: 'https://reelscale.in/growth',
    },
    {
      _id: 'seo-blog',
      _type: 'pageSeo',
      pageId: 'blog',
      title: 'Blog Index',
      metaTitle: 'Reels Marketing, Video Production & Social Growth Blog | ReelScale Hyderabad',
      metaDescription:
        'Actionable strategies, production breakdowns, and algorithm updates for Instagram Reels, TikTok, and YouTube Shorts from Hyderabad’s leading video production team.',
      canonicalUrl: 'https://reelscale.in/blog',
    },
    {
      _id: 'seo-track',
      _type: 'pageSeo',
      pageId: 'track',
      title: 'Client Delivery Tracker',
      metaTitle: 'Client Project & Reels Delivery Tracker | ReelScale',
      metaDescription:
        'Secure client delivery portal to review your monthly reels, production schedules, approval stages, and high-resolution Google Drive deliverables.',
      canonicalUrl: 'https://reelscale.in/track',
    },
  ];

  for (const s of seoList) {
    await client.createOrReplace(s);
  }
  console.log(`✓ ${seoList.length} pageSeo records migrated successfully.`);
}

async function migrateLocationPages() {
  console.log('==> Migrating locationPages...');
  const locations = [
    {
      slug: 'cafe-reels-hyderabad',
      title: 'Cafe Reels & Restaurant Video Production in Hyderabad | ReelScale',
      location: 'Hyderabad',
      category: 'Cafe',
      headline: 'Cafe Reels & Restaurant Video Production in Hyderabad',
      subheadline: 'Drive Footfall & Weekend Walk-ins with Irresistible Coffee & Food Content',
      introText:
        'Instagram is Hyderabad’s dining guide. Foodies discover their next favorite brunch cafe, specialty roastery, or rooftop dining space entirely through high-retention Reels. We capture the steam, the pour, the latte art, and the ambiance in cinematic detail, turning casual viewers into loyal regulars across Banjara Hills, Jubilee Hills, and Hitech City.',
      benefits: [
        { _key: 'b1', title: 'Cozy Visual Grading', desc: 'Warm, cozy color profiles that capture the unique atmosphere and comfort of your cafe.' },
        { _key: 'b2', title: 'Coffee ASMR audio', desc: 'Crisp, isolated audio recording of coffee grinding, espresso dripping, and milk steaming.' },
        { _key: 'b3', title: 'Weekend Vibe Highlights', desc: 'Positioning your space as the ideal workspace, date venue, or friendly meetup spot.' },
      ],
      process: [
        { _key: 'p1', step: '01', title: 'Vibe Curation', desc: 'Identifying your signature drinks, popular desserts, and photogenic corners.' },
        { _key: 'p2', step: '02', title: 'Latte & Plating Shoot', desc: 'Recording macro details of coffee preparation, milk pours, and dessert toppings.' },
        { _key: 'p3', step: '03', title: 'Lo-Fi Chill Edits', desc: 'Editing with relaxing lo-fi background beats, smooth speed-ramps, and clean text.' },
        { _key: 'p4', step: '04', title: 'Weekend Promo Launch', desc: 'Releasing content before Friday to maximize weekend visits from local foodies.' },
      ],
      deliverables: [
        'Espresso Pour & Latte Art Clips',
        'Cafe Aesthetic Walkthroughs',
        'Signature Drink Promos',
        'Crisp Coffee Grinding ASMR Audio',
        'Local Geo-Targeted Hashtags',
      ],
      pricingPlan: 'Cafe Vibe',
      pricingPrice: '₹19,999',
      pricingFeatures: [
        '12 Cafe Reels / Month',
        'On-site Beverage Direction',
        'ASMR Microphones Included',
        'Cozy Warm Color Grading',
        'Signature Menu Highlights',
        'Fast 48-Hour Turnaround',
      ],
      faqs: [
        { _key: 'f1', question: 'Do you shoot during operating hours or before opening?', answer: 'We can accommodate either! Shooting during operating hours captures authentic customer energy, while shooting before opening allows for dedicated lighting setups and precision product styling.' },
        { _key: 'f2', question: 'How quickly will the reels be ready to post?', answer: 'Our standard turnaround time is 48 to 72 hours from shoot completion. For weekend promos, we prioritize delivery by Thursday evening so you can capture weekend walk-in traffic.' },
      ],
      seo: {
        metaTitle: 'Cafe Reels & Restaurant Video Production in Hyderabad | ReelScale',
        metaDescription: 'Drive restaurant walk-ins with cinematic cafe reels in Hyderabad. Professional food shoots, cafe promos, and mouthwatering food reels production in Banjara Hills, Jubilee Hills, and Hitech City.',
        canonicalUrl: 'https://reelscale.in/cafe-reels-hyderabad',
      },
    },
    {
      slug: 'corporate-reels-hyderabad',
      title: 'Corporate Reels & Brand Video Production in Hyderabad | ReelScale',
      location: 'Hyderabad',
      category: 'Corporate',
      headline: 'Corporate Video & Commercial Reel Production in Hyderabad',
      subheadline: 'Showcase Culture, Attract Top Talent, and Close Enterprise B2B Deals',
      introText:
        'Modern enterprise brands in Hitech City and Gachibowli no longer rely on dull 5-minute boardroom videos. Today’s decision-makers consume short-form video on LinkedIn and Instagram. ReelScale creates cinema-grade executive interviews, company culture highlights, and B2B client case studies designed to build dominant authority and drive enterprise trust.',
      benefits: [
        { _key: 'b1', title: 'Cinema Dynamic Range', desc: 'Shot on full-frame cinema bodies with controlled studio lighting and pristine corporate color grading.' },
        { _key: 'b2', title: 'Broadcast-Grade Sound', desc: 'Dual-redundant wireless lavalier microphones ensuring zero room echo and crystal-clear executive voices.' },
        { _key: 'b3', title: 'B2B Authority Positioning', desc: 'Short, impactful talking-head reels and product walkthroughs optimized for LinkedIn and Instagram.' },
      ],
      process: [
        { _key: 'p1', step: '01', title: 'Messaging Alignment', desc: 'Aligning with your marketing leadership on core value propositions, target verticals, and compliance standards.' },
        { _key: 'p2', step: '02', title: 'Office & Studio Shoot', desc: 'Minimal-disruption filming at your Hyderabad facility with professional lighting, teleprompters, and multi-cam setups.' },
        { _key: 'p3', step: '03', title: 'Executive Post-Production', desc: 'Polished editing with branded motion graphics, subtitle styling, licensed commercial soundtracks, and color mastering.' },
        { _key: 'p4', step: '04', title: 'Multi-Platform Master Delivery', desc: 'Delivering vertical 9:16 and horizontal 16:9 formats ready for LinkedIn, YouTube, website hero banners, and investor decks.' },
      ],
      deliverables: [
        'Executive Thought Leadership Clips',
        'Office Culture & Recruitment Reels',
        'Customer Case Study Breakdowns',
        'Branded Lower Thirds & Motion Typography',
        'Horizontal 16:9 & Vertical 9:16 Exports',
      ],
      pricingPlan: 'Corporate Scale',
      pricingPrice: '₹34,999',
      pricingFeatures: [
        'Multi-Camera Cinema Setup',
        'Teleprompter Support On-Site',
        'Broadcast-Grade Wireless Audio',
        'Custom Corporate Motion Graphics',
        'Executive Color Grading & Mastering',
        'Priority 48-Hour Rush Delivery',
      ],
      faqs: [
        { _key: 'f1', question: 'Will the filming disrupt our active office operations?', answer: 'Not at all. We scout your location in advance, work within designated conference rooms or studio spaces, and use compact high-output LED lighting to keep disruptions completely negligible.' },
        { _key: 'f2', question: 'Do you provide teleprompter support for executives?', answer: 'Yes! We bring professional iPad-based through-the-lens teleprompters so founders and department heads can deliver scripts confidently and naturally on camera.' },
      ],
      seo: {
        metaTitle: 'Corporate Reels & Brand Video Production in Hyderabad | ReelScale',
        metaDescription: 'Cinema-grade corporate video production and LinkedIn reels in Hyderabad. Executive interviews, company culture shoots, and B2B commercial campaigns across Hitech City, Madhapur, and Gachibowli.',
        canonicalUrl: 'https://reelscale.in/corporate-reels-hyderabad',
      },
    },
    {
      slug: 'gym-reel-production-hyderabad',
      title: 'Gym & Fitness Reel Production in Hyderabad | ReelScale',
      location: 'Hyderabad',
      category: 'Gym',
      headline: 'Gym & Fitness Reel Production in Hyderabad',
      subheadline: 'Convert Scrollers into Monthly Gym Members with High-Energy Workout Reels',
      introText:
        'Fitness is built on energy and motivation. We produce high-intensity, cinematic workout reels in Hyderabad that highlight your equipment, trainer expertise, and client transformations, turning casual viewers into committed annual gym members.',
      benefits: [
        { _key: 'b1', title: 'High-Impact Motion Pacing', desc: 'Synchronized speed ramps matching beat drops to create adrenaline-inducing workout clips.' },
        { _key: 'b2', title: 'Dramatic Mood Lighting', desc: 'Accent rim lighting and contrast grading that accentuates muscle definition and equipment quality.' },
        { _key: 'b3', title: 'Member Acquisition CTAs', desc: 'Proven call-to-actions that drive trial session bookings and WhatsApp inquiries.' },
      ],
      process: [
        { _key: 'p1', step: '01', title: 'Movement Choreography', desc: 'Selecting power lifts, functional movements, and trainer demonstrations for maximum visual punch.' },
        { _key: 'p2', step: '02', title: 'High-Speed Filming', desc: 'Shooting at 120fps for buttery smooth slow-motion rep peaks and explosive concentric speed.' },
        { _key: 'p3', step: '03', title: 'Bass-Boosted Sound Design', desc: 'Layering deep sub-bass impacts, barbell clanks, and motivational voiceover hooks.' },
        { _key: 'p4', step: '04', title: 'Direct Membership Push', desc: 'Publishing optimized reels with local Hyderabad geo-tags to capture gym seekers nearby.' },
      ],
      deliverables: [
        '120fps Slow-Motion Workout Cuts',
        'Trainer Transformation Showcases',
        'Gym Facility Aesthetic Tours',
        'Bass-Heavy Sound Engineered Audio',
        'Local Hyderabad Fitness Hashtags',
      ],
      pricingPlan: 'Fitness Pro',
      pricingPrice: '₹19,999',
      pricingFeatures: [
        '12 Fitness Reels / Month',
        'Gym Lighting Equipment Setup',
        '120fps Slow-Mo Action Capture',
        'Dynamic Beat-Matched Editing',
        'Lead Generation CTAs',
        'Unlimited Monthly Revisions',
      ],
      faqs: [
        { _key: 'f1', question: 'Can you shoot during regular gym hours?', answer: 'Yes! We capture active members and trainers in action. We can also schedule early morning or late evening sessions for dedicated cinematic lighting setups without crowds.' },
      ],
      seo: {
        metaTitle: 'Gym & Fitness Reel Production in Hyderabad | ReelScale',
        metaDescription: 'High-energy fitness reel production in Hyderabad. Transform your gym social media with cinematic workout shoots, trainer profiles, and gym tour videos across Madhapur and Jubilee Hills.',
        canonicalUrl: 'https://reelscale.in/gym-reel-production-hyderabad',
      },
    },
    {
      slug: 'instagram-reels-hyderabad',
      title: 'Instagram Reels Video Production Services in Hyderabad | ReelScale',
      location: 'Hyderabad',
      category: 'Instagram',
      headline: 'Instagram Reels Video Production in Hyderabad',
      subheadline: 'Engineered for Viral Reach, Retention, and Sustainable Social Growth',
      introText:
        'In 2026, the Instagram algorithm favors one metric above all: average percentage viewed. At ReelScale, every reel is scripted, filmed, and edited with ruthless retention engineering: sub-second hooks, dynamic sound effects, cinema-grade color grading, and compelling storytelling that stops scrollers in their tracks.',
      benefits: [
        { _key: 'b1', title: 'Sub-Second Visual Hooks', desc: 'Opening frames specifically designed to prevent scroll-past and capture instant curiosity.' },
        { _key: 'b2', title: 'Topical Authority Building', desc: 'Strategic content pillars that position your brand as the definitive leader in your industry.' },
        { _key: 'b3', title: 'Algorithm Retention Design', desc: 'Pacing, cut timing, and kinetic text overlays that maximize completion rate and shares.' },
      ],
      process: [
        { _key: 'p1', step: '01', title: 'Audience & Trend Audit', desc: 'Analyzing what your Hyderabad target demographic is actively watching, saving, and sharing.' },
        { _key: 'p2', step: '02', title: 'Scripting & Hook Creation', desc: 'Writing punchy, conversational scripts with psychological curiosity gaps and clear value delivery.' },
        { _key: 'p3', step: '03', title: 'Cinematic On-Location Shoot', desc: 'Filming on professional Sony FX3 cinema cameras with dedicated wireless microphones and key lights.' },
        { _key: 'p4', step: '04', title: 'Viral Post-Production', desc: 'Speed-ramping, kinetic captions, sound design, sound track licensing, and final delivery.' },
      ],
      deliverables: [
        'High-Retention Viral Video Reels',
        'Kinetic Animated Captions',
        'Curated Trending Audio Tracks',
        'Thumbnail & Cover Designs',
        'Full HD / 4K Master Exports',
      ],
      pricingPlan: 'Reel Growth',
      pricingPrice: '₹19,999',
      pricingFeatures: [
        '8 to 12 Cinematic Reels / Month',
        'End-to-End Scripting & Ideation',
        'On-Location Cinema Camera Shoot',
        'Kinetic Typography Subtitles',
        'Hashtag & Caption Optimization',
        'Priority Turnaround',
      ],
      faqs: [
        { _key: 'f1', question: 'Why should I hire ReelScale instead of shooting on my phone?', answer: 'Phone video lacks dynamic range, isolated clean audio, and cinema lighting. In crowded feeds, cinema-grade color grading, professional microphones, and polished storytelling immediately stand out as authoritative, boosting trust and conversion.' },
      ],
      seo: {
        metaTitle: 'Instagram Reels Video Production Services in Hyderabad | ReelScale',
        metaDescription: 'Professional Instagram reels shoot and video editing agency in Hyderabad. High-retention cinematic short-form video production for brands, creators, and local businesses.',
        canonicalUrl: 'https://reelscale.in/instagram-reels-hyderabad',
      },
    },
    {
      slug: 'interior-reels-hyderabad',
      title: 'Interior Design Reel Production in Hyderabad | ReelScale',
      location: 'Hyderabad',
      category: 'Interior',
      headline: 'Interior Design Reel Production in Hyderabad',
      subheadline: 'Showcase Luxurious Villas, 3BHKs, and Commercial Spaces to High-Ticket Clients',
      introText:
        'Interior design is visual art. High-net-worth clients in Jubilee Hills, Kokapet, and Financial District want to see the luxury, materials, and spatial flow before hiring a design firm. ReelScale creates stunning, architectural-grade interior design walkthrough reels in Hyderabad that attract high-budget villa and apartment projects.',
      benefits: [
        { _key: 'b1', title: 'Smooth Gimbal Movements', desc: 'Silky smooth three-axis gimbal moves that reveal spatial dimensions, finishes, and layout harmony.' },
        { _key: 'b2', title: 'Architectural Lighting Capture', desc: 'Balancing indoor ambient warmth with outdoor window exposure for crisp, balanced interior looks.' },
        { _key: 'b3', title: 'High-Ticket Client Inquiries', desc: 'Reels that position your interior firm as a luxury builder, attracting clients with ₹15L–₹50L+ budgets.' },
      ],
      process: [
        { _key: 'p1', step: '01', title: 'Site Walkthrough & Scouting', desc: 'Identifying hero lighting moments, texture contrasts, custom woodwork, and lighting designs.' },
        { _key: 'p2', step: '02', title: 'Cinematic Wide & Macro Shoot', desc: 'Combining sweeping wide-angle transitions with macro texture shots of brass, marble, and upholstery.' },
        { _key: 'p3', step: '03', title: 'Luxury Color Grading', desc: 'Applying neutral, upscale color palettes that preserve true material colors and room elegance.' },
        { _key: 'p4', step: '04', title: 'Targeted Portfolio Distribution', desc: 'Publishing with geo-targeted keywords targeting homeowners in Gachibowli, Kokapet, and Jubilee Hills.' },
      ],
      deliverables: [
        'Room-by-Room Walkthrough Sequences',
        'Macro Material & Texture Close-Ups',
        'Designer Voiceover & Vision Story',
        'Architectural Color Grading',
        'High-Net-Worth Geo Tags',
      ],
      pricingPlan: 'Luxury Interior',
      pricingPrice: '₹24,999',
      pricingFeatures: [
        'Dedicated Interior Shoot Day',
        'Cinema Gimbal Stabilization',
        'Wide & Macro Dual Lens Coverage',
        'Designer Interview / Voiceover',
        'Luxury Color Grading',
        'Expedited 3-Day Turnaround',
      ],
      faqs: [
        { _key: 'f1', question: 'How long does an interior site shoot take?', answer: 'A comprehensive interior shoot typically takes 3 to 4 hours per apartment or villa. This gives us ample time to set up soft interior lighting, capture natural daylight variations, and record designer commentary.' },
      ],
      seo: {
        metaTitle: 'Interior Design Reel Production in Hyderabad | ReelScale',
        metaDescription: 'Luxury interior design video production and architectural walkthrough reels in Hyderabad. Attract high-ticket villa and 3BHK homeowners across Jubilee Hills, Kokapet, and Gachibowli.',
        canonicalUrl: 'https://reelscale.in/interior-reels-hyderabad',
      },
    },
    {
      slug: 'real-estate-reels-hyderabad',
      title: 'Real Estate Reel Production Services in Hyderabad | ReelScale',
      location: 'Hyderabad',
      category: 'Real Estate',
      headline: 'Real Estate Reel Production in Hyderabad',
      subheadline: 'Sell Luxury Villas, Gated Communities, and Plots Faster with Cinematic Video',
      introText:
        'Static photos no longer sell premium properties in Hyderabad. Real estate buyers in Kokapet, Tellapur, and Narsingi want immersive, cinematic property walkthroughs that showcase lifestyle, amenities, and floor plans. ReelScale produces high-converting property reels that generate qualified buyer inquiries for developers and top realtors.',
      benefits: [
        { _key: 'b1', title: 'Lifestyle & Amenity Focus', desc: 'Showcasing clubhouses, swimming pools, fitness centers, and green expanses that sell the luxury lifestyle.' },
        { _key: 'b2', title: 'Spacious Wide-Angle Lenses', desc: 'Full-frame ultra-wide optics that accurately present spatial volume without unnatural fisheye distortion.' },
        { _key: 'b3', title: 'Investor Lead Acquisition', desc: 'Compelling property highlights and location connectivity breakdowns that prompt direct WhatsApp inquiries.' },
      ],
      process: [
        { _key: 'p1', step: '01', title: 'Property Highlights Mapping', desc: 'Determining the unique selling points: location connectivity, clubhouse grandeur, and bespoke architectural finishes.' },
        { _key: 'p2', step: '02', title: 'Golden Hour Property Shoot', desc: 'Filming during sunset and golden hour to highlight building elevations, balcony views, and landscape lighting.' },
        { _key: 'p3', step: '03', title: 'Cinematic Property Cut', desc: 'Editing with elegant speed transitions, floor plan callouts, price cues, and luxury lifestyle audio.' },
        { _key: 'p4', step: '04', title: 'Buyer Acquisition Launch', desc: 'Optimizing titles and hashtags for Hyderabad real estate investors and NRI property buyers.' },
      ],
      deliverables: [
        'Villa & Penthouse Walkthrough Reels',
        'Amenity & Clubhouse Showcases',
        'Agent Property Tour Presentation',
        'Location Proximity Motion Graphic Overlays',
        'Investor WhatsApp CTAs',
      ],
      pricingPlan: 'Realty Prime',
      pricingPrice: '₹29,999',
      pricingFeatures: [
        'Full Day On-Location Property Shoot',
        'Ultra-Wide Full-Frame Optics',
        'Agent Microphone Audio Kit',
        'Sunset / Golden Hour Coverage',
        'Branded Lower Thirds & Price Tags',
        'Fast 48-Hour Final Export',
      ],
      faqs: [
        { _key: 'f1', question: 'Do you shoot with the real estate agent on camera?', answer: 'Yes! We love shooting agent-led walkthroughs. We guide the agent with talking points, provide wireless microphones, and direct their movements for maximum charisma and professional credibility.' },
      ],
      seo: {
        metaTitle: 'Real Estate Reel Production Services in Hyderabad | ReelScale',
        metaDescription: 'High-converting real estate video production in Hyderabad. Cinematic property walkthroughs, luxury villa tours, and gated community promo videos across Kokapet, Tellapur, and Gachibowli.',
        canonicalUrl: 'https://reelscale.in/real-estate-reels-hyderabad',
      },
    },
    {
      slug: 'reel-production-company-hyderabad',
      title: 'Leading Reel Production Company in Hyderabad | ReelScale',
      location: 'Hyderabad',
      category: 'Production',
      headline: 'The Premier Reel Production Company in Hyderabad',
      subheadline: 'End-to-End Ideation, Filming, and Viral Editing Under One Roof',
      introText:
        'ReelScale is Hyderabad’s dedicated short-form video production agency. We don’t treat Reels as an afterthought to lengthy corporate videos. Short-form is our singular obsession. From viral scripting and professional cinema shoots to retention-optimized post-production, we help ambitious brands dominate Instagram and YouTube Shorts.',
      benefits: [
        { _key: 'b1', title: 'Full Production Pipeline', desc: 'Concept, script, filming gear, directors, cinema lighting, and pro editing handled seamlessly.' },
        { _key: 'b2', title: 'Predictable Monthly Deliveries', desc: 'Reliable monthly subscription packages with guaranteed reel counts and on-time turnarounds.' },
        { _key: 'b3', title: 'Obsessed with Retention', desc: 'Every millisecond engineered for hook rate, watch time, and conversion, not vanity views.' },
      ],
      process: [
        { _key: 'p1', step: '01', title: 'Strategy & Brand Discovery', desc: 'Auditing your competitors, defining your unique perspective, and structuring a 30-day content calendar.' },
        { _key: 'p2', step: '02', title: 'Content Shoot Day', desc: 'We bring our full camera, lighting, and sound gear to your location and shoot 8–12 reels in a single focused session.' },
        { _key: 'p3', step: '03', title: 'Post-Production Wizardry', desc: 'Color grading, custom sound effects, kinetic typography, and motion graphics.' },
        { _key: 'p4', step: '04', title: 'Publishing & Iteration', desc: 'Analyzing retention curves and doubling down on winning formats month after month.' },
      ],
      deliverables: [
        'Complete Monthly Reels Package',
        'Script Library & Hook Bank',
        'Full HD / 4K Cinema Masters',
        'Branded Subtitle Presets',
        'Performance Optimization Insights',
      ],
      pricingPlan: 'All-Inclusive',
      pricingPrice: '₹19,999',
      pricingFeatures: [
        'All Cinema Gear & Crew Included',
        'Dedicated Content Strategist',
        'On-Location Shoot Included',
        'Pro Sound Design & Color Grade',
        'Unlimited Monthly Revisions',
        'Guaranteed Turnaround',
      ],
      faqs: [
        { _key: 'f1', question: 'How do monthly subscriptions work?', answer: 'We plan all content at the start of the month, film everything in one or two efficient shoot sessions, and deliver polished, ready-to-publish reels on a rolling weekly schedule.' },
      ],
      seo: {
        metaTitle: 'Leading Reel Production Company in Hyderabad | ReelScale',
        metaDescription: 'ReelScale is the premier reel production company in Hyderabad. High-retention video production, cinematic commercial filming, and viral social media editing for growing businesses.',
        canonicalUrl: 'https://reelscale.in/reel-production-company-hyderabad',
      },
    },
    {
      slug: 'reels-shoot-hyderabad',
      title: 'Professional Reels Shoot Services in Hyderabad | ReelScale',
      location: 'Hyderabad',
      category: 'Shoot',
      headline: 'Professional Reels Shoot Services in Hyderabad',
      subheadline: 'Book Dedicated Cinema Videographers and Lighting Equipment for Your Shoot',
      introText:
        'Need professional videography for your brand, event, product launch, or creator content? ReelScale provides on-demand reels shoot services in Hyderabad with cinema cameras, pro wireless microphones, and lighting kits to make every frame look high-budget and cinematic.',
      benefits: [
        { _key: 'b1', title: 'Cinema Rigging & Lenses', desc: 'Full-frame cameras with prime lenses that create gorgeous background separation and creamy bokeh.' },
        { _key: 'b2', title: 'Professional Studio Lights', desc: 'High-CRI daylight and bi-color LED panels that flatter skin tones and create commercial polish.' },
        { _key: 'b3', title: 'Creative Direction On-Set', desc: 'Our directors pose, guide, and prompt you so you never feel awkward in front of the lens.' },
      ],
      process: [
        { _key: 'p1', step: '01', title: 'Shoot Briefing', desc: 'Reviewing your moodboard, shot list, locations, and styling requirements.' },
        { _key: 'p2', step: '02', title: 'On-Location Lighting & Sound', desc: 'Setting up clean audio and balanced key lights in your space.' },
        { _key: 'p3', step: '03', title: 'Multi-Angle Filming', desc: 'Capturing dynamic wide, medium, and close-up angles for fast-paced modern editing.' },
        { _key: 'p4', step: '04', title: 'Raw Footage & Master Transfer', desc: 'Delivering color-graded master reels or high-res raw files according to your package.' },
      ],
      deliverables: [
        'Dedicated On-Site Cinema Crew',
        'Wireless Audio Kits Included',
        'Color-Graded Reel Deliverables',
        'Raw Footage Archiving Options',
        'Multi-Angle Coverage',
      ],
      pricingPlan: 'Shoot Day',
      pricingPrice: '₹14,999',
      pricingFeatures: [
        'Half-Day or Full-Day Shoot Options',
        'Cinema Camera & Prime Lenses',
        'Wireless Audio & Key Lighting Kit',
        'On-Set Creative Direction',
        'Turnkey Reel Editing Available',
        'Fast File Delivery',
      ],
      faqs: [
        { _key: 'f1', question: 'Do you bring your own lighting and microphones?', answer: 'Yes! Every shoot includes professional wireless microphones, high-output softbox lighting, and camera stabilization rigs.' },
      ],
      seo: {
        metaTitle: 'Professional Reels Shoot Services in Hyderabad | ReelScale',
        metaDescription: 'Book professional on-location reels shoots in Hyderabad. Cinema camera gear, studio lighting, wireless microphones, and creative direction across Banjara Hills, Madhapur, and Hitech City.',
        canonicalUrl: 'https://reelscale.in/reels-shoot-hyderabad',
      },
    },
    {
      slug: 'salon-reels-hyderabad',
      title: 'Salon, Spa & Beauty Reels Production in Hyderabad | ReelScale',
      location: 'Hyderabad',
      category: 'Salon',
      headline: 'Salon, Spa & Beauty Reel Production in Hyderabad',
      subheadline: 'Attract Daily Hair, Skin, and Bridal Bookings with Aesthetic Beauty Reels',
      introText:
        'Beauty and salon clients book appointments based on visual proof. They want to see the hair transformation, the skin glow, the bridal makeover, and the pristine salon atmosphere. ReelScale creates stunning salon reels in Hyderabad that turn scrollers into booked clients for hair salons, luxury spas, and aesthetic clinics.',
      benefits: [
        { _key: 'b1', title: 'Flattering Beauty Lighting', desc: 'Custom soft diffused ring and panel lighting that highlights skin clarity and hair shine without harsh glare.' },
        { _key: 'b2', title: 'Dramatic Transformation Hooks', desc: 'Split-second before-and-after reveals that create immense curiosity and massive comment engagement.' },
        { _key: 'b3', title: 'Daily Appointment Inquiries', desc: 'Direct booking CTAs linking viewers to your WhatsApp booking desk or direct salon line.' },
      ],
      process: [
        { _key: 'p1', step: '01', title: 'Service Menu Curation', desc: 'Focusing on high-margin services: balayage, keratin treatments, bridal makeovers, and nail art.' },
        { _key: 'p2', step: '02', title: 'Before & After Filming', desc: 'Capturing identical angles of client hair and makeup transformations with cinematic lighting.' },
        { _key: 'p3', step: '03', title: 'Aesthetic Trend Editing', desc: 'Syncing with viral aesthetic audio, seamless hair flip transitions, and soft color grading.' },
        { _key: 'p4', step: '04', title: 'Local Client Booking Push', desc: 'Publishing with geo-targeted keywords targeting beauty enthusiasts in Banjara Hills, Jubilee Hills, and Kondapur.' },
      ],
      deliverables: [
        'Hair Transformation Reveal Reels',
        'Salon Interior & Ambience Promos',
        'Bridal Makeover Close-Ups',
        'Aesthetic Color Grading for Skin Tones',
        'Local Hyderabad Salon Geo Tags',
      ],
      pricingPlan: 'Salon Glow',
      pricingPrice: '₹19,999',
      pricingFeatures: [
        '12 Salon Reels / Month',
        'Dedicated Soft Beauty Lighting',
        'Before & After Reveal Directing',
        'Aesthetic Color Grading for Skin/Hair',
        'Booking CTAs Included',
        'Fast 48-Hour Turnaround',
      ],
      faqs: [
        { _key: 'f1', question: 'How do you handle client consent for salon shoots?', answer: 'We recommend coordinating with regular, willing clients or team models who love being featured. We ensure filming is respectful, comfortable, and celebratory for the client.' },
      ],
      seo: {
        metaTitle: 'Salon, Spa & Beauty Reels Production in Hyderabad | ReelScale',
        metaDescription: 'Stunning salon and beauty reels production in Hyderabad. Hair transformation videos, bridal makeup shoots, and spa aesthetic promos across Banjara Hills, Jubilee Hills, and Hitech City.',
        canonicalUrl: 'https://reelscale.in/salon-reels-hyderabad',
      },
    },
  ];

  for (const loc of locations) {
    const doc = {
      _id: `location-${loc.slug}`,
      _type: 'locationPage',
      ...loc,
      slug: { _type: 'slug', current: loc.slug },
    };
    await client.createOrReplace(doc);
  }
  console.log(`✓ ${locations.length} locationPages migrated successfully.`);
}

async function migrateServices() {
  console.log('==> Migrating industry services...');
  const services = [
    {
      slug: 'restaurant-reels',
      title: 'Restaurant Reel Production',
      keyword: 'Restaurant Reel Production Hyderabad',
      headline: 'Restaurant Reel Production in Hyderabad',
      subheadline: 'Fill Tables & Go Viral with Stunning Food & Dining Content',
      introText:
        'In the culinary capital of India, taste is visual. We create high-retention, cinematic food and dining reels in Hyderabad that drive foot traffic directly to your restaurant, cafe, or dining lounge in Gachibowli, Madhapur, and Jubilee Hills.',
      benefits: [
        { _key: 'b1', title: 'Mouth-Watering Color Grading', desc: 'Professional studio lighting and grading techniques that make every dish look irresistible on screen.' },
        { _key: 'b2', title: 'Hook-Driven Food Prep Shots', desc: 'Capturing the sizzle, drizzle, and chop within the first 1.5 seconds to maximize viewer watch time.' },
        { _key: 'b3', title: 'Direct Table Bookings', desc: 'Structured CTAs that guide foodies from viral video viewing to booking a table instantly.' },
      ],
      process: [
        { _key: 'p1', step: '01', title: 'Concept & Menu Curation', desc: 'We select the most visually striking dishes and hooks that appeal to local Hyderabad food bloggers.' },
        { _key: 'p2', step: '02', title: 'Kitchen & Tabletop Filming', desc: 'Cinema camera shoots with specialized macro lenses and high-CRI food lighting.' },
        { _key: 'p3', step: '03', title: 'Dynamic Sound & Color Edit', desc: 'Crisp sizzle and crunch audio layering, speed ramps, and appetite-inducing color mastering.' },
        { _key: 'p4', step: '04', title: 'Local Reach Launch', desc: 'Delivered ready with geo-tagged captions and local food trending audio recommendations.' },
      ],
      deliverables: [
        'Full HD / 4K Vertical Master Reels',
        'Custom Kinetic Captions',
        'Appetite-Engineered Color Grade',
        'Audio Track Licensing',
        'Local Hyderabad Food Hashtag Strategy',
      ],
      pricingPlan: 'Restaurant Pack',
      pricingPrice: '₹19,999',
      pricingFeatures: [
        '10 to 12 Food Reels / Month',
        'On-Location Food Styling & Shoot',
        'Macro Lens & Cinema Lighting Kit',
        'Audio Sizzle & Prep Sound Layering',
        'Table Reservation CTAs',
        'Fast 48-Hour Turnaround',
      ],
      faqs: [
        { _key: 'f1', question: 'How many dishes can we shoot in one session?', answer: 'In a standard 3-hour shoot session, we typically cover 4 to 6 signature dishes, beverage pours, kitchen preparation highlights, and dining room ambience.' },
        { _key: 'f2', question: 'Do you provide the food stylists?', answer: 'Our videographers are trained in food camera placement, lighting, and plating angles. We work directly with your head chef to time each dish fresh out of the kitchen.' },
      ],
      locationKeywords: ['Gachibowli', 'Madhapur', 'Jubilee Hills', 'Banjara Hills', 'Hitech City'],
      seo: {
        metaTitle: 'Restaurant Reel Production Hyderabad | Cinematic Food Reels',
        metaDescription: 'Struggling to fill tables? ReelScale produces mouth-watering, high-retention restaurant food reels in Hyderabad. Madhapur, Gachibowli, Jubilee Hills.',
        canonicalUrl: 'https://reelscale.in/services/restaurant-reels',
      },
    },
    {
      slug: 'gym-reels',
      title: 'Gym & Fitness Reels',
      keyword: 'Gym Reel Production Hyderabad',
      headline: 'Gym & Fitness Reel Production in Hyderabad',
      subheadline: 'Convert Scrollers into Monthly Gym Members with High-Energy Workout Reels',
      introText:
        'Fitness is built on energy and motivation. We produce high-intensity, cinematic workout reels in Hyderabad that highlight your equipment, trainer expertise, and client transformations, turning casual viewers into committed annual gym members.',
      benefits: [
        { _key: 'b1', title: 'High-Impact Motion Pacing', desc: 'Synchronized speed ramps matching beat drops to create adrenaline-inducing workout clips.' },
        { _key: 'b2', title: 'Dramatic Mood Lighting', desc: 'Accent rim lighting and contrast grading that accentuates muscle definition and equipment quality.' },
        { _key: 'b3', title: 'Member Acquisition CTAs', desc: 'Proven call-to-actions that drive trial session bookings and WhatsApp inquiries.' },
      ],
      process: [
        { _key: 'p1', step: '01', title: 'Movement Choreography', desc: 'Selecting power lifts, functional movements, and trainer demonstrations for maximum visual punch.' },
        { _key: 'p2', step: '02', title: 'High-Speed Filming', desc: 'Shooting at 120fps for buttery smooth slow-motion rep peaks and explosive concentric speed.' },
        { _key: 'p3', step: '03', title: 'Bass-Boosted Sound Design', desc: 'Layering deep sub-bass impacts, barbell clanks, and motivational voiceover hooks.' },
        { _key: 'p4', step: '04', title: 'Direct Membership Push', desc: 'Publishing optimized reels with local Hyderabad geo-tags to capture gym seekers nearby.' },
      ],
      deliverables: [
        '120fps Slow-Motion Workout Cuts',
        'Trainer Transformation Showcases',
        'Gym Facility Aesthetic Tours',
        'Bass-Heavy Sound Engineered Audio',
        'Local Hyderabad Fitness Hashtags',
      ],
      pricingPlan: 'Fitness Pro',
      pricingPrice: '₹19,999',
      pricingFeatures: [
        '12 Fitness Reels / Month',
        'Gym Lighting Equipment Setup',
        '120fps Slow-Mo Action Capture',
        'Dynamic Beat-Matched Editing',
        'Lead Generation CTAs',
        'Unlimited Monthly Revisions',
      ],
      faqs: [
        { _key: 'f1', question: 'Can you shoot during regular gym hours?', answer: 'Yes! We capture active members and trainers in action. We can also schedule early morning or late evening sessions for dedicated cinematic lighting setups without crowds.' },
      ],
      locationKeywords: ['Madhapur', 'Jubilee Hills', 'Kondapur', 'Banjara Hills', 'Gachibowli'],
      seo: {
        metaTitle: 'Gym & Fitness Reel Production Hyderabad | Cinematic Workout Videos',
        metaDescription: 'Drive membership growth with cinema-grade workout reels in Hyderabad. High-energy gym promos, trainer profiles, and workout motivation reels across Madhapur & Jubilee Hills.',
        canonicalUrl: 'https://reelscale.in/services/gym-reels',
      },
    },
    {
      slug: 'interior-designers',
      title: 'Interior Designer Reels',
      keyword: 'Interior Design Reels Hyderabad',
      headline: 'Interior Design Reel Production in Hyderabad',
      subheadline: 'Showcase Luxurious Villas, 3BHKs, and Commercial Spaces to High-Ticket Clients',
      introText:
        'Interior design is visual art. High-net-worth clients in Jubilee Hills, Kokapet, and Financial District want to see the luxury, materials, and spatial flow before hiring a design firm. ReelScale creates stunning, architectural-grade interior design walkthrough reels in Hyderabad that attract high-budget villa and apartment projects.',
      benefits: [
        { _key: 'b1', title: 'Smooth Gimbal Movements', desc: 'Silky smooth three-axis gimbal moves that reveal spatial dimensions, finishes, and layout harmony.' },
        { _key: 'b2', title: 'Architectural Lighting Capture', desc: 'Balancing indoor ambient warmth with outdoor window exposure for crisp, balanced interior looks.' },
        { _key: 'b3', title: 'High-Ticket Client Inquiries', desc: 'Reels that position your interior firm as a luxury builder, attracting clients with ₹15L–₹50L+ budgets.' },
      ],
      process: [
        { _key: 'p1', step: '01', title: 'Site Walkthrough & Scouting', desc: 'Identifying hero lighting moments, texture contrasts, custom woodwork, and lighting designs.' },
        { _key: 'p2', step: '02', title: 'Cinematic Wide & Macro Shoot', desc: 'Combining sweeping wide-angle transitions with macro texture shots of brass, marble, and upholstery.' },
        { _key: 'p3', step: '03', title: 'Luxury Color Grading', desc: 'Applying neutral, upscale color palettes that preserve true material colors and room elegance.' },
        { _key: 'p4', step: '04', title: 'Targeted Portfolio Distribution', desc: 'Publishing with geo-targeted keywords targeting homeowners in Gachibowli, Kokapet, and Jubilee Hills.' },
      ],
      deliverables: [
        'Room-by-Room Walkthrough Sequences',
        'Macro Material & Texture Close-Ups',
        'Designer Voiceover & Vision Story',
        'Architectural Color Grading',
        'High-Net-Worth Geo Tags',
      ],
      pricingPlan: 'Luxury Interior',
      pricingPrice: '₹24,999',
      pricingFeatures: [
        'Dedicated Interior Shoot Day',
        'Cinema Gimbal Stabilization',
        'Wide & Macro Dual Lens Coverage',
        'Designer Interview / Voiceover',
        'Luxury Color Grading',
        'Expedited 3-Day Turnaround',
      ],
      faqs: [
        { _key: 'f1', question: 'How long does an interior site shoot take?', answer: 'A comprehensive interior shoot typically takes 3 to 4 hours per apartment or villa. This gives us ample time to set up soft interior lighting, capture natural daylight variations, and record designer commentary.' },
      ],
      locationKeywords: ['Jubilee Hills', 'Kokapet', 'Financial District', 'Banjara Hills', 'Gachibowli'],
      seo: {
        metaTitle: 'Interior Design Reels Hyderabad | Luxury Villa & 3BHK Video Tours',
        metaDescription: 'Attract high-ticket interior design clients with luxury video walkthrough reels in Hyderabad. Kokapet, Jubilee Hills, Gachibowli. 4K cinema quality.',
        canonicalUrl: 'https://reelscale.in/services/interior-designers',
      },
    },
  ];

  for (const s of services) {
    const doc = {
      _id: `service-${s.slug}`,
      _type: 'service',
      ...s,
      slug: { _type: 'slug', current: s.slug },
    };
    await client.createOrReplace(doc);
  }
  console.log(`✓ ${services.length} services migrated successfully.`);
}

async function main() {
  console.log('Starting migration to Sanity...');
  await migrateSiteSettings();
  await migratePricingPlans();
  await migrateTestimonials();
  await migratePageSeo();
  await migrateLocationPages();
  await migrateServices();
  console.log('All migrations completed successfully!');
}

main().catch(console.error);
