/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' ? 'export' : undefined,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdnjs.cloudflare.com",
      },
      {
        protocol: "https",
        hostname: "fonts.googleapis.com",
      },
    ],
  },
  transpilePackages: [],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://www.instagram.com https://*.instagram.com https://www.googletagmanager.com https://www.clarity.ms; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://images.unsplash.com https://*.instagram.com https://www.clarity.ms; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://www.instagram.com https://*.instagram.com https://www.youtube.com https://*.youtube.com; connect-src 'self' https://script.google.com https://*.clarity.ms https://*.google-analytics.com; upgrade-insecure-requests;",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;