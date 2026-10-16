/** @type {import('next').NextConfig} */
const nextConfig = {
  // En Next.js 15/16+, allowedDevOrigins est à la racine de la configuration
  allowedDevOrigins: [
    'localhost:3000',
    '192.168.1.13:3000',
    '192.168.100.1:3000',
    '192.168.1.*',
  ],
};

export default nextConfig;
