import { client } from '../sanity/client';
import {
  SITE_SETTINGS_QUERY,
  PRICING_PLANS_QUERY,
  TESTIMONIALS_QUERY,
  PAGE_SEO_QUERY,
  SERVICES_QUERY,
  SERVICE_BY_SLUG_QUERY,
  LOCATION_PAGES_QUERY,
  LOCATION_PAGE_BY_SLUG_QUERY,
  POSTS_QUERY,
  POST_BY_SLUG_QUERY,
  REELS_QUERY,
} from '../sanity/queries';
import type {
  SiteSettings,
  PricingPlan,
  Testimonial,
  PageSeo,
  ServiceItem,
  LocationPageItem,
  ReelItem,
} from '../sanity/types';

// Fallback site settings
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  _id: 'siteSettings',
  siteName: 'ReelScale',
  siteUrl: 'https://reelscale.in',
  tagline: 'Short-Form Video Production & Instagram Reels Agency in Hyderabad',
  phone: '+91 99662 39433',
  whatsapp: '919966239433',
  email: 'contact@reelscale.in',
  address: {
    street: 'Madhapur, HITEC City',
    locality: 'Hyderabad',
    region: 'Telangana',
    postalCode: '500081',
    country: 'IN',
  },
  headerNav: [
    { label: 'Work', href: '/works', isExternal: false },
    { label: 'Services', href: '/services/restaurant-reels', isExternal: false },
    { label: 'Pricing', href: '/pricing', isExternal: false },
    { label: 'Growth', href: '/growth', isExternal: false },
    { label: 'About', href: '/about', isExternal: false },
    { label: 'Blog', href: '/blog', isExternal: false },
  ],
  footerNav: [
    { label: 'Home', href: '/', isExternal: false },
    { label: 'Work', href: '/works', isExternal: false },
    { label: 'Pricing', href: '/pricing', isExternal: false },
    { label: 'Growth', href: '/growth', isExternal: false },
    { label: 'About', href: '/about', isExternal: false },
    { label: 'Blog', href: '/blog', isExternal: false },
  ],
  socialLinks: [
    { platform: 'Instagram', url: 'https://instagram.com/reelscale' },
    { platform: 'WhatsApp', url: 'https://wa.me/919966239433' },
  ],
};

