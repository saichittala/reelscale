export interface Benefit {
  title: string;
  desc: string;
}

export interface ProcessStep {
  step: string;
  title: string;
  desc: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SiteSettings {
  _id: string;
  siteName: string;
  siteUrl: string;
  tagline?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: {
    street?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  headerNav?: NavItem[];
  footerNav?: NavItem[];
  socialLinks?: SocialLink[];
}

export interface PricingPlan {
  _id: string;
  title: string;
  slug: { current: string };
  category: 'reel-production' | 'growth';
  price: string;
  numericPrice?: number;
  currency?: string;
  cadence?: string;
  tier?: 'starter' | 'growth' | 'scale' | 'custom';
  featured?: boolean;
  features?: string[];
  ctaText?: string;
  ctaLink?: string;
  order?: number;
}

export interface Testimonial {
  _id: string;
  name: string;
  role?: string;
  company?: string;
  quote: string;
  stars?: number;
  result?: string;
  resultLabel?: string;
  avatarInitials?: string;
  avatarImageUrl?: string;
  order?: number;
}

export interface PageSeo {
  _id: string;
  pageId: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  noIndex?: boolean;
  structuredData?: string;
}

export interface ServiceItem {
  _id: string;
  title: string;
  slug: { current: string };
  keyword?: string;
  headline?: string;
  subheadline?: string;
  introText?: string;
  benefits?: Benefit[];
  process?: ProcessStep[];
  deliverables?: string[];
  pricingPlan?: string;
  pricingPrice?: string;
  pricingFeatures?: string[];
  faqs?: FAQItem[];
  locationKeywords?: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogImageUrl?: string;
    noIndex?: boolean;
  };
}

export interface LocationPageItem {
  _id: string;
  title: string;
  slug: { current: string };
  location: string;
  category?: string;
  headline?: string;
  subheadline?: string;
  introText?: string;
  benefits?: Benefit[];
  process?: ProcessStep[];
  deliverables?: string[];
  pricingPlan?: string;
  pricingPrice?: string;
  pricingFeatures?: string[];
  faqs?: FAQItem[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogImageUrl?: string;
    noIndex?: boolean;
  };
}

export interface ReelItem {
  _id: string;
  client: string;
  stat?: string;
  videoUrl?: string;
  videoFileUrl?: string;
  posterImageUrl?: string;
  order?: number;
}
