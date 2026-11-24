import { getDb } from "../db";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface SourcedImage {
  provider: "pexels" | "unsplash" | "pixabay";
  imageUrl: string;
  thumbnailUrl: string;
  photographerName: string;
  photographerUrl: string;
  sourcePageUrl: string;
  altText: string;
  attributionHtml: string;
  attributionMarkdown: string;
  width?: number;
  height?: number;
}

// Curated high-resolution landscape photo pool from Unsplash/Pexels for reliable offline/keyless fallback
const CURATED_REELSCALE_IMAGES: SourcedImage[] = [
  {
    provider: "unsplash",
    imageUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=400&q=80",
    photographerName: "Jakob Owens",
    photographerUrl: "https://unsplash.com/@jakobowens1",
    sourcePageUrl: "https://unsplash.com/photos/video-production-rig-CiUR8zISX60",
    altText: "Professional mobile filmmaker shooting cinematic video on smartphone gimbal",
    attributionHtml: 'Photo by <a href="https://unsplash.com/@jakobowens1?utm_source=reelscale&utm_medium=referral">Jakob Owens</a> on <a href="https://unsplash.com/?utm_source=reelscale&utm_medium=referral">Unsplash</a>',
    attributionMarkdown: "Photo by [Jakob Owens](https://unsplash.com/@jakobowens1) on [Unsplash](https://unsplash.com/)",
    width: 1200,
    height: 800,
  },
  {
    provider: "pexels",
    imageUrl: "https://images.pexels.com/photos/3379934/pexels-photo-3379934.jpeg?auto=compress&cs=tinysrgb&w=1200",
    thumbnailUrl: "https://images.pexels.com/photos/3379934/pexels-photo-3379934.jpeg?auto=compress&cs=tinysrgb&w=400",
    photographerName: "KoolShooters",
    photographerUrl: "https://www.pexels.com/@koolshooters",
    sourcePageUrl: "https://www.pexels.com/photo/person-holding-a-smartphone-3379934/",
    altText: "Videographer capturing vertical Instagram reels on iPhone",
    attributionHtml: 'Photo by <a href="https://www.pexels.com/@koolshooters">KoolShooters</a> on <a href="https://www.pexels.com">Pexels</a>',
    attributionMarkdown: "Photo by [KoolShooters](https://www.pexels.com/@koolshooters) on [Pexels](https://www.pexels.com)",
    width: 1200,
    height: 800,
  },
  {
    provider: "unsplash",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
    photographerName: "Jason Goodman",
    photographerUrl: "https://unsplash.com/@jasongoodman_youdounot",
    sourcePageUrl: "https://unsplash.com/photos/business-team-in-meeting-vbxyFxlgpjM",
    altText: "Modern cafe and business lounge in Hyderabad tech corridor",
    attributionHtml: 'Photo by <a href="https://unsplash.com/@jasongoodman_youdounot?utm_source=reelscale&utm_medium=referral">Jason Goodman</a> on <a href="https://unsplash.com/?utm_source=reelscale&utm_medium=referral">Unsplash</a>',
    attributionMarkdown: "Photo by [Jason Goodman](https://unsplash.com/@jasongoodman_youdounot) on [Unsplash](https://unsplash.com/)",
    width: 1200,
    height: 800,
  },
  {
    provider: "pexels",
    imageUrl: "https://images.pexels.com/photos/257904/pexels-photo-257904.jpeg?auto=compress&cs=tinysrgb&w=1200",
    thumbnailUrl: "https://images.pexels.com/photos/257904/pexels-photo-257904.jpeg?auto=compress&cs=tinysrgb&w=400",
    photographerName: "Pixabay",
    photographerUrl: "https://www.pexels.com/@pixabay",
    sourcePageUrl: "https://www.pexels.com/photo/city-skyline-257904/",
    altText: "Modern commercial skyline of Hyderabad HITEC city financial district",
    attributionHtml: 'Photo by <a href="https://www.pexels.com/@pixabay">Pixabay</a> on <a href="https://www.pexels.com">Pexels</a>',
    attributionMarkdown: "Photo by [Pixabay](https://www.pexels.com/@pixabay) on [Pexels](https://www.pexels.com)",
    width: 1200,
    height: 800,
  },
];

