import { getPublishedBlogsAsync } from "../blog";

export interface ReelScaleUrlEntity {
  url: string;
  path: string;
  title: string;
  type: "core" | "service" | "location_service" | "blog" | "category";
  industry?: string;
  location?: string;
  keywords: string[];
}

// ─── STATIC REELSCALE SITE PAGES REGISTRY ───
export const STATIC_REELSCALE_PAGES: ReelScaleUrlEntity[] = [
  {
    url: "https://reelscale.in/",
    path: "/",
    title: "ReelScale | Shoot, Edit, Deliver Within 10 Minutes",
    type: "core",
    keywords: ["reelscale", "video production", "hyderabad", "instagram reels", "10 minute delivery", "iphone video shoot"],
  },
  {
    url: "https://reelscale.in/services",
    path: "/services",
    title: "Video Production Services & Capabilities",
    type: "service",
    keywords: ["video services", "reel production", "corporate video", "commercial video ads"],
  },
  {
    url: "https://reelscale.in/pricing",
    path: "/pricing",
    title: "Transparent Video Production Pricing Packages",
    type: "core",
    keywords: ["pricing", "packages", "cost", "monthly subscription", "reel pricing hyderabad"],
  },
  {
    url: "https://reelscale.in/about",
    path: "/about",
    title: "About ReelScale | Mobile-First On-Location Video Agency",
    type: "core",
    keywords: ["about us", "team", "on-location shooters", "hyderabad founders"],
  },
  {
    url: "https://reelscale.in/works",
    path: "/works",
    title: "Portfolio & Case Studies | ReelScale",
    type: "core",
    keywords: ["portfolio", "work samples", "case studies", "instagram results"],
  },
  {
    url: "https://reelscale.in/growth",
    path: "/growth",
    title: "Instagram Growth Strategy for Local Businesses",
    type: "service",
    keywords: ["growth", "instagram marketing", "social media reach", "view conversion"],
  },
  {
    url: "https://reelscale.in/reel-production-company-hyderabad",
    path: "/reel-production-company-hyderabad",
    title: "Reel Production Company in Hyderabad",
    type: "location_service",
    location: "Hyderabad",
    keywords: ["reel production company in hyderabad", "video makers hyderabad", "best reel agency"],
  },
  {
    url: "https://reelscale.in/reels-shoot-hyderabad",
    path: "/reels-shoot-hyderabad",
    title: "On-Location Reels Shoot in Hyderabad",
    type: "location_service",
    location: "Hyderabad",
    keywords: ["reels shoot hyderabad", "on location video shoot", "mobile videographer hyderabad"],
  },
  {
    url: "https://reelscale.in/instagram-reels-hyderabad",
    path: "/instagram-reels-hyderabad",
    title: "Instagram Reels Production in Hyderabad",
    type: "location_service",
    location: "Hyderabad",
    keywords: ["instagram reels hyderabad", "instagram video agency", "reels creators"],
  },
  {
    url: "https://reelscale.in/cafe-reels-hyderabad",
    path: "/cafe-reels-hyderabad",
    title: "Cafe & Restaurant Reels Production in Hyderabad",
    type: "location_service",
    industry: "Hospitality",
    location: "Hyderabad",
    keywords: ["cafe reels hyderabad", "restaurant video marketing", "jubilee hills cafe reels", "food videography"],
  },
  {
    url: "https://reelscale.in/real-estate-reels-hyderabad",
    path: "/real-estate-reels-hyderabad",
    title: "Real Estate & Luxury Property Reels in Hyderabad",
    type: "location_service",
    industry: "Real Estate",
    location: "Hyderabad",
    keywords: ["real estate reels hyderabad", "property video shoot", "gachibowli villa video", "builder walk-throughs"],
  },
  {
    url: "https://reelscale.in/interior-reels-hyderabad",
    path: "/interior-reels-hyderabad",
    title: "Interior Design Video Production in Hyderabad",
    type: "location_service",
    industry: "Interior Design",
    location: "Hyderabad",
    keywords: ["interior reels hyderabad", "interior design videography", "architectural walk-throughs"],
  },
  {
    url: "https://reelscale.in/corporate-reels-hyderabad",
    path: "/corporate-reels-hyderabad",
    title: "Corporate Video Production & Founder Reels in Hyderabad",
    type: "location_service",
    industry: "Corporate",
    location: "Hyderabad",
    keywords: ["corporate reels hyderabad", "founder branding video", "hitec city corporate videography"],
  },
  {
    url: "https://reelscale.in/gym-reel-production-hyderabad",
    path: "/gym-reel-production-hyderabad",
    title: "Gym & Fitness Reel Production in Hyderabad",
    type: "location_service",
    industry: "Fitness",
    location: "Hyderabad",
    keywords: ["gym reel production hyderabad", "fitness studio videos", "trainer reels"],
  },
  {
    url: "https://reelscale.in/salon-reels-hyderabad",
    path: "/salon-reels-hyderabad",
    title: "Salon, Spa & Beauty Reels Production in Hyderabad",
    type: "location_service",
    industry: "Beauty",
    location: "Hyderabad",
    keywords: ["salon reels hyderabad", "beauty salon videographer", "spa instagram marketing"],
  },
];

export async function getAllValidReelScaleUrls(): Promise<ReelScaleUrlEntity[]> {
  const urls: ReelScaleUrlEntity[] = [...STATIC_REELSCALE_PAGES];

  try {
    const publishedBlogs = await getPublishedBlogsAsync();
    const categoriesSet = new Set<string>();

    for (const blog of publishedBlogs) {
      if (blog.slug) {
        urls.push({
          url: `https://reelscale.in/blog/${blog.slug}`,
          path: `/blog/${blog.slug}`,
          title: blog.title,
          type: "blog",
          industry: blog.category,
          keywords: [
            blog.focusKeyword || "",
            blog.slug.replace(/-/g, " "),
            ...(blog.tags || []),
          ].filter(Boolean),
        });
      }

      if (blog.category) {
        categoriesSet.add(blog.category.toLowerCase());
      }
    }

    for (const cat of categoriesSet) {
      urls.push({
        url: `https://reelscale.in/blog/category/${encodeURIComponent(cat)}`,
        path: `/blog/category/${encodeURIComponent(cat)}`,
        title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Blogs & Guides`,
        type: "category",
        industry: cat,
        keywords: [`${cat} reels`, `${cat} video production`, `${cat} articles`],
      });
    }
  } catch (err) {
    console.warn("Error fetching dynamic published blogs for URL registry:", err);
  }

  return urls;
}

export function isValidReelScaleUrl(testUrl: string, knownUrls: ReelScaleUrlEntity[]): boolean {
  try {
    const cleanTest = testUrl.trim().toLowerCase().replace(/\/$/, "");
    return knownUrls.some((u) => {
      const uFull = u.url.toLowerCase().replace(/\/$/, "");
      const uPath = u.path.toLowerCase().replace(/\/$/, "");
      return cleanTest === uFull || cleanTest === uPath;
    });
  } catch {
    return false;
  }
}
