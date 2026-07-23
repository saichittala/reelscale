import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LandingInteractions from "../../(landing)/components/LandingInteractions";
import "../../../styles.css";

interface Benefit {
  title: string;
  desc: string;
}

interface ProcessStep {
  step: string;
  title: string;
  desc: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface IndustryData {
  slug: string;
  name: string;
  keyword: string;
  metaTitle: string;
  metaDesc: string;
  headline: string;
  subheadline: string;
  introText: string;
  benefits: Benefit[];
  process: ProcessStep[];
  deliverables: string[];
  pricingPlan: string;
  pricingPrice: string;
  pricingFeatures: string[];
  faqs: FAQItem[];
  locationKeywords: string[];
}

const INDUSTRIES_DATA: Record<string, IndustryData> = {
  "restaurant-reels": {
    slug: "restaurant-reels",
    name: "Restaurant Reel Production",
    keyword: "Restaurant Reel Production Hyderabad",
    metaTitle: "Restaurant Reel Production Hyderabad | Cinematic Food Reels",
    metaDesc: "Struggling to fill tables? ReelScale produces mouth-watering, high-retention restaurant food reels in Hyderabad. Madhapur, Gachibowli, Jubilee Hills.",
    headline: "Restaurant Reel Production in Hyderabad",
    subheadline: "Fill Tables & Go Viral with Stunning Food & Dining Content",
    introText: "In the culinary capital of India, taste is visual. We create high-retention, cinematic food and dining reels in Hyderabad that drive foot traffic directly to your restaurant, cafe, or dining lounge in Gachibowli, Madhapur, and Jubilee Hills.",
    benefits: [
      { title: "Mouth-Watering Color Grading", desc: "Professional studio lighting and grading techniques that make every dish look irresistible on screen." },
      { title: "Hook-Driven Food Prep Shots", desc: "Capturing the sizzle, drizzle, and chop within the first 1.5 seconds to maximize viewer watch time." },
      { title: "Direct Table Bookings", desc: "Structured CTAs that guide foodies from viral video viewing to booking a table instantly." }
    ],
    process: [
      { step: "01", title: "Concept & Menu Curation", desc: "We select the most visually striking dishes and hooks that appeal to local Hyderabad food bloggers." },
      { step: "02", title: "Cinematic Shoot", desc: "On-site production in Madhapur, Banjara Hills or Gachibowli focusing on premium kitchen action." },
      { step: "03", title: "ASMR Sound Design & Edits", desc: "Hook-driven editing with culinary ASMR sound design, sizzles, and clean visual typography." },
      { step: "04", title: "Deploy & Dominate", desc: "Publishing with optimized local food hashtags and geo-tags to guarantee local discovery." }
    ],
    deliverables: [
      "Custom Written Script & Hook Ideas",
      "On-Site Cinematic Camera Direction",
      "High-End Color Grading (LUTs)",
      "Premium Food ASMR Sound Design",
      "Caption Taggings & Geo-Optimization"
    ],
    pricingPlan: "Dining Scale",
    pricingPrice: "₹19,999",
    pricingFeatures: [
      "12 Food Reels / Month",
      "On-Site Culinary Direction",
      "Cinematic Lighting Support",
      "Sound Design & Caption Styling",
      "1 Strategy Call / Month",
      "Priority Delivery",
      "Unlimited Revisions"
    ],
    faqs: [
      { question: "How long does a restaurant shoot take?", answer: "Usually 2-3 hours on-site. We minimize disruption to your active kitchen by scheduling shoots during non-peak hours." },
      { question: "Do you supply the camera crew?", answer: "Yes, we handle everything from standard high-resolution capture to cinematic lighting and direction." },
      { question: "Do these reels result in actual reservations?", answer: "Absolutely. By optimizing hooks for local audiences and adding clear location calls-to-action, we turn casual scrollers into table bookings." }
    ],
    locationKeywords: ["Gachibowli", "Madhapur", "Jubilee Hills", "Banjara Hills"]
  },
  "gym-reels": {
    slug: "gym-reels",
    name: "Gym Reel Production",
    keyword: "Gym Reel Production Hyderabad",
    metaTitle: "Gym Reel Production Hyderabad | Fitness Video Agency",
    metaDesc: "Premium gym reel production in Hyderabad. Get high-energy motivational reels for fitness centers, gyms, and personal trainers in Gachibowli and Kondapur.",
    headline: "Gym & Fitness Reel Production in Hyderabad",
    subheadline: "Drive Membership Signups with High-Energy Fitness Content",
    introText: "Fitness is about motivation and community. We capture the sweat, the heavy lifts, and the raw energy of your gym to turn casual viewers into gym members in HITEC City, Kondapur, and Kukatpally.",
    benefits: [
      { title: "High-Energy Pacing & Beats", desc: "Dynamic video timing matched perfectly to hard-hitting audio tracks that fire up viewers." },
      { title: "Transformation Narratives", desc: "Powerful before-and-after storytelling that builds credibility and inspires trust." },
      { title: "Premium Equipment Showcases", desc: "Cinematic gym tours that highlight your premium setups, cardio sections, and functional zones." }
    ],
    process: [
      { step: "01", title: "Strategy & Hook Design", desc: "Identifying the transformation angles, trainer tips, and workout challenges that perform best." },
      { step: "02", title: "High-Energy Shoot", desc: "Capturing lifting sequences, slow-mo reps, and trainer interactions under proper fitness lighting." },
      { step: "03", title: "Bass-Boosted Audio Edit", desc: "Fast-cut transition editing combined with trend-right motivational soundscapes and custom text overlays." },
      { step: "04", title: "Local Reach Launch", desc: "Optimizing with fitness hashtags and geo-targeted tags to capture active gym-seekers in your locality." }
    ],
    deliverables: [
      "Trainer Scriptwriting & Concept Drafts",
      "Action Camera Choreography & Angles",
      "Energy Sound Design & Voiceovers",
      "Custom Captions and Progress Bars",
      "Local Gym Member Lead Optimization"
    ],
    pricingPlan: "Fitness Pro",
    pricingPrice: "₹19,999",
    pricingFeatures: [
      "12 High-Energy Reels / Month",
      "Motivational Soundscapes",
      "Trainer Spotlight Scripting",
      "Equipment Tour Optimization",
      "Monthly Strategy Consultation",
      "Fast Turnaround",
      "Unlimited Edits"
    ],
    faqs: [
      { question: "Can you film during regular gym hours?", answer: "Yes. We work around your members to ensure we capture the vibrant energy of the gym without compromising their workout experience." },
      { question: "What should trainers wear for the shoot?", answer: "Branded gym apparel is best to establish strong visual identity and brand professionalism." },
      { question: "How does this help gym membership sales?", answer: "Reels show off the vibe, quality, and results of your gym, building rapid desire and trust that leads directly to membership enquiries." }
    ],
    locationKeywords: ["Gachibowli", "Kondapur", "HITEC City", "Kukatpally"]
  },
  "interior-designers": {
    slug: "interior-designers",
    name: "Interior Design Reel Production",
    keyword: "Interior Design Reel Production Hyderabad",
    metaTitle: "Interior Design Reel Production Hyderabad | Luxury Space Videos",
    metaDesc: "Showcase your luxury designs. Premium interior design reel production in Hyderabad. We film projects in Jubilee Hills, Banjara Hills, and Gachibowli.",
    headline: "Interior Design Reel Production in Hyderabad",
    subheadline: "Showcase Luxury Transformations & Space Aesthetics",
    introText: "Interior design is about detail, luxury, and transformation. We produce cinematic space walkthroughs and home transformation reels that showcase your premium aesthetics to high-intent clients in Jubilee Hills, Banjara Hills, and Gachibowli.",
    benefits: [
      { title: "Cinematic Slow-Mo Panning", desc: "Silky-smooth camera movements that capture spatial scale, carpentry finishes, and luxury lighting." },
      { title: "Satisfying Before/After Reveals", desc: "Visual storytelling that builds drama around the transformation from raw masonry to final luxury styling." },
      { title: "Detail-Oriented Close Ups", desc: "Highlighting texture, materials, custom hardware, and detailed craftsmanship that command high budgets." }
    ],
    process: [
      { step: "01", title: "Project Audit & Lighting", desc: "We review the layout, architectural accents, and configure appropriate soft lighting solutions." },
      { step: "02", title: "Steady Cam Shoot", desc: "On-site capture utilizing professional-grade gimbal stabilizers to ensure cinematic space flows." },
      { step: "03", title: "Luxe Color Grading", desc: "Color grading focused on showcasing natural wood textures, warm light tones, and stone patterns." },
      { step: "04", title: "High-Ticket Client CTA", desc: "Formulating elegant descriptions and links to drive direct consultation requests from local design seekers." }
    ],
    deliverables: [
      "Concept Scripting & Floor Plan Flow",
      "Stabilized Gimbal Camera Production",
      "Luxury Ambient Sound Design",
      "Material Texture Close-up Focus",
      "Consultation Lead Pipeline Setup"
    ],
    pricingPlan: "Interior Premium",
    pricingPrice: "₹24,999",
    pricingFeatures: [
      "8 Luxury Interior Reels / Month",
      "Gimbal Stabilized Capture",
      "Pro Lighting Configuration",
      "Natural Color Correction",
      "2 Design Strategy Calls / Month",
      "Unlimited Revisions",
      "Raw Project Clips Backup"
    ],
    faqs: [
      { question: "Do you shoot occupied residences?", answer: "Yes. We work closely with you and the homeowner to establish filming permissions and ensure zero damage to styled setups." },
      { question: "How long does a home shoot take?", answer: "A complete home walkthrough shoot typically takes 4-5 hours to properly capture lighting variations." },
      { question: "What styling is required for the video?", answer: "We recommend staging spaces with warm accent lights, styled books, clean countertops, and fresh foliage." }
    ],
    locationKeywords: ["Jubilee Hills", "Banjara Hills", "Gachibowli", "Madhapur"]
  },
  "salons": {
    slug: "salons",
    name: "Salon Reel Production",
    keyword: "Salon Reel Production Hyderabad",
    metaTitle: "Salon Reel Production Hyderabad | Beauty & Hair Makeovers",
    metaDesc: "Attract beauty and hair clients. Professional salon reel production in Hyderabad. We film transformations in Madhapur, Kondapur, and Gachibowli.",
    headline: "Salon & Beauty Reel Production in Hyderabad",
    subheadline: "Highlight Aesthetic Transformations & Hair Makeovers",
    introText: "Beauty is experiential. We produce satisfying hair transformation reels, facial glow captures, and makeovers that build visual desire and book out your chairs in Madhapur, Kondapur, and HITEC City.",
    benefits: [
      { title: "Satisfying Before/After Splits", desc: "Dramatic hair flips and glow reveals that capture immediate attention and go viral." },
      { title: "ASMR Styling Sounds", desc: "Focusing on the crisp sound of scissors, blow dryers, and hair products to retain viewers." },
      { title: "Highlighting Premium Products", desc: "Showcasing luxury brands and hygiene standards that justify premium salon pricing." }
    ],
    process: [
      { step: "01", title: "Styling Board & Hooks", desc: "Deciding on hair makeover scopes, facial transformations, and trending sound hooks." },
      { step: "02", title: "Transformation Shoot", desc: "Filming the client journey from arrival, active styling steps, to the dramatic final reveal." },
      { step: "03", title: "Trending Audio Sync", desc: "Snappy pacing, beat drops synced to hair reveals, and bright aesthetic color grading." },
      { step: "04", title: "Booking Integration", desc: "Adding instant WhatsApp booking links and geo-optimization for nearby customers." }
    ],
    deliverables: [
      "Makeover Concept & Styling Guide",
      "High-Key Lighting Production",
      "Satisfaction Audio ASMR Focus",
      "Bright Aesthetic Color LUTs",
      "Chair Booking Lead CTA"
    ],
    pricingPlan: "Salon Growth",
    pricingPrice: "₹19,999",
    pricingFeatures: [
      "12 Salon Makeover Reels / Month",
      "High-Key Transformation Lighting",
      "Satisfying ASMR Audio Focus",
      "Stylist Profile Spotlights",
      "Local Search Geo-Tagging",
      "Fast Turnaround",
      "Unlimited Edits"
    ],
    faqs: [
      { question: "Do we need professional models?", answer: "No, real client transformations work best! With their permission, filming actual clients makes content relatable and high-converting." },
      { question: "What lighting do you use?", answer: "We bring professional ring lights and softboxes to match the bright, clean aesthetic of premium salons." },
      { question: "Can we highlight individual stylists?", answer: "Yes, creating stylist spotlights is a highly effective way to build personal trust and loyal client relationships." }
    ],
    locationKeywords: ["Madhapur", "Kondapur", "Gachibowli", "HITEC City"]
  },
  "fashion-brands": {
    slug: "fashion-brands",
    name: "Fashion Reel Production",
    keyword: "Fashion Reel Production Hyderabad",
    metaTitle: "Fashion Reel Production Hyderabad | Brand Video Shoots",
    metaDesc: "Premium fashion reel production in Hyderabad. Viral outfit transition shoots, lookbooks, and fabric details for local labels in Banjara Hills and Madhapur.",
    headline: "Fashion & Apparel Reel Production in Hyderabad",
    subheadline: "Cinematic Outfit Transitions & Lookbook Video Shoots",
    introText: "Fashion moves at the speed of social media. We create premium runway-style lookbooks, satisfying outfit transition reels, and detailed fabric close-ups that make your clothing brand stand out in Banjara Hills, Madhapur, and Jubilee Hills.",
    benefits: [
      { title: "Viral Match-Cut Transitions", desc: "Perfect outfit change transitions synced to trending audio beats that maximize shares and saves." },
      { title: "High-Definition Fabric Detailing", desc: "Macro camera work highlighting texture, stitching quality, embroidery, and fabric motion." },
      { title: "Dynamic Styling Lookbooks", desc: "Aesthetic outdoor and indoor styling reels that show clothing in real-world motion." }
    ],
    process: [
      { step: "01", title: "Moodboard & Lookbook Layout", desc: "Aligning on outfit styles, transition beats, and background aesthetic aesthetics." },
      { step: "02", title: "Model Direction & Shoot", desc: "Filming transition snaps, runway strides, and material close-ups in premium studio or outdoor spots." },
      { step: "03", title: "Snappy Beat-Match Edits", desc: "Fast-paced visual matching, color tone optimization, and custom overlay typography." },
      { step: "04", title: "Store Traffic Setup", desc: "Linking reels to catalog pages and direct-to-buy links for instant conversion." }
    ],
    deliverables: [
      "Outfits Storyboard & Moodboarding",
      "Macro Detailing Lens Production",
      "Trending Transition Synchronization",
      "Brand Color Grading & Tone Matching",
      "Catalog Store Traffic CTAs"
    ],
    pricingPlan: "Fashion Scale",
    pricingPrice: "₹24,999",
    pricingFeatures: [
      "12 Outfit/Lookbook Reels / Month",
      "Match-Cut Transition Edits",
      "Macro Fabric detailing",
      "Bright Brand Color Grading",
      "Catalog Link Optimizations",
      "Fast Delivery",
      "Unlimited Edits"
    ],
    faqs: [
      { question: "Do you supply the shoot locations?", answer: "We coordinate with premium local studios in Hyderabad or identify suitable outdoor locations in Jubilee Hills or Banjara Hills." },
      { question: "Can we shoot multiple outfits in one day?", answer: "Yes. We structure shoots to maximize outfit rotations, filming up to 10-15 outfits in a single production block." },
      { question: "What format are deliverables?", answer: "Deliverables are optimized vertical vertical MP4s (1080x1920) formatted specifically for Instagram Reels and TikTok." }
    ],
    locationKeywords: ["Banjara Hills", "Madhapur", "Jubilee Hills", "Kukatpally"]
  },
  "real-estate": {
    slug: "real-estate",
    name: "Real Estate Video Production",
    keyword: "Real Estate Video Production Hyderabad",
    metaTitle: "Real Estate Video Production Hyderabad | Property Reels",
    metaDesc: "Sell properties faster. Cinematic real estate walkthroughs and property reels in Hyderabad. Gachibowli, Kukatpally, HITEC City, Kokapet.",
    headline: "Real Estate Video Production in Hyderabad",
    subheadline: "Cinematic Home Walkthroughs & Property Investment Reels",
    introText: "Properties are sold on visual scale. We produce high-end architectural property walkthroughs and neighborhood investment guide reels that connect with serious buyers in Gachibowli, Kokapet, HITEC City, and Kukatpally.",
    benefits: [
      { title: "Wide-Angle Interior Flows", desc: "Ultrawide lenses and gimbal stabilizers that make bedrooms and living areas look spacious and open." },
      { title: "Neighborhood Highlights", desc: "Showcasing surrounding parks, schools, roads, and connectivity that drive property value." },
      { title: "Clear Property Callouts", desc: "Visual text overlays detailing carpet area, price, configurations, and contact information." }
    ],
    process: [
      { step: "01", title: "Property Audit & Scripting", desc: "Highlighting key selling points (kitchen fittings, views, master suite) and mapping walking flows." },
      { step: "02", title: "Cinematic Walkthrough Shoot", desc: "Stabilized spatial capture, highlighting interior styling, amenities, and community assets." },
      { step: "03", title: "Luxe Real Estate Grade", desc: "Warm and bright color editing, cozy background audio, and dynamic text specifications." },
      { step: "04", title: "Buyer Lead Generation", desc: "Adding clear inquiry actions, contact numbers, and mapping lead flows on WhatsApp." }
    ],
    deliverables: [
      "Property Highlight Storyboarding",
      "Wide-Angle Gimbal Stabilized Video",
      "Amenities & Community Spotlights",
      "Property Spec Text Overlays",
      "Direct Buyer Enquiry Funneling"
    ],
    pricingPlan: "Property Scale",
    pricingPrice: "₹24,999",
    pricingFeatures: [
      "8 Luxury Property Walkthroughs / Month",
      "Wide-Angle Stabilizer Capture",
      "Amenities Focus Highlight",
      "Key Feature Text Callouts",
      "Local Buyer Lead Funnels",
      "Fast 24-48h Delivery",
      "Unlimited Edits"
    ],
    faqs: [
      { question: "Do you use drone footage?", answer: "Yes, drone aerials can be added to highlight land scale, neighborhood layouts, and elevation." },
      { question: "Is staging required for property shoots?", answer: "Staged properties (fully furnished or decorated show apartments) perform significantly better as they allow buyers to visualize living in the space." },
      { question: "How long does a property shoot take?", answer: "Usually 3-4 hours on-site depending on the BHK size or villa configuration." }
    ],
    locationKeywords: ["Gachibowli", "Kokapet", "HITEC City", "Kukatpally"]
  },
  "healthcare": {
    slug: "healthcare",
    name: "Healthcare Video Production",
    keyword: "Healthcare Video Production Hyderabad",
    metaTitle: "Healthcare Video Production Hyderabad | Doctor Explainers",
    metaDesc: "Build patient trust. Professional medical explainer videos and doctor reels in Hyderabad. Kondapur, Gachibowli, Kukatpally, Madhapur.",
    headline: "Healthcare & Medical Video Production in Hyderabad",
    subheadline: "Build Patient Trust with Professional Doctor Explainer Reels",
    introText: "Healthcare choice is based on trust. We produce professional doctor explainer videos, patient journey logs, and clinic tour reels that build authority and trust for medical practices in Kondapur, Gachibowli, Kukatpally, and Madhapur.",
    benefits: [
      { title: "Authority-Building Medical Explainers", desc: "Translating complex medical topics into clear, digestible, patient-friendly video advice." },
      { title: "Clean Clinic Tour Walkthroughs", desc: "Highlighting diagnostic tools, hygiene standards, patient lounges, and friendly staff." },
      { title: "Patient Success Logs", desc: "Ethical and compliant patient recovery stories and testimonials that build confidence." }
    ],
    process: [
      { step: "01", title: "Compliance & Topic Selection", desc: "Curating medically accurate and compliant topics, FAQs, and health tips that resolve patient doubts." },
      { step: "02", title: "Clean Corporate Shoot", desc: "Filming the medical team in a well-lit clinic environment using teleprompters for clean speech delivery." },
      { step: "03", title: "Accurate Explainer Graphics", desc: "Integrating clean text callouts, diagrams, and professional color tones for medical authority." },
      { step: "04", title: "Patient Flow Setup", desc: "Configuring links for easy appointment bookings and clinic directions." }
    ],
    deliverables: [
      "Medical FAQ Explainer Scripting",
      "Teleprompter Supported Production",
      "Anatomical Graphic Text Overlays",
      "Hygiene & Facility Spotlight",
      "Appointment Booking CTAs"
    ],
    pricingPlan: "Clinic Authority",
    pricingPrice: "₹19,999",
    pricingFeatures: [
      "12 Medical Explainer Reels / Month",
      "Teleprompter Shoot Support",
      "Clean Explainer Typography",
      "Clinic Facility Spotlight",
      "Compliance & Script Audits",
      "Priority Support",
      "Unlimited Revisions"
    ],
    faqs: [
      { question: "Do doctors have to memorize scripts?", answer: "No. We bring professional teleprompters so doctors can read scripts naturally while maintaining eye contact with the camera." },
      { question: "Is this compliant with healthcare ad guidelines?", answer: "Yes, our scriptwriting team avoids sensational claims, focusing strictly on educational content and client success." },
      { question: "How long does a clinic shoot take?", answer: "We shoot in a single 3-hour window to minimize disruption to patients and clinical operations." }
    ],
    locationKeywords: ["Kondapur", "Gachibowli", "Kukatpally", "Madhapur"]
  },
  "cafes": {
    slug: "cafes",
    name: "Cafe Reel Production",
    keyword: "Cafe Reel Production Hyderabad",
    metaTitle: "Cafe Reel Production Hyderabad | Aesthetic Coffee Videos",
    metaDesc: "Attract local coffee lovers. Aesthetic cafe reels and menu showcases in Hyderabad. Film in Madhapur, Gachibowli, Jubilee Hills.",
    headline: "Cafe Reel Production in Hyderabad",
    subheadline: "Attract Coffee Lovers with Aesthetic Cafe Vibe & Menu Reels",
    introText: "Cafes are about vibe, aesthetic, and community. We capture cozy latte pours, aesthetic cafe seating, and weekend mood reels that turn coffee lovers into loyal customers in Madhapur, Gachibowli, and Jubilee Hills.",
    benefits: [
      { title: "Aesthetic Coffee Pours", desc: "Macro close-ups of espresso extractions, latte art, and satisfying drink preps." },
      { title: "Cozy Workspace Vibe Reels", desc: "Highlighting laptop-friendly workspaces, natural lighting, and warm aesthetic corners." },
      { title: "Weekend Vibe Promos", desc: "High-energy cafe culture reels highlighting weekend crowds, live music, and brunch plates." }
    ],
    process: [
      { step: "01", title: "Vibe Mapping & Menu Highlights", desc: "Curation of signature brew methods (cold brews, pour overs) and aesthetic seating corners." },
      { step: "02", title: "Cozy Ambient Shoot", desc: "On-site capture focusing on warm natural light, brewing soundscapes, and aesthetic lookbooks." },
      { step: "03", title: "Chill Acoustic Sound Edits", desc: "Synergizing cozy visuals with warm color tones, lo-fi beats, and clean minimalistic texts." },
      { step: "04", title: "Local Discovery Launch", desc: "Optimizing with cafe hashtags and geo-tags to pull weekend workspace seekers." }
    ],
    deliverables: [
      "Cafe Vibe Concept Storyboards",
      "Aesthetic Ambient Lens Production",
      "ASMR Latte Art & Brewing Capture",
      "Warm Minimalistic Color Grading",
      "Google Maps Location Integration"
    ],
    pricingPlan: "Cafe Vibe",
    pricingPrice: "₹19,999",
    pricingFeatures: [
      "12 Aesthetic Cafe Reels / Month",
      "Aesthetic Ambient Soundscapes",
      "Latte Art ASMR Focus",
      "Bestselling Dish Highlights",
      "Geo-Location Optimization",
      "Fast Turnaround",
      "Unlimited Edits"
    ],
    faqs: [
      { question: "When is the best time to film a cafe?", answer: "Early morning before opening is ideal for clean, empty aesthetic workspace shots. Late afternoons work best to capture active cafe vibes." },
      { question: "Do you capture customer faces?", answer: "We focus on coffee prep, plates, and styled corners, only capturing customer silhouettes to preserve privacy." },
      { question: "How does this drive cafe traffic?", answer: "Instagram is the primary search engine for cafes in Hyderabad. Reels showing off cozy aesthetics and signature coffee lead directly to weekend footfall." }
    ],
    locationKeywords: ["Madhapur", "Gachibowli", "Jubilee Hills", "Banjara Hills"]
  },
  "startups": {
    slug: "startups",
    name: "Startup Video Production",
    keyword: "Startup Video Production Hyderabad",
    metaTitle: "Startup Video Production Hyderabad | Founder Explainers",
    metaDesc: "Scale your tech presence. Premium startup video production in Hyderabad. Founder stories, product demos, and office tours in HITEC City.",
    headline: "Startup Video Production in Hyderabad",
    subheadline: "Explain Your Tech Product & Build Hype with Founder Reels",
    introText: "Startups need to capture attention, explain tech value, and build investor interest. We produce high-impact founder explainers, SaaS product demos, and tech office culture reels in HITEC City, Madhapur, and Gachibowli.",
    benefits: [
      { title: "Founder Storytelling Hooks", desc: "Capturing the startup vision, problems solved, and growth milestones in brief, high-impact stories." },
      { title: "SaaS Product Interface Demos", desc: "Cinematic desktop recordings and screen flows showing ease of use and user value." },
      { title: "Tech Office Culture Reels", desc: "Highlighting collaborative teams, brain sessions, and vibrant workspaces to attract tech talent." }
    ],
    process: [
      { step: "01", title: "Product Value Scripting", desc: "Mapping user pain points, product solutions, and clarifying technical jargon into hooks." },
      { step: "02", title: "Professional Studio Shoot", desc: "Filming founders and team members under modern tech lighting setups with clean backdrops." },
      { step: "03", title: "Tech Sound & Motion Edits", desc: "Combining dynamic sound design, feature callouts, and clean tech text overlays." },
      { step: "04", title: "Investor & User Hype", desc: "Configuring custom actions to drive product signups and highlight developer culture." }
    ],
    deliverables: [
      "User Benefit Explainer Scripting",
      "Studio Style Teleprompter Production",
      "Tech Motion Graphic Overlays",
      "Culture & Office Highlights",
      "Product Signup Call-to-Actions"
    ],
    pricingPlan: "Startup Scale",
    pricingPrice: "₹24,999",
    pricingFeatures: [
      "12 Startup/Product Reels / Month",
      "Founder Storytelling Scripting",
      "UI Screen Flow Integrations",
      "Tech Sound Design Effects",
      "Employer Brand Culture Highlight",
      "Priority Turnaround",
      "Unlimited Revisions"
    ],
    faqs: [
      { question: "Can you edit SaaS product screens?", answer: "Yes, we integrate high-resolution screen recordings, cursor animations, and custom UI zooms to make software look beautiful." },
      { question: "How long are startup reels?", answer: "We recommend 45-60 seconds for detailed explainer posts, and 15-30 seconds for viral tech hooks." },
      { question: "Do you support recruiting videos?", answer: "Yes, office culture reels are a highly effective way to showcase start-up work-life and attract top engineering talent." }
    ],
    locationKeywords: ["HITEC City", "Madhapur", "Gachibowli", "Kokapet"]
  },
  "corporate-companies": {
    slug: "corporate-companies",
    name: "Corporate Video Production",
    keyword: "Corporate Video Production Hyderabad",
    metaTitle: "Corporate Video Production Hyderabad | Event & Culture Reels",
    metaDesc: "Enhance your corporate brand. High-end corporate video production in Hyderabad. Event recaps, corporate updates, and employer branding in HITEC City.",
    headline: "Corporate Video Production in Hyderabad",
    subheadline: "Employer Branding, Corporate Event Recaps & Team Culture Reels",
    introText: "Corporate video shouldn't be boring. We produce high-end, cinematic event recaps, corporate summary updates, and employee spotlights that position your brand as a professional leader in HITEC City, Madhapur, and Gachibowli.",
    benefits: [
      { title: "Cinematic Event Highlights", desc: "Polished coverage of conferences, client summits, product launches, and annual celebrations." },
      { title: "Polished Employee Spotlights", desc: "Humanizing the brand by sharing leadership stories and employee growth paths." },
      { title: "Professional Production Value", desc: "Perfect high-definition visual capture, standard corporate audio setups, and smooth pacing." }
    ],
    process: [
      { step: "01", title: "Corporate Briefing & Align", desc: "Understanding brand guidelines, key messages, event highlights, and visual requirements." },
      { step: "02", title: "Multi-Camera Event Shoot", desc: "Professional on-site production capturing speeches, panel discussions, and candid networking moments." },
      { step: "03", title: "Clean Corporate Edits", desc: "Sophisticated audio leveling, branded lower thirds, corporate slides, and brand color grades." },
      { step: "04", title: "Corporate Share Launch", desc: "Formatting vertical updates for LinkedIn, YouTube, and corporate channels." }
    ],
    deliverables: [
      "Corporate Storyboard & Briefing",
      "Multi-Angle Event Video Capture",
      "Branded Logo Lower-Thirds",
      "Speech Audio Mastering & Leveling",
      "LinkedIn & Corporate Sharing Optimizations"
    ],
    pricingPlan: "Enterprise Scale",
    pricingPrice: "₹24,999",
    pricingFeatures: [
      "8 Corporate/Event Reels / Month",
      "Professional Audio Mastering",
      "Branded Logo & Asset Integrations",
      "Team Culture Highlights",
      "LinkedIn Format Optimizations",
      "Priority Turnaround",
      "Unlimited Revisions"
    ],
    faqs: [
      { question: "Do you travel for corporate shoots?", answer: "Yes, we cover corporate offices and event venues across Hyderabad, Gachibowli, and HITEC City." },
      { question: "Can you overlay branded slides?", answer: "Yes, we integrate slides, logo watermarks, lower thirds, and brand fonts according to your corporate design manual." },
      { question: "What is the turnaround for events?", answer: "We deliver event recap reels within 48 hours to capitalize on event buzz and social sharing." }
    ],
    locationKeywords: ["HITEC City", "Madhapur", "Gachibowli", "Jubilee Hills"]
  },
  "video-production-services": {
    slug: "video-production-services",
    name: "Video Production Services",
    keyword: "Video Production Services Hyderabad",
    metaTitle: "Video Production Services Hyderabad | ReelScale Co.",
    metaDesc: "ReelScale offers premium end-to-end video production services in Hyderabad. Scriptwriting, cinematic filming, corporate and brand edits.",
    headline: "Premium Video Production Services",
    subheadline: "High-Retention Video Production Engineered to Scale Brands",
    introText: "We manage the complete video production pipeline from initial scripting to final cinematic edit. Get professional corporate, commercial, and brand videos designed for organic search and client acquisition.",
    benefits: [
      { title: "Strategic Scriptwriting", desc: "Every video starts with hook-driven messaging that aligns with your user demographic." },
      { title: "Cinematic Videography", desc: "On-location high-definition recording with premium lighting and crystal clear audio." },
      { title: "Bespoke Color & Editing", desc: "Professional grading, clean text overlays, and sound design that holds viewer retention." }
    ],
    process: [
      { step: "01", title: "Concept & Script", desc: "Translating your sales copy or brand messages into scroll-stopping scripts." },
      { step: "02", title: "On-site Production", desc: "Filming with multi-camera set-ups, key light configuration, and teleprompters." },
      { step: "03", title: "Advanced Sound & Edit", desc: "Removing filler words, audio enhancement, lo-fi beats, and caption timing." },
      { step: "04", title: "Algorithmic Upload", desc: "Formatting optimized video files for Instagram Reels, LinkedIn, and YouTube Shorts." }
    ],
    deliverables: [
      "Scripting & Hook Variations",
      "Professional On-Site Camera Direction",
      "High-End Audio Balancing & Mastering",
      "Bespoke Color Correction & Grading",
      "Subtitle Overlay & Logo Watermarks"
    ],
    pricingPlan: "Production Growth",
    pricingPrice: "₹24,999",
    pricingFeatures: [
      "12 Custom Videos / Month",
      "Teleprompter Supported Shoots",
      "Pro Lighting and Audio Capture",
      "Vocal Audio Mastering",
      "Custom Brand Typography",
      "Unlimited Revisions",
      "Priority Turnaround"
    ],
    faqs: [
      { question: "What kind of videos do you produce?", answer: "We specialize in short-form content (Reels, TikTok, YouTube Shorts), corporate explainer videos, commercial ads, and SaaS software demos." },
      { question: "Do you handle script writing?", answer: "Yes, our team drafts 100% of the script copy with scroll-stopping hooks and calls-to-action." },
      { question: "What is the turnaround time?", answer: "Standard edits are delivered within 48 hours of filming." }
    ],
    locationKeywords: ["Hyderabad", "Gachibowli", "Madhapur", "Jubilee Hills"]
  },
  "music-video-production": {
    slug: "music-video-production",
    name: "Music Video Production",
    keyword: "Music Video Production Hyderabad",
    metaTitle: "Music Video Production Hyderabad | Cinematic Visuals | ReelScale",
    metaDesc: "Take your tracks viral. ReelScale provides high-end music video production services in Hyderabad. Cinematic transition styling, beat synchronization, and premium color grading.",
    headline: "Cinematic Music Video Production",
    subheadline: "Stunning Visual Storytelling Synced to Your Music Beats",
    introText: "We combine visual matching, match-cut transitions, and luxury dynamic lighting to create scroll-stopping music videos optimized for social media reach and viral growth.",
    benefits: [
      { title: "Beat-Synched Pacing", desc: "Transitions and visual cuts timed perfectly to your track's beats and drops." },
      { title: "Atmospheric Lighting", desc: "Professional stage lighting setup, neon accent coloring, and custom shadow contrast." },
      { title: "Viral Cut Storyboarding", desc: "Designing hooks and dramatic reveals that encourage shares and saves on social media." }
    ],
    process: [
      { step: "01", title: "Track Auditing & Storyboard", desc: "Mapping out visual transitions, style guides, and model directions to match the audio." },
      { step: "02", title: "Cinematic Session Shoot", desc: "On-location gimbal filming focusing on high-speed movements and matching angles." },
      { step: "03", title: "Dynamic Beat Grading", desc: "Advanced post-production synced transitions, visual effects, and custom text cards." },
      { step: "04", title: "Multi-Platform Publish", desc: "Optimizing formats for Instagram Reels, YouTube Shorts, and TikTok discovery." }
    ],
    deliverables: [
      "Beat Storyboard & Concept Board",
      "High-Dynamic-Range Camera Capture",
      "Bespoke Beat-Matched Transition Cuts",
      "Stylized Color Grading & LUTs",
      "Social Media Cover Thumbnails"
    ],
    pricingPlan: "Music Video Scale",
    pricingPrice: "₹29,999",
    pricingFeatures: [
      "8 Stylized Music Clips / Month",
      "Professional Gimbal Capture",
      "Studio Lighting Modifications",
      "Transition Sound Effect Overlays",
      "Visual Hooks Storyboarding",
      "Priority Edits Delivery",
      "Unlimited Revisions"
    ],
    faqs: [
      { question: "Do you help write visual scripts?", answer: "Yes, we match your music beats to engaging visual storyboards." },
      { question: "Can we shoot outdoors?", answer: "Yes, we film in dynamic outdoor spots or local studio locations in Hyderabad." }
    ],
    locationKeywords: ["Hyderabad", "Banjara Hills", "Jubilee Hills", "Gachibowli"]
  },
  "animated-video-production": {
    slug: "animated-video-production",
    name: "Animated Video Production",
    keyword: "Animated Video Production Services",
    metaTitle: "Animated Video Production Company | Explainer Videos",
    metaDesc: "Attract customers with clean animations. ReelScale provides premium animated video production services. SaaS dashboards, typographic guides, and explainer motion graphics.",
    headline: "Animated Video Production Services",
    subheadline: "Explain Complex Tech and Ideas with Clean Motion Graphics",
    introText: "We create high-end typographic animations, software dashboard walkthroughs, and conceptual motion graphics that explain your tech or service value instantly.",
    benefits: [
      { title: "Clean Typography Layouts", desc: "Bold, legible design system fonts styled to keep viewers reading without sound." },
      { title: "Software Dashboard Zooms", desc: "Animated cursor trails, UI focuses, and dashboard overlays showing ease of software use." },
      { title: "High-Impact Auditory Cues", desc: "Pops, typing sounds, rip effects, and ambient beats synced perfectly to graphic elements." }
    ],
    process: [
      { step: "01", title: "Script & Visual Blueprint", desc: "Structuring user benefit copy and mapping transitions for graphic components." },
      { step: "02", title: "Typography & Asset Styling", desc: "Selecting brand typography, color schemes, and dashboard vectors." },
      { step: "03", title: "Motion Graphic Animation", desc: "Animating UI flows, screen translations, cursor tracks, and sound designs." },
      { step: "04", title: "High-Retention Delivery", desc: "Exporting high-resolution vertical MP4s optimized for social algorithms." }
    ],
    deliverables: [
      "Animated Screen Walkthrough Storyboards",
      "Custom Typography Animations",
      "Animated Software UI Demos",
      "Dynamic Audio Sound FX Layers",
      "Optimized Vertical Layout Formats"
    ],
    pricingPlan: "Motion Pro",
    pricingPrice: "₹24,999",
    pricingFeatures: [
      "6 Typographic/SaaS Animated Clips / Month",
      "Typographic Script Writing",
      "UI Cursor Tracking Animations",
      "High-Impact Sound Design FX",
      "Brand Color Matching",
      "Fast 48h Turnaround",
      "Unlimited Revisions"
    ],
    faqs: [
      { question: "Do I need to record my face?", answer: "No. Animated explainers focus entirely on text motion, graphic diagrams, and software UI screencasts." },
      { question: "Do you include voiceovers?", answer: "Yes, we can sync animations with AI or professional studio voiceover tracks." }
    ],
    locationKeywords: ["Hyderabad", "Gachibowli", "Madhapur", "Kondapur"]
  },
  "commercial-video-production": {
    slug: "commercial-video-production",
    name: "Commercial Video Production",
    keyword: "Commercial Video Production Company",
    metaTitle: "Commercial Video Production Company | High-Converting Ads",
    metaDesc: "Convert viewers into clients. Professional commercial video production in Hyderabad. Product videos, visual ads, and high-converting commercial reels.",
    headline: "Commercial Video Production in Hyderabad",
    subheadline: "High-Converting Product Ads & Brand Commercial Reels",
    introText: "We produce cinematic, hook-driven brand ads and product commercial videos that showcase your value proposition, build desirability, and drive direct sales.",
    benefits: [
      { title: "Scroll-Stopping Ad Hooks", desc: "Capturing the product value or main user problem within the first 1.5 seconds." },
      { title: "Macro Product Detail Capture", desc: "Stunning macro videography highlighting angles, curves, texture, and usage." },
      { title: "High-Converting Calls-to-Action", desc: "Structured end screens and caption setups that convert curiosity into checkout purchases." }
    ],
    process: [
      { step: "01", title: "Target Audit & Scripting", desc: "Analyzing buyer objections, product features, and mapping visual pacing." },
      { step: "02", title: "Cinematic Commercial Shoot", desc: "On-location capture focusing on product texture, reflections, and use." },
      { step: "03", title: "Snappy Audio Visual Edit", desc: "Beat-matching cuts, premium color grading, pop sound effects, and clean copy text overlays." },
      { step: "04", title: "Direct Conversion Launch", desc: "Adding clear purchase discounts and redirect links." }
    ],
    deliverables: [
      "Product Benefit Storyboard Drafts",
      "On-Site High-Dynamic Studio Shoot",
      "Product Macro Detailing Shots",
      "Commercial Beat Soundscapes",
      "High-Converting Ad Outros"
    ],
    pricingPlan: "Ad Scale",
    pricingPrice: "₹24,999",
    pricingFeatures: [
      "8 Product Commercial Reels / Month",
      "On-Site Product Shooting",
      "Macro Lens Detailing Focus",
      "Professional Lighting Setup",
      "Conversion Hooks Blueprint",
      "Fast 48h Delivery",
      "Unlimited Revisions"
    ],
    faqs: [
      { question: "Do you supply props or models?", answer: "We work with your team to select appropriate props and models that match your brand aesthetic." },
      { question: "Where are these shoots done?", answer: "We film in custom studio settings or on-location in Hyderabad." }
    ],
    locationKeywords: ["Hyderabad", "Gachibowli", "Madhapur", "Jubilee Hills"]
  }
};

const SEO_TARGETS_SLUGS = [
  // Tier 1: General/Commercial
  "video-production-company",
  "video-production-agency",
  "reel-making-agency",
  "reel-production-company",
  "instagram-reel-production",
  "short-form-video-agency",
  "short-form-video-production-company",
  "social-media-video-production",
  "brand-video-production",
  "product-video-production",
  "video-marketing-agency",
  "video-content-agency",
  "video-content-creation-agency",
  // Tier 2: Buying Intent
  "best-video-production-company",
  "best-reel-making-agency",
  "best-reel-production-company",
  "affordable-video-production-company",
  "professional-video-production-services",
  "premium-video-production-agency",
  "creative-video-production-company",
  "video-production-studio",
  "video-production-house",
  "video-editing-agency",
  "reels-agency",
  "video-shoot-company",
  "ad-film-production-company",
  "corporate-film-makers",
  "brand-film-agency",
  // Tier 3: Local SEO Hyderabad & Micro-Markets
  "video-production-company-hyderabad",
  "reel-making-agency-hyderabad",
  "short-form-video-agency-hyderabad",
  "video-production-company-gachibowli",
  "video-production-company-madhapur",
  "video-production-company-kondapur",
  "video-production-company-kukatpally",
  "video-production-company-jubilee-hills",
  "video-production-company-hitec-city",
  // Tier 4: Industry/Niche Pages
  "reel-production-for-restaurants",
  "reel-production-for-cafes",
  "reel-production-for-gyms",
  "reel-production-for-salons",
  "reel-production-for-doctors",
  "reel-production-for-dentists",
  "reel-production-for-builders",
  "reel-production-for-realtors",
  "reel-production-for-hotels",
  "reel-production-for-jewellery",
  "reel-production-for-fashion-brands",
  "reel-production-for-startups",
  "reel-production-for-saas-companies",
  "reel-production-for-schools",
  "reel-production-for-colleges",
  // Tier 5: Long-Tail
  "instagram-reel-maker",
  "instagram-reel-agency",
  "professional-reel-maker",
  "viral-reel-agency",
  "viral-reel-production",
  "luxury-video-production",
  "luxury-brand-video-production",
  "premium-reel-agency",
  "social-media-content-agency",
  "content-creation-agency",
  "product-shoot-agency",
  "corporate-shoot-company",
  "brand-shoot-company",
  "video-shoot-services",
  "reels-for-business",
  "business-reel-maker",
  "social-media-content-production",
];

// Helper function to resolve industry data including slug aliases
function resolveIndustryData(slug: string): IndustryData | undefined {
  if (INDUSTRIES_DATA[slug]) return INDUSTRIES_DATA[slug];

  const aliasMap: Record<string, string> = {
    "restaurant-reel-production": "restaurant-reels",
    "gym-reel-production": "gym-reels",
    "interior-design-reels": "interior-designers",
    "salon-reel-shoots": "salons",
    "fashion-brand-video-shoots": "fashion-brands",
    "real-estate-video-production": "real-estate",
    "healthcare-video-marketing": "healthcare",
    "cafe-reel-production": "cafes",
    "startup-video-agency": "startups",
    "corporate-video-production": "corporate-companies",
    "video-production-services": "video-production-services",
    "music-video-production": "music-video-production",
    "animated-video-production": "animated-video-production",
    "commercial-video-production": "commercial-video-production",
  };

  const canonicalKey = aliasMap[slug];
  if (canonicalKey && INDUSTRIES_DATA[canonicalKey]) {
    return INDUSTRIES_DATA[canonicalKey];
  }

  // Dynamic compiler for SEO campaign routes
  const lowerSlug = slug.toLowerCase();
  const isValidSEORoute = SEO_TARGETS_SLUGS.includes(slug);
  if (!isValidSEORoute) return undefined;

  // Resolve Location Details
  let locName = "Hyderabad";
  let locKeywords = ["Madhapur", "HITEC City", "Gachibowli", "Jubilee Hills"];
  
  if (lowerSlug.includes("gachibowli")) {
    locName = "Gachibowli";
    locKeywords = ["Gachibowli", "HITEC City", "Madhapur", "Hyderabad"];
  } else if (lowerSlug.includes("madhapur")) {
    locName = "Madhapur";
    locKeywords = ["Madhapur", "Jubilee Hills", "Gachibowli", "Hyderabad"];
  } else if (lowerSlug.includes("kondapur")) {
    locName = "Kondapur";
    locKeywords = ["Kondapur", "HITEC City", "Gachibowli", "Hyderabad"];
  } else if (lowerSlug.includes("kukatpally")) {
    locName = "Kukatpally";
    locKeywords = ["Kukatpally", "HITEC City", "Madhapur", "Hyderabad"];
  } else if (lowerSlug.includes("jubilee-hills")) {
    locName = "Jubilee Hills";
    locKeywords = ["Jubilee Hills", "Banjara Hills", "Madhapur", "Hyderabad"];
  } else if (lowerSlug.includes("hitec-city")) {
    locName = "HITEC City";
    locKeywords = ["HITEC City", "Madhapur", "Gachibowli", "Hyderabad"];
  }

  // Determine Niche/Base Template
  let baseKey = "video-production-services";
  
  if (lowerSlug.includes("restaurant")) baseKey = "restaurant-reels";
  else if (lowerSlug.includes("cafe")) baseKey = "cafes";
  else if (lowerSlug.includes("gym")) baseKey = "gym-reels";
  else if (lowerSlug.includes("salon")) baseKey = "salons";
  else if (lowerSlug.includes("doctor") || lowerSlug.includes("dentist")) baseKey = "healthcare";
  else if (lowerSlug.includes("builder") || lowerSlug.includes("realtor") || lowerSlug.includes("real-estate")) baseKey = "real-estate";
  else if (lowerSlug.includes("fashion") || lowerSlug.includes("jewellery")) baseKey = "fashion-brands";
  else if (lowerSlug.includes("startup") || lowerSlug.includes("saas")) baseKey = "startups";
  else if (lowerSlug.includes("corporate")) baseKey = "corporate-companies";
  else if (lowerSlug.includes("commercial")) baseKey = "commercial-video-production";
  else if (lowerSlug.includes("animated")) baseKey = "animated-video-production";
  else if (lowerSlug.includes("music")) baseKey = "music-video-production";

  const baseData = INDUSTRIES_DATA[baseKey] || INDUSTRIES_DATA["video-production-services"];

  // Format dynamic titles and headlines matching Google queries
  const titleWords = slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  const cleanTitle = titleWords.replace("For ", "for ").replace("And ", "and ");
  
  const metaTitle = `${cleanTitle} ${locName !== "Hyderabad" ? `${locName} ` : ""}Hyderabad | ReelScale`;
  const metaDesc = `ReelScale provides premium, high-retention ${cleanTitle.toLowerCase()} in ${locName}, Hyderabad. Scale your brand views and customer bookings with cinematic visual hooks.`;
  const headline = `${cleanTitle} in ${locName}`;

  return {
    ...baseData,
    slug,
    keyword: `${cleanTitle} ${locName}`,
    name: cleanTitle,
    metaTitle,
    metaDesc,
    headline,
    locationKeywords: locKeywords,
  };
}

export async function generateStaticParams() {
  const primaryKeys = Object.keys(INDUSTRIES_DATA);
  const aliases = [
    "restaurant-reel-production",
    "gym-reel-production",
    "interior-design-reels",
    "salon-reel-shoots",
    "fashion-brand-video-shoots",
    "real-estate-video-production",
    "healthcare-video-marketing",
    "cafe-reel-production",
    "startup-video-agency",
    "corporate-video-production",
    "video-production-services",
    "music-video-production",
    "animated-video-production",
    "commercial-video-production",
    ...SEO_TARGETS_SLUGS,
  ];
  return Array.from(new Set([...primaryKeys, ...aliases])).map((key) => ({
    industry: key,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ industry: string }> }): Promise<Metadata> {
  const { industry } = await params;
  const data = resolveIndustryData(industry);
  if (!data) return {};

  return {
    title: data.metaTitle,
    description: data.metaDesc,
    keywords: [data.keyword, "Reel Production Hyderabad", "Reel Making Agency Hyderabad", "Video Production Company Hyderabad"],
    alternates: {
      canonical: `https://reelscale.in/services/${data.slug}`,
    },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDesc,
      url: `https://reelscale.in/services/${data.slug}`,
      type: "website",
      siteName: "ReelScale",
      images: [
        {
          url: "https://reelscale.in/assets/logo.png",
          alt: `${data.name} - ReelScale Hyderabad`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data.metaTitle,
      description: data.metaDesc,
      images: ["https://reelscale.in/assets/logo.png"],
    },
  };
}

// Helper function to extract header/footer
function getHeaderAndFooter() {
  const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
  
  // Extract Header
  const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
  let headerHtml = headerMatch ? headerMatch[0] : "";
  
  // Extract Footer
  const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
  let footerHtml = footerMatch ? footerMatch[0] : "";

  // Rewrite assets and page paths to root absolute paths
  headerHtml = headerHtml
    .replace(/src="assets\//g, 'src="/assets/')
    .replace(/href="#/g, 'href="/#')
    .replace(/href="dashboard\/login\.html"/g, 'href="/dashboard/login"');

  footerHtml = footerHtml
    .replace(/src="assets\//g, 'src="/assets/')
    .replace(/href="#/g, 'href="/#')
    .replace(/href="dashboard\/login\.html"/g, 'href="/dashboard/login"');

  return { headerHtml, footerHtml };
}

export default async function IndustryServicePage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  const data = resolveIndustryData(industry);

  if (!data) {
    notFound();
  }

  const { headerHtml, footerHtml } = getHeaderAndFooter();

  // Custom schemas for LocalBusiness and Service
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `https://reelscale.in/services/${data.slug}#service`,
        "name": data.name,
        "serviceType": "Reel Production",
        "provider": {
          "@type": "LocalBusiness",
          "name": "ReelScale Co.",
          "url": "https://reelscale.in",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Madhapur, HITEC City",
            "addressLocality": "Hyderabad",
            "addressRegion": "Telangana",
            "postalCode": "500081",
            "addressCountry": "IN"
          }
        },
        "areaServed": data.locationKeywords.map(loc => ({
          "@type": "AdministrativeArea",
          "name": loc
        })),
        "description": data.metaDesc
      },
      {
        "@type": "FAQPage",
        "mainEntity": data.faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://reelscale.in/services/${data.slug}#breadcrumbs`,
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
            "name": "Services",
            "item": `https://reelscale.in/services/${data.slug}`
          }
        ]
      }
    ]
  };

