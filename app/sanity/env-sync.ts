import { client, writeClient } from './client';

export interface SanityEnvironmentVariables {
  _id?: string;
  _type?: string;
  title?: string;
  // AI & LLM Keys
  groqApiKey?: string;
  geminiApiKey?: string;
  openrouterApiKey?: string;
  // Image Search APIs
  unsplashAccessKey?: string;
  unsplashAppId?: string;
  unsplashSecretKey?: string;
  pexelsApiKey?: string;
  pixabayApiKey?: string;
  // Database & Cloud
  databaseUrl?: string;
  databaseUrlUnpooled?: string;
  neonBranch?: string;
  neonBranchId?: string;
  // Sanity Bootstrap Credentials
  sanityProjectId?: string;
  sanityDataset?: string;
  sanityApiVersion?: string;
  sanityWriteToken?: string;
  // Site & SEO
  siteUrl?: string;
  googleSearchConsoleSiteUrl?: string;
}

/**
 * Fetch environment variables and API keys dynamically from Sanity Content Lake.
 * Returns null if unreachable or not yet configured.
 */
export async function getEnvironmentVariablesFromSanity(): Promise<SanityEnvironmentVariables | null> {
  try {
    const doc = await client.fetch<SanityEnvironmentVariables>(
      `*[_type == "environmentVariables" && _id == "environment-variables"][0]`
    );
    return doc || null;
  } catch (err: any) {
    console.warn('[Sanity Env Sync] Failed to fetch environment variables from Sanity:', err.message);
    return null;
  }
}

/**
 * Update environment variables in Sanity Content Lake.
 */
export async function saveEnvironmentVariablesToSanity(
  vars: Partial<SanityEnvironmentVariables>
): Promise<SanityEnvironmentVariables> {
  const current = (await getEnvironmentVariablesFromSanity()) || {};
  const doc = {
    ...current,
    ...vars,
    _id: 'environment-variables' as string,
    _type: 'environmentVariables',
    title: 'Production Environment Variables',
  };
  await writeClient.createOrReplace(doc);
  return doc;
}
