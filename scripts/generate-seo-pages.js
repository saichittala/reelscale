const fs = require('fs');
const path = require('path');

const seoPages = [
  {
    slug: 'reels-shoot-hyderabad',
    keyword: 'reels shoot Hyderabad',
    title: 'Reels Shoot in Hyderabad | Professional Instagram Reels Shoot',
    desc: 'Looking for a professional reels shoot in Hyderabad? ReelScale offers cinematic short-form video shoots, professional lighting, and scriptwriting in Madhapur, Gachibowli, and Jubilee Hills.',
    name: 'Reels Shoot Hyderabad',
    headline: 'Professional Reels Shoot in Hyderabad',
    subheadline: 'Capture Attention & Grow Your Business with Cinematic Reels',
    introText: 'Ready to stand out on social media? We organize complete, premium reels shoots in Hyderabad. From scriptwriting to high-end filming in HITEC City, Gachibowli, and Jubilee Hills, we make sure every reel is engineered to go viral.',
    benefits: [
      { title: 'Cinema-Grade Production', desc: 'Shot on 4K cameras with professional three-point lighting and isolated studio audio.' },
      { title: 'Local Landmark Placement', desc: 'Integrating recognisable Hyderabad hotspots to boost local community engagement.' },
      { title: 'Hook-Body-Payoff Scripts', desc: 'Custom written scripts by professional copywriters designed to capture attention in 1.5 seconds.' }
    ],
    process: [
      { step: '01', title: 'Script & Concept Design', desc: 'Developing high-converting hooks tailored to your target Hyderabad audience.' },
      { step: '02', title: 'On-Site Filming Shoot', desc: 'Professional 2-3 hour shoot with wireless lapel microphones and multi-angle camera setups.' },
      { step: '03', title: 'Viral Pace Video Editing', desc: 'Fast-paced cuts, sound design, color correction, and visual subtitle placement.' },
      { step: '04', title: 'SEO Optimized Launch', desc: 'Deploying with optimized local hashtags, geo-locations, and publishing schedules.' }
    ],
    deliverables: [
      '12 Edited Cinematic Reels / Month',
      'Custom Copywritten Scripts',
      'Professional Lighting & Microphones',
      'Pattern Interrupt Sound Effects',
      'Vocal Enhancement & Color Grading'
    ],
    pricingPlan: 'Reels Pro Shoot',
    pricingPrice: '₹19,999',
    pricingFeatures: [
      '12 Custom Reels / Month',
      'On-site Direction (3 Hours)',
      'Professional Lighting & Audio',
      'High-End Video Editing',
      'Unlimited Revisions',
      '1 Strategy Call / Month'
    ],
    faqs: [
      { question: 'Where do the shoots take place?', answer: 'We conduct shoots at your business location, studio, or scenic landmarks across Gachibowli, Madhapur, Jubilee Hills, and Banjara Hills.' },
      { question: 'Do you provide the scripts?', answer: 'Yes! Our copywriters write 100% of your scripts before the shoot, complete with visual hooks and calls-to-action.' },
      { question: 'How fast is the delivery?', answer: 'Our standard delivery is within 3-5 days. Priority editing options are available for same-week launches.' }
    ],
    locationKeywords: ['Madhapur', 'Gachibowli', 'Jubilee Hills', 'Banjara Hills', 'HITEC City']
  },
  {
    slug: 'reel-production-company-hyderabad',
    keyword: 'reel production company Hyderabad',
    title: 'Reel Production Company in Hyderabad | ReelScale',
    desc: 'ReelScale is the leading reel production company in Hyderabad. We deliver end-to-end cinematic corporate reels, commercial video ads, and short-form content scaling.',
    name: 'Reel Production Company',
    headline: 'Leading Reel Production Company in Hyderabad',
    subheadline: 'The End-to-End Content Agency for High-Retention Video Marketing',
    introText: 'We help ambitious brands, salons, restaurants, and real estate developers scale organically. As the premier reel production agency in Hyderabad, we coordinate strategy, crew, editing, and deployment under one premium roof.',
    benefits: [
      { title: 'Full Production Pipeline', desc: 'No outsourcing. We manage scriptwriters, videographers, directors, and professional editors internally.' },
      { title: 'Productised Delivery', desc: 'Reliable weekly deliverables, constant communication, and priority delivery options.' },
      { title: 'High-Retention Formatting', desc: 'Pacing, subtitles, sound design, and hooks optimized for Instagram and YouTube algorithms.' }
    ],
    process: [
      { step: '01', title: 'Strategy & Mapping', desc: 'Auditing your niche, competitors, and defining high-performing hooks.' },
      { step: '02', title: 'Cinematic Filming', desc: 'Directing shoots using premium camera kits, stabilizer rigs, and sound gear.' },
      { step: '03', title: 'Visual Post-Production', desc: 'Editing with professional transitions, text graphics, and background scores.' },
      { step: '04', title: 'Performance Analysis', desc: 'Tracking views, click-through rates, and optimizing the next batch of concepts.' }
    ],
    deliverables: [
      'Professional Brand Video Production',
      'Social Media Pacing & Subtitles',
      'Advanced Audio EQ & Mixing',
      'Competitor Video Analysis',
      'Publishing Strategy & Hashtag Audits'
    ],
    pricingPlan: 'Agency Scale',
    pricingPrice: '₹24,999',
    pricingFeatures: [
      '16 Professional Reels / Month',
      'Full On-site Crew & Videography',
      'Premium Storytelling Scripts',
      'Advanced Sound Effects & Motion Graphics',
      'Priority Support & Unlimited Revisions',
      '2 Monthly Strategy Calls'
    ],
    faqs: [
      { question: 'Why choose ReelScale over a freelance editor?', answer: 'We handle everything from strategy and scriptwriting to camera direction, lighting, and performance audits, saving your team 15+ hours weekly.' },
      { question: 'What video formats do you support?', answer: 'We specialize in vertical short-form (9:16) for Instagram Reels, YouTube Shorts, and TikTok, alongside horizontal corporate video assets.' }
    ],
    locationKeywords: ['Hyderabad', 'HITEC City', 'Kondapur', 'Begumpet', 'Secunderabad']
  },
  {
    slug: 'instagram-reels-hyderabad',
    keyword: 'Instagram reels Hyderabad',
    title: 'Instagram Reels Production in Hyderabad | Professional Creators',
    desc: 'Want to dominate Instagram reels in Hyderabad? ReelScale creates premium, high-retention cinematic Reels that boost reach, followers, and customer inquiries.',
    name: 'Instagram Reels Hyderabad',
    headline: 'Dominate Instagram Reels in Hyderabad',
    subheadline: 'Build Organic Brand Authority & Scale Customer Acquisition',
    introText: 'Instagram is the absolute storefront for modern businesses. We design and shoot high-converting, premium Instagram reels in Hyderabad that build rapid trust, satisfy the algorithm, and bring buyers straight to your DM inbox.',
    benefits: [
      { title: 'Instagram Safe Zone Alignment', desc: 'Making sure captions, text, and logos are perfectly positioned within Instagram safe zones.' },
      { title: 'Viral Transition Pacing', desc: 'Utilising modern pacing, transitions, and audio cues to keep viewers hooked till the last second.' },
      { title: 'Follower-to-Client Funnels', desc: 'Structured calls-to-action to convert casual organic scrollers into active leads and followers.' }
    ],
    process: [
      { step: '01', title: 'Trend Research', desc: 'Identifying trending audio and content formats relevant to your local niche.' },
      { step: '02', title: 'On-site Recording', desc: 'Capturing high-resolution visual assets at your venue or location in Hyderabad.' },
      { step: '03', title: 'Premium Mobile Editing', desc: 'Adding custom captions, animations, sound design, and color profiles.' },
      { step: '04', title: 'Interactive Deployment', desc: 'Publishing reels with strategic pinned comments, bio-links, and local geo-locations.' }
    ],
    deliverables: [
      'Cinematic Vertical Video Assets',
      'Optimized Subtitle Design & Styling',
      'Instagram Algorithm Auditing',
      'Direct Lead Conversion CTAs',
      'Hashtag & Geo-Tag Setup'
    ],
    pricingPlan: 'Insta Growth',
    pricingPrice: '₹19,999',
    pricingFeatures: [
      '12 Reels / Month',
      'On-location Direction & Filming',
      'Viral Caption Optimization',
      'Interactive Story Ideas',
      '1 Onboarding Strategy Call',
      'Unlimited Revisions'
    ],
    faqs: [
      { question: 'Will you manage my Instagram page?', answer: 'Yes! Under our Growth plans, we manage the scheduling, captioning, hashtag research, and community engagement for you.' },
      { question: 'Do you guarantee virality?', answer: 'While no agency can guarantee a specific view count, our hook-driven frameworks and high production value maximize your chances of scaling reach.' }
    ],
    locationKeywords: ['Hyderabad', 'Jubilee Hills', 'Kukatpally', 'Somajiguda', 'Madhapur']
  },
  {
    slug: 'gym-reel-production-hyderabad',
    keyword: 'gym reel production Hyderabad',
    title: 'Gym Reel Production in Hyderabad | Fitness Video Agency',
    desc: 'Boost gym memberships with premium gym reel production in Hyderabad. High-energy fitness video production for fitness centers, gyms, and personal trainers.',
    name: 'Gym Reel Production',
    headline: 'Gym & Fitness Reel Production in Hyderabad',
    subheadline: 'Drive Gym Memberships with High-Energy Fitness Content',
    introText: 'Fitness is visual and motivational. We capture the sweat, the heavy lifts, and the raw energy of your gym to turn casual viewers into gym members in HITEC City, Gachibowli, and Kondapur.',
    benefits: [
      { title: 'High-Energy Pacing', desc: 'Dynamic timing matched to hard-hitting audio tracks that fire up viewers.' },
      { title: 'Premium Gear & Lighting', desc: 'Using specialized cameras and dynamic stabilizers to capture athletic motion smoothly.' },
      { title: 'Trainer Spotlights', desc: 'Positioning your trainers as local authority figures to build trust with prospects.' }
    ],
    process: [
      { step: '01', title: 'Creative Fit Audit', desc: 'Selecting core workouts, high-intensity exercises, and trainers to highlight.' },
      { step: '02', title: 'High-Speed Shoot', desc: 'Capturing cinematic slow-motion lifts, group energy classes, and facility walkthroughs.' },
      { step: '03', title: 'Hard-Cut Video Edit', desc: 'Fast-paced edits, beat syncing, deep bass boosts, and clean fitness typography.' },
      { step: '04', title: 'Membership Call', desc: 'Deploying with optimized call-to-actions to drive signups and local inquiries.' }
    ],
    deliverables: [
      'High-Intensity Gym Action Videos',
      'Slow-Motion Transition Effects',
      'Beat-Synced Professional Edits',
      'Trainer Highlight Reels',
      'Local Fitness SEO Hashtags'
    ],
    pricingPlan: 'Fitness Scale',
    pricingPrice: '₹19,999',
    pricingFeatures: [
      '12 Gym Reels / Month',
      'On-site Fitness Direction',
      'Cinema Paced Pacing',
      'ASMR Gym Sound Editing',
      'Trainer Spotlights',
      'Unlimited Revisions'
    ],
    faqs: [
      { question: 'Do you shoot real members or models?', answer: 'We can shoot either. Highlighting your real gym members and coaches builds authentic community trust, but we can work with models if preferred.' },
      { question: 'How much space do you need to film?', answer: 'We are experienced in working in active gym environments. We use compact, mobile gear to prevent any disruption to your members.' }
    ],
    locationKeywords: ['Gachibowli', 'Kondapur', 'Madhapur', 'Jubilee Hills', 'Kukatpally']
  },
  {
    slug: 'salon-reels-hyderabad',
    keyword: 'salon reels Hyderabad',
    title: 'Salon Reels Production in Hyderabad | Beauty & Hair Styling Reels',
    desc: 'Looking for premium salon reels shoot in Hyderabad? ReelScale creates aesthetic transformation videos, before/after hair styling reels, and beauty promos.',
    name: 'Salon Reels Hyderabad',
    headline: 'Premium Salon Reels Production in Hyderabad',
    subheadline: 'Fill Booking Calendars with Aesthetic Beauty & Transformation Reels',
    introText: 'In the beauty and styling industry, quality is everything. We produce stunning hair styling transformations, glowing skin therapy sessions, and premium salon walkthroughs in Jubilee Hills and Banjara Hills.',
    benefits: [
      { title: 'Flawless Beauty Lighting', desc: 'Studio-grade soft ring lighting that highlights skin texture and hair shine perfectly.' },
      { title: 'Satisfying Before/Afters', desc: 'Paced reveal transitions that capture the instant transformation and keep viewers scrolling.' },
      { title: 'Stylist Authority', desc: 'Showcasing the expertise of your master stylists to make your salon the premium local choice.' }
    ],
    process: [
      { step: '01', title: 'Transformation Strategy', desc: 'Mapping client makeovers, hair colors, and nail designs to highlight.' },
      { step: '02', title: 'Macro Detail Shoot', desc: 'Capturing close-up styling shots, scissor snips, color blending, and makeup brushes.' },
      { step: '03', title: 'Aesthetic Pacing', desc: 'Selecting soft, premium audio tracks and applying skin-glowing color correction.' },
      { step: '04', title: 'Booking Integration', desc: 'Launching reels with clear guidelines on how to book appointments on WhatsApp or DM.' }
    ],
    deliverables: [
      'Aesthetic Transformation Clips',
      'Before & After Reveal Reels',
      'Macro Product & Detail Shots',
      'Aesthetic Color Correction',
      'Stylist Feature Videos'
    ],
    pricingPlan: 'Salon Glow',
    pricingPrice: '₹19,999',
    pricingFeatures: [
      '12 Aesthetic Reels / Month',
      'On-site Beauty Direction',
      'Transformation Transition FX',
      'Color Grading & Skin Smoothing',
      'Stylist Features',
      'Unlimited Revisions'
    ],
    faqs: [
      { question: 'Can you film real clients?', answer: 'Yes! Filming actual customer makeovers with their consent is the highest-converting form of social proof.' },
      { question: 'Do you bring lighting equipment?', answer: 'Yes. We bring specialized softboxes and professional ring lights to ensure hair tones and styling details are perfectly lit.' }
    ],
    locationKeywords: ['Jubilee Hills', 'Banjara Hills', 'Madhapur', 'Gachibowli', 'Begumpet']
  },
  {
    slug: 'cafe-reels-hyderabad',
    keyword: 'cafe reels Hyderabad',
    title: 'Cafe Reels Production in Hyderabad | Cafe Video Marketing',
    desc: 'Create viral cafe reels in Hyderabad. ReelScale shoots aesthetic coffee pours, satisfying dessert plating, and cozy interior videos that drive weekend foot traffic.',
    name: 'Cafe Reels Hyderabad',
    headline: 'Cafe Reels Production in Hyderabad',
    subheadline: 'Cozy Aesthetics & Satisfying Coffee Pours that Drive Foot Traffic',
    introText: 'Cafes are about vibe, aesthetic, and taste. We shoot satisfying espresso extractions, latte art pours, and relaxing cafe interiors to make your venue the next viral weekend spot in Jubilee Hills, Madhapur, and Gachibowli.',
    benefits: [
      { title: 'Cozy Visual Grading', desc: 'Warm, cozy color profiles that capture the unique atmosphere and comfort of your cafe.' },
      { title: 'Coffee ASMR audio', desc: 'Crisp, isolated audio recording of coffee grinding, espresso dripping, and milk steaming.' },
      { title: 'Weekend Vibe Highlights', desc: 'Positioning your space as the ideal workspace, date venue, or friendly meetup spot.' }
    ],
    process: [
      { step: '01', title: 'Vibe Curation', desc: 'Identifying your signature drinks, popular desserts, and photogenic corners.' },
      { step: '02', title: 'Latte & Plating Shoot', desc: 'Recording macro details of coffee preparation, milk pours, and dessert toppings.' },
      { step: '03', title: 'Lo-Fi Chill Edits', desc: 'Editing with relaxing lo-fi background beats, smooth speed-ramps, and clean text.' },
      { step: '04', title: 'Weekend Promo Launch', desc: 'Releasing content before Friday to maximize weekend visits from local foodies.' }
    ],
    deliverables: [
      'Espresso Pour & Latte Art Clips',
      'Cafe Aesthetic Walkthroughs',
      'Signature Drink Promos',
      'Crisp Coffee Grinding ASMR Audio',
      'Local Geo-Targeted Hashtags'
    ],
    pricingPlan: 'Cafe Vibe',
    pricingPrice: '₹19,999',
    pricingFeatures: [
      '12 Cafe Reels / Month',
      'On-site Beverage Direction',
      'ASMR Microphones Included',
      'Cozy Warm Color Grading',
      'Signature Menu Highlights',
      'Unlimited Revisions'
    ],
    faqs: [
      { question: 'When is the best time to shoot?', answer: 'We typically schedule shoots in the early morning before opening or during slower weekday hours to capture clean shots without disturbing guests.' },
      { question: 'Do you create reels for seasonal menu launches?', answer: 'Yes! We can structure your monthly package around seasonal drinks, festival specials, or menu updates.' }
    ],
    locationKeywords: ['Jubilee Hills', 'Madhapur', 'Gachibowli', 'Film Nagar', 'Banjara Hills']
  },
  {
    slug: 'interior-reels-hyderabad',
    keyword: 'interior reels Hyderabad',
    title: 'Interior Design Reels in Hyderabad | Luxury Home Walkthroughs',
    desc: 'Showcase your architectural design work with premium interior reels in Hyderabad. Real estate and interior design walkthrough videos by ReelScale.',
    name: 'Interior Reels Hyderabad',
    headline: 'Interior Design Reels in Hyderabad',
    subheadline: 'Stunning Home Walkthroughs that Showcase Architectural Craftsmanship',
    introText: 'Interior design is about detail, space, and premium materials. We produce cinematic, smooth walkthrough reels that highlight your design choices, custom furniture, and spatial planning in Madhapur and Jubilee Hills.',
    benefits: [
      { title: 'Ultra-Smooth Stabilisation', desc: 'Using professional gimbal systems to deliver sweepingly smooth, architectural room tours.' },
      { title: 'Material Detail Highlights', desc: 'Macro focus on premium textures, wood grains, custom marble, and soft lighting fixtures.' },
      { title: 'Designer Portfolio Scale', desc: 'Transforming finished project handovers into high-end marketing assets that attract premium clients.' }
    ],
    process: [
      { step: '01', title: 'Layout Walkthrough', desc: 'Planning the best angles, natural light windows, and key rooms to highlight.' },
      { step: '02', title: 'Cinematic Gimbal Shoot', desc: 'Capturing clean, slow-panned room entries, transit corridors, and detail close-ups.' },
      { step: '03', title: 'Premium Music Sync', desc: 'Editing with elegant background music, seamless transitions, and clean project stats.' },
      { step: '04', title: 'Client Conversion launch', desc: 'Deploying reels targeting high-net-worth homeowners and real estate developers.' }
    ],
    deliverables: [
      'Cinematic Room Tour Walkthroughs',
      'Macro Material Texture Clips',
      'Smooth Gimbal Interior Tours',
      'Elegant Subtitle Annotations',
      'Premium Color Correction (LUTs)'
    ],
    pricingPlan: 'Design Showcase',
    pricingPrice: '₹19,999',
    pricingFeatures: [
      '12 Interior Walkthroughs / Month',
      'Ultra-Smooth Gimbal Videography',
      'Aesthetic Architectural Editing',
      'Elegant Font Styling',
      'Natural Light LUT Grading',
      'Unlimited Revisions'
    ],
    faqs: [
      { question: 'Should the site be staged before filming?', answer: 'Absolutely. For the best visual results, rooms should be fully staged, cleaned, and decluttered, with all lighting elements working.' },
      { question: 'Do you offer voiceover options?', answer: 'Yes! We can record a clean voiceover describing your design process, choices, and material selections to add educational value.' }
    ],
    locationKeywords: ['Madhapur', 'Jubilee Hills', 'Gachibowli', 'Banjara Hills', 'Financial District']
  },
  {
    slug: 'real-estate-reels-hyderabad',
    keyword: 'real estate reels Hyderabad',
    title: 'Real Estate Reels in Hyderabad | Luxury Property Video Agency',
    desc: 'Sell properties faster with cinematic real estate reels in Hyderabad. Luxury property walkthroughs, apartment promos, and villa videography in Gachibowli and Financial District.',
    name: 'Real Estate Reels',
    headline: 'Real Estate Reels in Hyderabad',
    subheadline: 'Cinematic Property Walkthroughs that Sell Villas & Apartments Faster',
    introText: 'Real estate is about luxury, layout, and lifestyle. We capture sweepingly smooth apartment tours, premium villa elevation shots, and community amenities to attract high-intent property buyers in Gachibowli, Kokapet, and Financial District.',
    benefits: [
      { title: 'Drone Elevation Views', desc: 'Capturing stunning aerial perspective shots of the property elevation and community layouts.' },
      { title: 'Highlighting Amenities', desc: 'Filming clubhouses, swimming pools, fitness zones, and green spaces to sell the lifestyle.' },
      { title: 'High-Intent CTAs', desc: 'Adding clear contact routes to drive direct inquiries to your sales office or agents.' }
    ],
    process: [
      { step: '01', title: 'Property Blueprinting', desc: 'Selecting key highlights: view from the balcony, kitchen details, and master suite.' },
      { step: '02', title: 'Cinematic Property Shoot', desc: 'Filming with wide-angle gimbals, detailed sliders, and high-dynamic-range cameras.' },
      { step: '03', title: 'Luxury Paced Edits', desc: 'Syncing to aspirational music, adding size/price text overlay, and color grading.' },
      { step: '04', title: 'Lead Generation Launch', desc: 'Deploying with optimized call-to-actions, local real estate tags, and enquiry links.' }
    ],
    deliverables: [
      'Cinematic Wide-Angle Property Tours',
      'balcony view & elevation clips',
      'Amenity & Clubhouse Walkthroughs',
      'Price & Layout Overlay Text',
      'Aspirational Background Scoring'
    ],
    pricingPlan: 'Property Scale',
    pricingPrice: '₹19,999',
    pricingFeatures: [
      '12 Real Estate Reels / Month',
      'Wide-Angle Stabilized Camera Tours',
      'Drone Aerial Filming Options',
      'Layout Stats Overlay Graphics',
      'Aspirational LUT Color Grading',
      'Unlimited Revisions'
    ],
    faqs: [
      { question: 'Do you provide drone footage?', answer: 'Yes! We have certified drone pilots to capture premium aerial angles of your villa project or apartment community.' },
      { question: 'Can agents present the property on-camera?', answer: 'Highly recommended! Having an agent present the home builds personal trust and guides the buyer through the property.' }
    ],
    locationKeywords: ['Gachibowli', 'Kokapet', 'Financial District', 'Narsingi', 'Madhapur']
  },
  {
    slug: 'corporate-reels-hyderabad',
    keyword: 'corporate reels Hyderabad',
    title: 'Corporate Reels Shoot in Hyderabad | Business Video Production',
    desc: 'Enhance your brand authority with corporate reels shoot in Hyderabad. Professional business videos, company profiles, team highlights, and founder interviews in HITEC City.',
    name: 'Corporate Reels',
    headline: 'Corporate Reels Shoot in Hyderabad',
    subheadline: 'Establish B2B Trust & Brand Authority with Business Reels',
    introText: 'Corporate identity is about authority, values, and professionalism. We produce clean, cinematic corporate video reels, founder interviews, team culture spotlights, and workplace office tours in HITEC City and Gachibowli.',
    benefits: [
      { title: 'Crisp Interview Audio', desc: 'Using wireless lapel lavaliers and studio mics to ensure absolute vocal clarity.' },
      { title: 'Polished Brand Graphics', desc: 'Adding custom lower thirds, company colors, brand typography, and slick transition graphics.' },
      { title: 'B2B Client Funnels', desc: 'Crafting authority-driven educational scripts that appeal to B2B decision-makers and recruits.' }
    ],
    process: [
      { step: '01', title: 'Storyboard & Hook Design', desc: 'Aligning corporate messages, values, and client testimonials into short hooks.' },
      { step: '02', title: 'Workplace Film Shoot', desc: 'Professional office shoots, b-roll capture, founder interviews, and team interaction shots.' },
      { step: '03', title: 'Polished Corporate Edit', desc: 'Adding company branding assets, clean lower thirds, captions, and balanced audio.' },
      { step: '04', title: 'LinkedIn & Social Setup', desc: 'Deploying with professional B2B hashtags and optimized publication schedules.' }
    ],
    deliverables: [
      'Founder Interview Clips',
      'Office Vibe & B-Roll Highlights',
      'Slick Lower-Third Brand Names',
      'Noise-Isolated Vocal Audios',
      'Corporate Color Grading LUTs'
    ],
    pricingPlan: 'Corporate Scale',
    pricingPrice: '₹19,999',
    pricingFeatures: [
      '12 Corporate Reels / Month',
      'Professional Lighting & Mic Gear',
      'Founder Interview Focus',
      'Clean Branding Color Assets',
      'LinkedIn Safe Pacing & Editing',
      'Unlimited Revisions'
    ],
    faqs: [
      { question: 'Do you shoot testimonials?', answer: 'Yes! Recording authentic customer reviews and client success interviews is one of our most popular corporate video formats.' },
      { question: 'Can you work around office hours?', answer: 'Absolutely. We coordinate with your HR team to film B-roll and interviews with minimal disruption to your active operations.' }
    ],
    locationKeywords: ['HITEC City', 'Gachibowli', 'Financial District', 'Madhapur', 'Banjara Hills']
  }
];

