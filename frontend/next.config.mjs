/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ส่ง request ไป backend ผ่าน env (NEXT_PUBLIC_API_URL)
  async rewrites() {
    return [];
  },
};

export default nextConfig;
