import { cache } from 'react';
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
  LANDING_PAGE_QUERY,
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
];

// Fallback testimonials
export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    _id: 'testi-jak',
    name: 'Jak',
    role: 'CEO, Jak Interiors',
    company: 'Jak Interiors',
    quote:
      "Working with ReelScale CO has completely changed how we present our villa projects online. Their team captured every detail beautifully and delivered premium-quality reels that truly reflect our craftsmanship. We've received significantly more inquiries and stronger engagement since partnering with them.",
    stars: 5,
    result: '4.2x',
    resultLabel: 'Engagement Lift',
    avatarInitials: 'JI',
    order: 1,
  },
  {
    _id: 'testi-parthu',
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

// Fallback Page SEO
export const DEFAULT_PAGE_SEO: Record<string, PageSeo> = {
  home: {
    _id: 'seo-home',
    pageId: 'home',
    title: 'Home Page SEO',
    metaTitle: 'Reel Production Company & Video Editing Services in Hyderabad | ReelScale',
    metaDescription: 'ReelScale is the leading agency for professional reel production and video editing services in Hyderabad. We produce high-retention corporate reels, gym promos, cafe videos, and brand ads in Madhapur, Hitech City, Gachibowli, and Banjara Hills.',
    focusKeyword: 'reel production company Hyderabad',
    keywords: [
      'reel production company Hyderabad',
      'reel production Hyderabad',
      'reel production services Hyderabad',
      'reel shoot Hyderabad',
      'reels shoot Hyderabad',
      'Instagram reel production Hyderabad',
      'Instagram reels production company Hyderabad',
      'video production company Hyderabad',
      'video production services Hyderabad',
      'video editing company Hyderabad',
      'video editing services Hyderabad',
      'social media video production Hyderabad',
      'short form video production Hyderabad',
      'commercial video production Hyderabad'
    ],
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
    focusKeyword: 'reel production packages pricing Hyderabad',
    keywords: [
      'reel production cost Hyderabad',
      'video editing packages Hyderabad',
      'reel shoot pricing Hyderabad',
      'reels production cost',
      'Instagram reel pricing plans'
    ],
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
    focusKeyword: 'reels portfolio video production Hyderabad',
    keywords: [
      'reel production case studies',
      'reels portfolio Hyderabad',
      'Instagram reel examples Hyderabad',
      'brand reel examples',
      'video production portfolio'
    ],
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
    focusKeyword: 'reel production agency Hyderabad team',
    keywords: [
      'about ReelScale',
      'video production company founders Hyderabad',
      'short form video team Hyderabad',
      'best reel creators Hyderabad'
    ],
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
    focusKeyword: 'social growth agency Hyderabad Instagram reels',
    keywords: [
      'social media marketing agency Hyderabad',
      'Instagram growth agency Hyderabad',
      'Meta ads management Hyderabad',
      'viral reels strategy agency'
    ],
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
    const data = await client.fetch(SITE_SETTINGS_QUERY, {}, { next: { revalidate: 60 } });
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
    const plans: PricingPlan[] = await client.fetch(PRICING_PLANS_QUERY, {}, { next: { revalidate: 60 } });
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
 * Escape HTML special characters for safe string interpolation
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Renders the HTML cards for testimonials
 */
export function renderTestimonialCardsHtml(testimonials: Testimonial[]): string {
  return testimonials
    .map((t) => {
      const starCount = Math.min(5, Math.max(1, t.stars || 5));
      const starsHtml = Array.from({ length: starCount })
        .map(
          () =>
            `<img src="/assets/icons/star-f.svg" alt="Star Rating Icon" width="16" height="16" loading="lazy" />`
        )
        .join('\n          ');

      const cleanQuote = escapeHtml(
        (t.quote || '').trim().replace(/^["'“”]+|["'“”]+$/g, '')
      );
      const name = escapeHtml(t.name || '');
      const role = escapeHtml(t.role || t.company || '');
      const resultHtml = t.result
        ? `<div class="testi-result">${escapeHtml(t.result)}</div>`
        : '';
      const resultLabelHtml = t.resultLabel
        ? `<div class="testi-result-label">${escapeHtml(t.resultLabel)}</div>`
        : '';

      let avatarHtml = '';
      if (t.avatarImageUrl) {
        avatarHtml = `<div class="testi-avatar" style="overflow:hidden; padding:0;"><img src="${escapeHtml(
          t.avatarImageUrl
        )}" alt="${name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" loading="lazy" /></div>`;
      } else {
        const initials = escapeHtml(
          t.avatarInitials ||
            name
              .split(' ')
              .filter(Boolean)
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() ||
            'RS'
        );
        avatarHtml = `<div class="testi-avatar">${initials}</div>`;
      }

      return `
      <div class="testi-card">
        <div class="testi-stars">
          ${starsHtml}
        </div>
        <p class="testi-quote">"${cleanQuote}"</p>
        ${resultHtml}
        ${resultLabelHtml}
        <div class="testi-divider"></div>
        <div class="testi-author">
          ${avatarHtml}
          <div>
            <div class="testi-name">${name}</div>
            <div class="testi-role">${role}</div>
          </div>
        </div>
      </div>`;
    })
    .join('');
}

/**
 * Renders the full #testimonials section HTML
 */
export function renderTestimonialsSectionHtml(testimonials: Testimonial[]): string {
  const cardsHtml = renderTestimonialCardsHtml(testimonials);
  const signature = escapeHtml(
    JSON.stringify(
      testimonials.map((t) => [
        t._id,
        t.quote,
        t.name,
        t.role,
        t.stars,
        t.result,
        t.avatarImageUrl,
        t.avatarInitials,
      ])
    )
  );
  return `
  <!-- TESTIMONIALS -->
  <section id="testimonials">
    <div style="text-align:center" class="reveal">
      <div class="section-eyebrow">Client Results</div>
      <h2 class="section-title">Real brands.<br>Real growth.</h2>
    </div>
    <div class="testi-grid reveal" data-sanity-synced="${signature}">
      ${cardsHtml}
    </div>
  </section>`;
}

export interface LandingPageData {
  seo: PageSeo;
  pricingPlans: PricingPlan[];
  testimonials: Testimonial[];
  latestPosts: any[];
}

/**
 * Fetch ALL landing page data in a SINGLE GROQ query (SEO, pricing plans, testimonials, latest posts).
 * Wrapped in React cache() so generateMetadata and Page execution deduplicate into exactly ONE request.
 */
export const getLandingPageData = cache(async (): Promise<LandingPageData> => {
  try {
    const data = await client.fetch(
      LANDING_PAGE_QUERY,
      {},
      { next: { revalidate: 60, tags: ['landing', 'testimonials', 'pricing', 'posts'] } }
    );

    return {
      seo: data?.seo?.metaTitle ? data.seo : DEFAULT_PAGE_SEO.home,
      pricingPlans:
        Array.isArray(data?.pricingPlans) && data.pricingPlans.length > 0
          ? data.pricingPlans
          : DEFAULT_PRICING_PLANS.filter((p) => p.category === 'reel-production'),
      testimonials:
        Array.isArray(data?.testimonials) && data.testimonials.length > 0
          ? data.testimonials
          : DEFAULT_TESTIMONIALS,
      latestPosts: Array.isArray(data?.latestPosts) ? data.latestPosts : [],
    };
  } catch (error) {
    console.warn('[CMS] Failed to fetch landing page data from Sanity, using fallback:', error);
    return {
      seo: DEFAULT_PAGE_SEO.home,
      pricingPlans: DEFAULT_PRICING_PLANS.filter((p) => p.category === 'reel-production'),
      testimonials: DEFAULT_TESTIMONIALS,
      latestPosts: [],
    };
  }
});

/**
 * Fetch testimonials
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const list: Testimonial[] = await client.fetch(
      TESTIMONIALS_QUERY,
      {},
      { next: { revalidate: 60, tags: ['testimonials'] } }
    );
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
    const seo: PageSeo = await client.fetch(PAGE_SEO_QUERY, { pageId }, { next: { revalidate: 60 } });
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
    const list: ServiceItem[] = await client.fetch(SERVICES_QUERY, {}, { next: { revalidate: 60 } });
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
    const service: ServiceItem = await client.fetch(SERVICE_BY_SLUG_QUERY, { slug }, { next: { revalidate: 60 } });
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
    const list: LocationPageItem[] = await client.fetch(LOCATION_PAGES_QUERY, {}, { next: { revalidate: 60 } });
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
    const page: LocationPageItem = await client.fetch(LOCATION_PAGE_BY_SLUG_QUERY, { slug }, { next: { revalidate: 60 } });
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
    const reels: ReelItem[] = await client.fetch(REELS_QUERY, {}, { next: { revalidate: 60 } });
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
    const posts = await client.fetch(POSTS_QUERY, {}, { next: { revalidate: 60 } });
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
    const post = await client.fetch(POST_BY_SLUG_QUERY, { slug }, { next: { revalidate: 60 } });
    if (post && post._id) return post;
  } catch (error) {
    console.warn(`[CMS] Failed to fetch post ${slug} from Sanity:`, error);
  }
  return null;
}
