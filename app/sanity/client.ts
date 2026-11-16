import { createClient } from 'next-sanity'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '2gdjnoi2'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-02-01'

const writeToken =
  process.env.SANITY_API_WRITE_TOKEN ||
  process.env.NEXT_PUBLIC_SANITY_WRITE_TOKEN ||
  process.env.SANITY_AUTH_TOKEN ||
  'sk3Siocd2x3A3cJvRxFVtSCR6YoQwHLPqnoqpN1xeikBeEMjg3jntHkEFN1u4OxzFKnGH5sBeUpZ2DeQZlhM9SzXUUnW4YekS9AyaG6LYC4xnwV0D6lh21Gy7kllGRWzcfWtdzgicbaFSsjslbTKmFDdg7wGwssFSvebuA4cGs4ilrkwLEVH'

// Public read client: no token, no Authorization header, zero CORS issues on any domain
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})

// Authenticated write client for dashboard & API mutations
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: writeToken,
})
