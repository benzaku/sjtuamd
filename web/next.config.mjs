/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/sites/default/files/:path*',
        destination: '/legacy-files/:path*'
      },
      {
        source: '/Pictures/:path*',
        destination: '/legacy-files/Pictures/:path*'
      },
      {
        source: '/SJTUAMD-Files/:path*',
        destination: '/legacy-files/SJTUAMD-Files/:path*'
      }
    ];
  }
};

export default nextConfig;