// Fallback pricing plans
export const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    _id: 'plan-plus',
    title: 'Plus',
    slug: { current: 'plus' },
    category: 'reel-production',
    price: '14,499',
    numericPrice: 14499,
    currency: '₹',
    cadence: 'per month',
    tier: 'starter',
    featured: false,
    order: 1,
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
  },
  {
    _id: 'plan-pro',
    title: 'Pro',
    slug: { current: 'pro' },
    category: 'reel-production',
    price: '19,999',
    numericPrice: 19999,
    currency: '₹',
    cadence: 'per month',
    tier: 'growth',
    featured: true,
    order: 2,
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
  },
  {
    _id: 'plan-luxe',
    title: 'Luxe',
    slug: { current: 'luxe' },
    category: 'reel-production',
    price: '27,999',
    numericPrice: 27999,
    currency: '₹',
    cadence: 'per month',
    tier: 'scale',
    featured: false,
    order: 3,
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
  },
  {
    _id: 'plan-growth-starter',
    title: 'Presence',
    slug: { current: 'growth-starter' },
    category: 'growth',
    price: '14,999',
    numericPrice: 14999,
    currency: '₹',
    cadence: 'per month',
    tier: 'starter',
    featured: false,
    order: 4,
    features: [
      '4 Premium Reels / Month',
      '4 Social Media Posts',
      '1 Content Shoot / Month',
      'Content Planning',
      'Professional Reel Editing',
      'Captions + CTAs',
      'Instagram Posting',
      'Basic Monthly Report',
    ],
    ctaText: 'Select Presence Plan',
    ctaLink: "https://wa.me/919966239433?text=Hello%20ReelScale%20Growth%2C%20I%27d%20like%20to%20get%20started%20with%20the%20Presence%20plan.",
  },
  {
    _id: 'plan-growth-scale',
    title: 'Growth',
    slug: { current: 'growth-scale' },
    category: 'growth',
    price: '24,999',
    numericPrice: 24999,
    currency: '₹',
    cadence: 'per month',
    tier: 'growth',
    featured: true,
    order: 5,
    features: [
      '6 Premium Reels / Month',
      '6 Social Media Posts',
      '1 Content Shoot / Month',
      'Content Strategy',
      'Professional Reel Editing',
      'Hooks + Captions + CTAs',
      'Instagram Page Management',
      'Posting & Scheduling',
      'Profile Optimization',
      'Meta Ads Management',
      'Campaign Optimization',
      'Monthly Performance Report',
    ],
    ctaText: 'Select Growth Plan',
    ctaLink: "https://wa.me/919966239433?text=Hello%20ReelScale%20Growth%2C%20I%27d%20like%20to%20get%20started%20with%20the%20Growth%20plan.",
  },
  {
    _id: 'plan-market-leader',
    title: 'Scale',
    slug: { current: 'market-leader' },
    category: 'growth',
    price: '34,999',
    numericPrice: 34999,
    currency: '₹',
    cadence: 'per month',
    tier: 'scale',
    featured: false,
    order: 6,
    features: [
      '10 Premium Reels / Month',
      '8 Social Media Posts',
      '2 Content Shoots / Month',
      'Advanced Content Strategy',
      'Professional Editing',
      'Hooks + Captions + CTAs',
      'Complete Instagram Management',
      'Content Calendar',
      'Meta Ads Management',
      'Multiple Campaign Management',
      'Creative Testing',
      'Monthly Growth Report',
      'Priority Support',
    ],
    ctaText: 'Select Scale Plan',
    ctaLink: "https://wa.me/919966239433?text=Hello%20ReelScale%20Growth%2C%20I%27d%20like%20to%20get%20started%20with%20the%20Scale%20plan.",
  },
];

// Fallback testimonials
export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    _id: 'test-1',
    name: 'Ravinder',
    role: 'Founder',
    company: 'Monty Interiors',
    quote: 'ReelScale completely revolutionized our interior design lead flow. Their cinematic reels hit 100k+ organic views and brought qualified villa inquiries within weeks.',
    stars: 5,
    result: '4.2x',
    resultLabel: 'Inquiry Growth',
    avatarInitials: 'RI',
    order: 1,
  },
  {
    _id: 'test-2',
    name: 'Manish Harwani',
    role: 'Managing Partner',
    company: 'Nex Arena',
    quote: 'The production quality, quick shoot turnarounds, and creative pacing set ReelScale apart from any traditional video agency in Hyderabad.',
    stars: 5,
    result: '120k+',
    resultLabel: 'Organic Reach',
    avatarInitials: 'MH',
    order: 2,
  },
  {
    _id: 'test-3',
    name: 'Parthu',
    role: 'Creative Director',
    company: 'Parthu Interiors Design',
    quote: 'Professional, reliable, and obsessed with viewer retention. You do not just get videos; you get real brand authority and customer engagement.',
    stars: 5,
    result: '85k+',
    resultLabel: 'Profile Visits',
    avatarInitials: 'PI',
    order: 3,
  },
];