const template = (data) => `import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import ServicePageTemplate from "../services/ServicePageTemplate";
import "../../styles.css";

export const metadata: Metadata = {
  title: "${data.title}",
  description: "${data.desc}",
  alternates: {
    canonical: "https://reelscale.in/${data.slug}",
  },
  openGraph: {
    title: "${data.title}",
    description: "${data.desc}",
    url: "https://reelscale.in/${data.slug}",
    siteName: "ReelScale",
    images: ["https://reelscale.in/assets/logo.png"],
    type: "website",
  },
};

let cachedHeaderHtml: string | null = null;
let cachedFooterHtml: string | null = null;

function getHeaderAndFooter() {
  if (process.env.NODE_ENV === "production" && cachedHeaderHtml && cachedFooterHtml) {
    return { headerHtml: cachedHeaderHtml, footerHtml: cachedFooterHtml };
  }

  const html = readFileSync(join(process.cwd(), "index.html"), "utf8");

  // Extract Header
  const headerMatch = html.match(/<header[^>]*>([\\s\\S]*?)<\\/header>/i);
  let headerHtml = headerMatch ? headerMatch[0] : "";

  // Extract Footer
  const footerMatch = html.match(/<footer[^>]*>([\\s\\S]*?)<\\/footer>/i);
  let footerHtml = footerMatch ? footerMatch[0] : "";

  // Adjust relative links for Next routing
  headerHtml = headerHtml
    .replace(/href="#"/g, 'href="/"')
    .replace(/href="#work"/g, 'href="/works"')
    .replace(/href="#pricing"/g, 'href="/pricing"');

  footerHtml = footerHtml
    .replace(/href="#"/g, 'href="/"')
    .replace(/href="#work"/g, 'href="/works"')
    .replace(/href="#pricing"/g, 'href="/pricing"');

  cachedHeaderHtml = headerHtml;
  cachedFooterHtml = footerHtml;

  return { headerHtml, footerHtml };
}

export default function SEOPage() {
  const { headerHtml, footerHtml } = getHeaderAndFooter();

  const data = ${JSON.stringify(data, null, 2)};

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://reelscale.in/${data.slug}#webpage",
        "url": "https://reelscale.in/${data.slug}",
        "name": "${data.title}",
        "description": "${data.desc}"
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://reelscale.in/${data.slug}#breadcrumbs",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://reelscale.in"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "${data.name}",
            "item": "https://reelscale.in/${data.slug}"
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://reelscale.in/${data.slug}#localbusiness",
        "name": "ReelScale | ${data.name}",
        "url": "https://reelscale.in/${data.slug}",
        "logo": "https://reelscale.in/assets/logo.png",
        "image": "https://reelscale.in/assets/logo.png",
        "telephone": "+919966239433",
        "priceRange": "₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Madhapur, HITEC City",
          "addressLocality": "Hyderabad",
          "addressRegion": "Telangana",
          "postalCode": "500081",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "17.4483",
          "longitude": "78.3741"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://reelscale.in/${data.slug}#faq",
        "mainEntity": data.faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <ServicePageTemplate headerHtml={headerHtml} footerHtml={footerHtml} data={data} isMainVideoProduction={true} />
    </>
  );
}
`;

seoPages.forEach((page) => {
  const dirPath = path.join(process.cwd(), 'app', page.slug);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const filePath = path.join(dirPath, 'page.tsx');
  fs.writeFileSync(filePath, template(page), 'utf8');
  console.log('Generated SEO page for /' + page.slug + ' at ' + filePath);
});
console.log('Successfully generated all SEO pages!');