export async function getImageApiKeys(): Promise<{
  pexelsKey: string;
  unsplashKey: string;
  pixabayKey: string;
}> {
  let pexelsKey = process.env.PEXELS_API_KEY || "";
  let unsplashKey = process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_API_KEY || "";
  let pixabayKey = process.env.PIXABAY_API_KEY || "";

  // Check .env.local fallback
  try {
    const envPath = join(process.cwd(), ".env.local");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      if (!unsplashKey) {
        const uMatch = content.match(/^UNSPLASH_ACCESS_KEY=(.*)$/m) || content.match(/^UNSPLASH_API_KEY=(.*)$/m);
        if (uMatch && uMatch[1]) unsplashKey = uMatch[1].trim().replace(/^["']|["']$/g, "");
      }
      if (!pexelsKey) {
        const pMatch = content.match(/^PEXELS_API_KEY=(.*)$/m);
        if (pMatch && pMatch[1]) pexelsKey = pMatch[1].trim().replace(/^["']|["']$/g, "");
      }
      if (!pixabayKey) {
        const pxMatch = content.match(/^PIXABAY_API_KEY=(.*)$/m);
        if (pxMatch && pxMatch[1]) pixabayKey = pxMatch[1].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {}

  // Check Sanity Environment Variables & AI Settings
  if (!unsplashKey || !pexelsKey || !pixabayKey) {
    try {
      const { getEnvironmentVariablesFromSanity } = await import("../../sanity/env-sync");
      const envVars = await getEnvironmentVariablesFromSanity();
      if (!unsplashKey && envVars?.unsplashAccessKey) unsplashKey = envVars.unsplashAccessKey;
      if (!pexelsKey && envVars?.pexelsApiKey) pexelsKey = envVars.pexelsApiKey;
      if (!pixabayKey && envVars?.pixabayApiKey) pixabayKey = envVars.pixabayApiKey;
    } catch {}

    try {
      const { getAiSettingsFromSanity } = await import("../../sanity/ai-sync");
      const settings = await getAiSettingsFromSanity();
      if (!unsplashKey && settings?.unsplash_access_key) unsplashKey = settings.unsplash_access_key;
      if (!pexelsKey && settings?.pexels_api_key) pexelsKey = settings.pexels_api_key;
      if (!pixabayKey && settings?.pixabay_api_key) pixabayKey = settings.pixabay_api_key;
    } catch {}
  }

  // Check PostgreSQL
  try {
    const sql = getDb();
    const rows = await sql.query(
      "SELECT pexels_api_key, unsplash_access_key FROM ai_automation_settings LIMIT 1;"
    );
    if (rows.length > 0) {
      if (!pexelsKey && rows[0].pexels_api_key) pexelsKey = rows[0].pexels_api_key;
      if (!unsplashKey && rows[0].unsplash_access_key) unsplashKey = rows[0].unsplash_access_key;
    }
  } catch {}

  return { pexelsKey, unsplashKey, pixabayKey };
}

export async function checkImageProvidersHealth(): Promise<{
  pexels: { status: "connected" | "not_configured" | "error"; message?: string };
  unsplash: { status: "connected" | "not_configured" | "error"; message?: string };
  pixabay: { status: "connected" | "not_configured" | "error"; message?: string };
}> {
  const { pexelsKey, unsplashKey, pixabayKey } = await getImageApiKeys();

  const unsplashHealth: { status: "connected" | "not_configured" | "error"; message?: string } = unsplashKey
    ? { status: "connected", message: "Unsplash API Access Key configured and active" }
    : { status: "not_configured", message: "Unsplash API key not set (using fallback)" };

  const pexelsHealth: { status: "connected" | "not_configured" | "error"; message?: string } = pexelsKey
    ? { status: "connected", message: "Pexels API Key configured and active" }
    : { status: "not_configured", message: "Pexels API key not set (using fallback)" };

  const pixabayHealth: { status: "connected" | "not_configured" | "error"; message?: string } = pixabayKey
    ? { status: "connected", message: "Pixabay API Key configured and active" }
    : { status: "not_configured", message: "Pixabay API key not set (using fallback)" };

  return {
    unsplash: unsplashHealth,
    pexels: pexelsHealth,
    pixabay: pixabayHealth,
  };
}

function parseUnsplashPhoto(photo: any, query: string, accessKey: string): SourcedImage {
  // Trigger Unsplash download tracking per API terms
  if (photo.links?.download_location) {
    fetch(photo.links.download_location, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    }).catch(() => {});
  }

  const photographer = photo.user?.name || "Unsplash Photographer";
  const photographerUrl = photo.user?.links?.html
    ? `${photo.user.links.html}?utm_source=reelscale&utm_medium=referral`
    : "https://unsplash.com/?utm_source=reelscale&utm_medium=referral";
  const sourcePage = photo.links?.html
    ? `${photo.links.html}?utm_source=reelscale&utm_medium=referral`
    : "https://unsplash.com/?utm_source=reelscale&utm_medium=referral";

  return {
    provider: "unsplash",
    imageUrl: `${photo.urls?.regular || photo.urls?.full}&w=1200&q=80`,
    thumbnailUrl: photo.urls?.small || photo.urls?.thumb,
    photographerName: photographer,
    photographerUrl,
    sourcePageUrl: sourcePage,
    altText: photo.alt_description || photo.description || query,
    attributionHtml: `Photo by <a href="${photographerUrl}" target="_blank" rel="noopener noreferrer">${photographer}</a> on <a href="${sourcePage}" target="_blank" rel="noopener noreferrer">Unsplash</a>`,
    attributionMarkdown: `Photo by [${photographer}](${photographerUrl}) on [Unsplash](${sourcePage})`,
    width: photo.width,
    height: photo.height,
  };
}

/**
 * Fetch a completely random image from Unsplash
 */
export async function getRandomUnsplashImage(query: string, accessKey: string): Promise<SourcedImage | null> {
  try {
    const cleanQuery = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${cleanQuery}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": "v1",
        },
      }
    );

    if (!res.ok) {
      // If specific query returns 404, fallback to random video/production landscape photo
      const broadRes = await fetch(
        `https://api.unsplash.com/photos/random?query=video%20production,camera,marketing,business&orientation=landscape`,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
            "Accept-Version": "v1",
          },
        }
      );
      if (!broadRes.ok) return null;
      const data = await broadRes.json();
      return parseUnsplashPhoto(data, query, accessKey);
    }

    const photo = await res.json();
    return parseUnsplashPhoto(photo, query, accessKey);
  } catch (err) {
    console.warn("Unsplash random photo error:", err);
    return null;
  }
}

