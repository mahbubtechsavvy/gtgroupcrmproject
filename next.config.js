/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kjppkkumublhiwzwufhe.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async rewrites() {
    const cctvUrl = process.env.CCTV_TRACKER_URL || 'http://127.0.0.1:5001';
    return [
      {
        source: '/video_feed',
        destination: `${cctvUrl}/video_feed`,
      },
      {
        source: '/start_tracking',
        destination: `${cctvUrl}/start_tracking`,
      },
      {
        source: '/stop_tracking',
        destination: `${cctvUrl}/stop_tracking`,
      },
      {
        source: '/status',
        destination: `${cctvUrl}/status`,
      },
      {
        source: '/logs',
        destination: `${cctvUrl}/logs`,
      },
      {
        source: '/upload_video',
        destination: `${cctvUrl}/upload_video`,
      },
    ];
  },
};

module.exports = nextConfig;

