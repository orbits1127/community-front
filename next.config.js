/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'static.cdninstagram.com',
      },
      // Vercel Blob: 프로젝트별로 생성되는 Blob 스토어 호스트를 추가하세요 (예: xxx.public.blob.vercel-storage.com)
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
      },
    ],
  },
};

module.exports = nextConfig;
