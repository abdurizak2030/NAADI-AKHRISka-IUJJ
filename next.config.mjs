/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Server Actions aren't used, but route handlers below need larger
  // body sizes for file uploads (avatars/images/attachments/videos).
  experimental: {},
  images: {
    // The app renders a lot of hot-linked remote images (Unsplash covers,
    // YouTube thumbnails, user-uploaded avatars) — allow any https host
    // rather than an allowlist, matching the original app's behavior of
    // rendering arbitrary admin-entered image URLs.
    remotePatterns: [{ protocol: 'https', hostname: '**' }, { protocol: 'http', hostname: '**' }],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
