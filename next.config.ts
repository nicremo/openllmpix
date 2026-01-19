import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers
  async headers() {
    // Content Security Policy - Protects against XSS and other injection attacks
    const cspDirectives = [
      // default-src: Fallback for other resource types not explicitly defined
      "default-src 'self'",

      // script-src: JavaScript sources
      // - 'self': Own domain scripts
      // - 'unsafe-inline': Required for Next.js inline scripts and React hydration
      // - 'unsafe-eval': Required for Next.js development mode (hot reload)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",

      // style-src: CSS sources
      // - 'self': Own domain stylesheets
      // - 'unsafe-inline': Required for Tailwind CSS and styled-jsx
      "style-src 'self' 'unsafe-inline'",

      // img-src: Image sources
      // - 'self': Own domain images
      // - data: Base64 encoded images (generated images, previews)
      // - blob: Blob URLs for generated/processed images
      // - https: External images from any HTTPS source (AI-generated image URLs)
      "img-src 'self' data: blob: https:",

      // connect-src: API and WebSocket connections
      // - 'self': Own domain API routes
      // - https://openrouter.ai: OpenRouter API for AI model routing
      // - https://generativelanguage.googleapis.com: Google AI Studio (Gemini)
      // - https://fal.run: fal.ai image generation API
      // - https://api.fal.ai: fal.ai API
      "connect-src 'self' https://openrouter.ai https://generativelanguage.googleapis.com https://fal.run https://api.fal.ai",

      // font-src: Font sources
      // - 'self': Own domain fonts
      // - data: Inline fonts (base64 encoded)
      "font-src 'self' data:",

      // object-src: Plugin content (Flash, Java, etc.)
      // - 'none': Disabled for security - no plugins needed
      "object-src 'none'",

      // base-uri: Restricts <base> tag URLs
      // - 'self': Only allow own domain
      "base-uri 'self'",

      // form-action: Form submission targets
      // - 'self': Own domain forms
      "form-action 'self'",

      // worker-src: Web Worker sources
      // - 'self': Own domain workers
      // - blob: Required for heic2any library (HEIC image conversion uses Web Workers)
      "worker-src 'self' blob:",

      // frame-ancestors: Who can embed this site
      // - 'none': Prevent clickjacking - no embedding allowed
      "frame-ancestors 'none'",

      // upgrade-insecure-requests: Automatically upgrade HTTP to HTTPS
      "upgrade-insecure-requests",
    ];

    const cspValue = cspDirectives.join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            // Content-Security-Policy: Main XSS protection header
            key: 'Content-Security-Policy',
            value: cspValue,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