// Fallback Page SEO
export const DEFAULT_PAGE_SEO: Record<string, PageSeo> = {
  home: {
    _id: 'seo-home',
    pageId: 'home',
    title: 'Home Page SEO',
    metaTitle: 'Reel Production Company & Video Editing Services in Hyderabad | ReelScale',
    metaDescription: 'ReelScale is the leading agency for professional reel production and video editing services in Hyderabad. We produce high-retention corporate reels, gym promos, cafe videos, and brand ads in Madhapur, Hitech City, Gachibowli, and Banjara Hills.',
    canonicalUrl: 'https://reelscale.in',
    ogTitle: 'Reel Production Company & Video Editing Services in Hyderabad | ReelScale',
    ogDescription: 'ReelScale is the leading agency for professional reel production and video editing services in Hyderabad.',
    ogImageUrl: 'https://reelscale.in/assets/logo.png',
  },
  pricing: {
    _id: 'seo-pricing',
    pageId: 'pricing',
    title: 'Pricing Page SEO',
    metaTitle: 'Pricing Plans | ReelScale — Simple & Scalable Video Production Cost',
    metaDescription: "Explore transparent pricing packages for professional reels shoots and video editing services in Hyderabad. Scale your brand's social media presence with no hidden costs.",
    canonicalUrl: 'https://reelscale.in/pricing',
    ogTitle: 'Pricing Plans | ReelScale — Simple & Scalable Video Production Cost',
    ogDescription: "Explore transparent pricing packages for professional reels shoots and video editing services in Hyderabad.",
    ogImageUrl: 'https://reelscale.in/assets/logo.png',
  },
  works: {
    _id: 'seo-works',
    pageId: 'works',
    title: 'Works Page SEO',
    metaTitle: 'Our Portfolio & Reels Case Studies | ReelScale Hyderabad',
    metaDescription: 'Watch premium cinematic Instagram Reels, brand videos, and commercial campaigns created by ReelScale in Hyderabad. View our high-retention video production portfolio.',
    canonicalUrl: 'https://reelscale.in/works',
    ogTitle: 'Our Portfolio & Reels Case Studies | ReelScale Hyderabad',
    ogDescription: 'Watch premium cinematic Instagram Reels, brand videos, and commercial campaigns created by ReelScale in Hyderabad.',
    ogImageUrl: 'https://reelscale.in/assets/logo.png',
  },
  about: {
    _id: 'seo-about',
    pageId: 'about',
    title: 'About Page SEO',
    metaTitle: 'About Us | ReelScale — Short-Form Video Production Agency in Hyderabad',
    metaDescription: 'Discover the team behind ReelScale, a leading reel shoot and video editing agency in Hyderabad. We write, film, and edit cinematic Instagram Reels and commercial videos that build authority and drive leads organically.',
    canonicalUrl: 'https://reelscale.in/about',
    ogTitle: 'About Us | ReelScale — Short-Form Video Production Agency in Hyderabad',
    ogDescription: 'Discover the team behind ReelScale, a leading reel shoot and video editing agency in Hyderabad.',
    ogImageUrl: 'https://reelscale.in/assets/logo.png',
  },
  growth: {
    _id: 'seo-growth',
    pageId: 'growth',
    title: 'Growth Agency Page SEO',
    metaTitle: 'Social Growth Agency in Hyderabad | ReelScale — Instagram Growth & Reels Strategy',
    metaDescription: 'Transform short-form video views into real business revenue. ReelScale is Hyderabad’s premier social growth agency helping brands scale organically with high-retention reels.',
    canonicalUrl: 'https://reelscale.in/growth',
    ogTitle: 'Social Growth Agency in Hyderabad | ReelScale — Instagram Growth & Reels Strategy',
    ogDescription: 'Transform short-form video views into real business revenue with ReelScale.',
    ogImageUrl: 'https://reelscale.in/assets/logo.png',
  },
};

/**
 * Fetch global site settings
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const data = await client.fetch(SITE_SETTINGS_QUERY);
    if (data && data._id) return data;
  } catch (error) {
    console.warn('[CMS] Failed to fetch siteSettings from Sanity, using fallback:', error);
  }
  return DEFAULT_SITE_SETTINGS;
}

/**
 * Fetch pricing plans (optionally filtered by category)
 */
export async function getPricingPlans(category?: 'reel-production' | 'growth'): Promise<PricingPlan[]> {
  try {
    const plans: PricingPlan[] = await client.fetch(PRICING_PLANS_QUERY);
    if (Array.isArray(plans) && plans.length > 0) {
      if (category) {
        return plans.filter((p) => p.category === category);
      }
      return plans;
    }
  } catch (error) {
    console.warn('[CMS] Failed to fetch pricingPlans from Sanity, using fallback:', error);
  }
  if (category) {
    return DEFAULT_PRICING_PLANS.filter((p) => p.category === category);
  }
  return DEFAULT_PRICING_PLANS;
}