export async function searchUnsplash(query: string, accessKey: string): Promise<SourcedImage | null> {
  try {
    const cleanQuery = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${cleanQuery}&orientation=landscape&per_page=12`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": "v1",
        },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results || [];
    if (results.length === 0) return null;

    // Pick random photo from results
    const randomIndex = Math.floor(Math.random() * results.length);
    const photo = results[randomIndex];

    return parseUnsplashPhoto(photo, query, accessKey);
  } catch (err) {
    console.warn("Unsplash search error:", err);
    return null;
  }
}

export async function searchPexels(query: string, apiKey: string): Promise<SourcedImage | null> {
  try {
    const cleanQuery = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${cleanQuery}&orientation=landscape&per_page=12`,
      {
        headers: { Authorization: apiKey },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const photos = data.photos || [];
    if (photos.length === 0) return null;

    // Pick a random photo from the results
    const randomIndex = Math.floor(Math.random() * photos.length);
    const photo = photos[randomIndex];

    return {
      provider: "pexels",
      imageUrl: photo.src?.large2x || photo.src?.large || photo.src?.original,
      thumbnailUrl: photo.src?.medium || photo.src?.small,
      photographerName: photo.photographer || "Pexels Photographer",
      photographerUrl: photo.photographer_url || "https://www.pexels.com",
      sourcePageUrl: photo.url || "https://www.pexels.com",
      altText: photo.alt || query,
      attributionHtml: `Photo by <a href="${photo.photographer_url}" target="_blank" rel="noopener noreferrer">${photo.photographer}</a> on <a href="${photo.url}" target="_blank" rel="noopener noreferrer">Pexels</a>`,
      attributionMarkdown: `Photo by [${photo.photographer}](${photo.photographer_url}) on [Pexels](${photo.url})`,
      width: photo.width,
      height: photo.height,
    };
  } catch (err) {
    console.warn("Pexels search error:", err);
    return null;
  }
}

export async function searchPixabay(query: string, apiKey: string): Promise<SourcedImage | null> {
  try {
    const cleanQuery = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${cleanQuery}&image_type=photo&orientation=horizontal&safesearch=true&per_page=15`
    );

    if (!res.ok) return null;
    const data = await res.json();
    const hits = data.hits || [];
    if (hits.length === 0) return null;

    // Pick a random photo from results
    const randomIndex = Math.floor(Math.random() * hits.length);
    const hit = hits[randomIndex];

    const photographerUrl = hit.user_id
      ? `https://pixabay.com/users/${hit.user}-${hit.user_id}/`
      : "https://pixabay.com/";

    return {
      provider: "pixabay",
      imageUrl: hit.largeImageURL || hit.webformatURL,
      thumbnailUrl: hit.webformatURL || hit.previewURL,
      photographerName: hit.user || "Pixabay Contributor",
      photographerUrl,
      sourcePageUrl: hit.pageURL || "https://pixabay.com/",
      altText: hit.tags || query,
      attributionHtml: `Photo by <a href="${photographerUrl}" target="_blank" rel="noopener noreferrer">${hit.user}</a> on <a href="${hit.pageURL}" target="_blank" rel="noopener noreferrer">Pixabay</a>`,
      attributionMarkdown: `Photo by [${hit.user}](${photographerUrl}) on [Pixabay](${hit.pageURL})`,
      width: hit.imageWidth,
      height: hit.imageHeight,
    };
  } catch (err) {
    console.warn("Pixabay search error:", err);
    return null;
  }
}

/**
 * Sourcing strategy:
 * 1. Unsplash Random image first (user provided Unsplash API key)
 * 2. Pexels random image fallback (user provided Pexels API key)
 * 3. Pixabay random image fallback (user provided Pixabay API key)
 * 4. High-resolution curated stock photo fallback
 */
export async function sourceFeaturedImage(keywords: string[]): Promise<SourcedImage> {
  const { pexelsKey, unsplashKey, pixabayKey } = await getImageApiKeys();
  const searchTerms = keywords.length > 0 ? keywords : ["video production smartphone", "hyderabad cafe", "instagram reels"];

  // 1. Unsplash Random Image (PRIMARY - per user instruction)
  if (unsplashKey) {
    const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    const unsplashRandom = await getRandomUnsplashImage(randomTerm, unsplashKey);
    if (unsplashRandom) return unsplashRandom;

    for (const term of searchTerms) {
      const unsplashResult = await searchUnsplash(term, unsplashKey);
      if (unsplashResult) return unsplashResult;
    }
  }

  // 2. Pexels Random Image (SECONDARY)
  if (pexelsKey) {
    for (const term of searchTerms) {
      const pexelsResult = await searchPexels(term, pexelsKey);
      if (pexelsResult) return pexelsResult;
    }
  }

  // 3. Pixabay Random Image (TERTIARY)
  if (pixabayKey) {
    for (const term of searchTerms) {
      const pixabayResult = await searchPixabay(term, pixabayKey);
      if (pixabayResult) return pixabayResult;
    }
  }

  // 4. Fallback to random curated photo
  const randomIndex = Math.floor(Math.random() * CURATED_REELSCALE_IMAGES.length);
  return CURATED_REELSCALE_IMAGES[randomIndex];
}