  return (
    <div className="service-page-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <LandingInteractions />

      {/* Dynamic Header */}
      <div dangerouslySetInnerHTML={{ __html: headerHtml }} />

      {/* Main Content */}
      <main id="main-content" style={{ paddingTop: "120px" }}>
        
        {/* Hero Section */}
        <section style={{ maxWidth: "1200px", margin: "48px auto 96px", padding: "0 32px", textAlign: "center", fontFamily: "var(--primary-font)" }}>
          <div className="section-eyebrow" style={{ display: "inline-block", marginBottom: "20px", textTransform: "uppercase" }}>{data.name}</div>
          <h1 className="section-title" style={{ fontSize: "clamp(28px, 4.5vw, 48px)", lineHeight: "1.2", marginBottom: "24px" }}>
            {data.name}<br /><em>Hyderabad</em>
          </h1>
          <p className="section-sub" style={{ margin: "0 auto 40px", opacity: 1, animation: "none", maxWidth: "720px", fontSize: "var(--text-md)", lineHeight: "1.7" }}>
            {data.subheadline} — {data.introText}
          </p>
          
          <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap", marginBottom: "48px" }}>
            <a href="https://wa.me/919966239433?text=Hey%2520I%2520want%2520to%2520scale%2520our%2520content%2520creation." target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: "16px 36px" }}>
              Start your Reel
            </a>
            <Link href="/#work" className="btn-secondary" style={{ padding: "16px 36px" }}>
              View Our Work
            </Link>
          </div>

          {/* Trust Signal Badges */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "32px", flexWrap: "wrap", fontSize: "var(--text-xs)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              100M+ Organic Views Delivered
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              24-48h Fast Turnaround
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              On-Site Hyderabad Production
            </span>
          </div>

          {/* Location Keywords Pills */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "28px" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginRight: "6px" }}>Available in:</span>
            {data.locationKeywords.map((loc, idx) => (
              <span key={idx} style={{ padding: "6px 14px", borderRadius: "var(--border-radius-99)", background: "var(--white-03)", fontSize: "var(--text-xs)", color: "var(--muted)" }}>
                {loc}
              </span>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section style={{ background: "var(--bg)", padding: "112px 0" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px" }}>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <div className="section-eyebrow" style={{ textTransform: "uppercase", marginBottom: "16px" }}>Key Benefits</div>
              <h2 className="section-title" style={{ fontSize: "clamp(26px, 3.8vw, 38px)" }}>Why Choose ReelScale?</h2>
            </div>
            <div className="services-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px" }}>
              {data.benefits.map((b, idx) => (
                <div key={idx} className="service-card" style={{ opacity: 1, transform: "none", padding: "36px 32px" }}>
                  <div className="service-num" style={{ marginBottom: "20px" }}>0{idx + 1}</div>
                  <div className="service-name" style={{ marginBottom: "12px", fontSize: "var(--text-xl)" }}>{b.title}</div>
                  <p className="service-desc" style={{ lineHeight: "1.7" }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Deliverables & Process Split Section */}
        <section style={{ maxWidth: "1200px", margin: "112px auto", padding: "0 32px", fontFamily: "var(--primary-font)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "64px" }}>
            <div>
              <div className="section-eyebrow" style={{ textTransform: "uppercase", marginBottom: "16px" }}>What You Get</div>
              <h2 className="section-title" style={{ fontSize: "32px", marginBottom: "32px" }}>Deliverables</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {data.deliverables.map((item, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "var(--text-md)", color: "var(--white)" }}>
                    <span style={{ color: "var(--muted)", fontSize: "14px" }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="section-eyebrow" style={{ textTransform: "uppercase", marginBottom: "16px" }}>Our Workflow</div>
              <h2 className="section-title" style={{ fontSize: "32px", marginBottom: "32px" }}>The Production Process</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {data.process.map((p, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "20px", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ color: "var(--muted)", fontSize: "var(--text-lg)", fontWeight: "var(--fw-medium)", minWidth: "28px" }}>{p.step}</div>
                    <div>
                      <h3 style={{ color: "var(--white)", fontSize: "var(--text-lg)", margin: "0 0 6px", fontWeight: "var(--fw-medium)" }}>{p.title}</h3>
                      <p style={{ color: "var(--muted)", fontSize: "var(--text-sm)", margin: 0, lineHeight: "1.7" }}>{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Pricing Highlight */}
        <section style={{ background: "var(--bg)", padding: "112px 0" }}>
          <div style={{ maxWidth: "640px", margin: "0 auto", padding: "0 32px" }}>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <div className="section-eyebrow" style={{ textTransform: "uppercase", marginBottom: "16px" }}>Pricing Package</div>
              <h2 className="section-title" style={{ fontSize: "clamp(26px, 3.8vw, 38px)" }}>Dedicated Plan</h2>
            </div>
            <div className="pricing-card featured" style={{ margin: "0 auto", opacity: 1, transform: "none", padding: "48px 36px" }}>
              <div className="plan-name">{data.pricingPlan}</div>
              <div className="plan-price"><sup>₹</sup>{data.pricingPrice.replace("₹", "")}</div>
              <div className="plan-cadence" style={{ marginBottom: "28px" }}>per month</div>
              <div className="plan-divider" style={{ marginBottom: "28px" }}></div>
              <ul className="plan-features" style={{ marginBottom: "36px" }}>
                {data.pricingFeatures.map((f, idx) => (
                  <li key={idx} style={{ marginBottom: "14px" }}>{f}</li>
                ))}
              </ul>
              <a href="https://wa.me/919966239433?text=Hey%2520ReelScale%2C%2520I%2520want%2520to%2520book%2520the%2520package." target="_blank" rel="noopener noreferrer" className="btn-plan btn-plan-red" style={{ padding: "16px 36px" }}>
                Start your Reel
              </a>
            </div>
          </div>
        </section>

        {/* FAQs Accordion */}
        <section className="faq-section" style={{ maxWidth: "840px", margin: "112px auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-eyebrow" style={{ textTransform: "uppercase", marginBottom: "16px" }}>FAQ</span>
            <h2 className="section-title" style={{ fontSize: "clamp(26px, 3.8vw, 38px)" }}>Frequently Asked Questions</h2>
          </div>
          <div className="faq-list" style={{ opacity: 1 }}>
            {data.faqs.map((faq, idx) => (
              <div key={idx} className="faq-item" style={{ marginBottom: "16px" }}>
                <button className="faq-question" aria-expanded="false" aria-controls={`faq-ans-${idx}`} style={{ padding: "20px 0" }}>
                  <span>{faq.question}</span>
                  <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="faq-answer" id={`faq-ans-${idx}`}>
                  <div className="faq-answer-content" style={{ paddingBottom: "20px" }}>
                    <p style={{ margin: 0, lineHeight: "1.8", color: "var(--muted)", fontSize: "var(--text-md)" }}>{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dedicated Bottom Conversion CTA Section */}
        <section style={{ maxWidth: "1200px", margin: "80px auto 140px", padding: "0 32px", textAlign: "center", fontFamily: "var(--primary-font)" }}>
          <div style={{ background: "var(--white-03)", borderRadius: "var(--border-radius-1)", padding: "72px 40px" }}>
            <div className="section-eyebrow" style={{ textTransform: "uppercase", marginBottom: "20px" }}>Scale Your Brand</div>
            <h2 className="section-title" style={{ fontSize: "clamp(26px, 3.8vw, 38px)", marginBottom: "20px" }}>
              Ready to Scale Your Brand?
            </h2>
            <p className="section-sub" style={{ margin: "0 auto 40px", maxWidth: "640px", fontSize: "var(--text-md)", lineHeight: "1.7" }}>
              Book a cinematic shoot with our Hyderabad team today. We handle scriptwriting, filming, editing, and distribution.
            </p>
            <a href="https://wa.me/919966239433?text=Hey%2520ReelScale%2C%2520I%2520want%2520to%2520book%2520a%2520shoot." target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: "16px 40px" }}>
              Book a Shoot on WhatsApp
            </a>
          </div>
        </section>

      </main>

      {/* Dynamic Footer */}
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
}
