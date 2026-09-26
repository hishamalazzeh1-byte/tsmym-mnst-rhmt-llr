/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // لا يتم تجاهل أخطاء TypeScript — يجب أن يكون الكود نظيفاً فعلياً
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