/**
 * Fetch testimonials
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const list: Testimonial[] = await client.fetch(TESTIMONIALS_QUERY);
    if (Array.isArray(list) && list.length > 0) return list;
  } catch (error) {
    console.warn('[CMS] Failed to fetch testimonials from Sanity, using fallback:', error);
  }
  return DEFAULT_TESTIMONIALS;
}

/**
 * Fetch page-specific SEO data
 */
export async function getPageSeo(pageId: string): Promise<PageSeo> {
  try {
    const seo: PageSeo = await client.fetch(PAGE_SEO_QUERY, { pageId });
    if (seo && seo.metaTitle) return seo;
  } catch (error) {
    console.warn(`[CMS] Failed to fetch pageSeo for ${pageId} from Sanity, using fallback:`, error);
  }
  return DEFAULT_PAGE_SEO[pageId] || {
    _id: `fallback-${pageId}`,
    pageId,
    title: 'ReelScale',
    metaTitle: 'ReelScale — Reel Production Company & Video Editing Services Hyderabad',
    metaDescription: 'Professional reel production, commercial video shoots, and Instagram growth in Hyderabad.',
    canonicalUrl: `https://reelscale.in/${pageId === 'home' ? '' : pageId}`,
    ogImageUrl: 'https://reelscale.in/assets/logo.png',
  };
}

/**
 * Fetch all services
 */
export async function getServices(): Promise<ServiceItem[]> {
  try {
    const list: ServiceItem[] = await client.fetch(SERVICES_QUERY);
    if (Array.isArray(list) && list.length > 0) return list;
  } catch (error) {
    console.warn('[CMS] Failed to fetch services from Sanity:', error);
  }
  return [];
}

/**
 * Fetch single service by slug
 */
export async function getServiceBySlug(slug: string): Promise<ServiceItem | null> {
  try {
    const service: ServiceItem = await client.fetch(SERVICE_BY_SLUG_QUERY, { slug });
    if (service && service._id) return service;
  } catch (error) {
    console.warn(`[CMS] Failed to fetch service ${slug} from Sanity:`, error);
  }
  return null;
}

/**
 * Fetch all location pages
 */
export async function getLocationPages(): Promise<LocationPageItem[]> {
  try {
    const list: LocationPageItem[] = await client.fetch(LOCATION_PAGES_QUERY);
    if (Array.isArray(list) && list.length > 0) return list;
  } catch (error) {
    console.warn('[CMS] Failed to fetch locationPages from Sanity:', error);
  }
  return [];
}

/**
 * Fetch single location page by slug
 */
export async function getLocationPageBySlug(slug: string): Promise<LocationPageItem | null> {
  try {
    const page: LocationPageItem = await client.fetch(LOCATION_PAGE_BY_SLUG_QUERY, { slug });
    if (page && page._id) return page;
  } catch (error) {
    console.warn(`[CMS] Failed to fetch locationPage ${slug} from Sanity:`, error);
  }
  return null;
}

/**
 * Fetch portfolio reels
 */
export async function getReels(): Promise<ReelItem[]> {
  try {
    const reels: ReelItem[] = await client.fetch(REELS_QUERY);
    if (Array.isArray(reels) && reels.length > 0) return reels;
  } catch (error) {
    console.warn('[CMS] Failed to fetch reels from Sanity:', error);
  }
  return [];
}

/**
 * Fetch blog posts
 */
export async function getPosts(): Promise<any[]> {
  try {
    const posts = await client.fetch(POSTS_QUERY);
    if (Array.isArray(posts) && posts.length > 0) return posts;
  } catch (error) {
    console.warn('[CMS] Failed to fetch posts from Sanity:', error);
  }
  return [];
}

/**
 * Fetch single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<any | null> {
  try {
    const post = await client.fetch(POST_BY_SLUG_QUERY, { slug });
    if (post && post._id) return post;
  } catch (error) {
    console.warn(`[CMS] Failed to fetch post ${slug} from Sanity:`, error);
  }
  return null;
}
