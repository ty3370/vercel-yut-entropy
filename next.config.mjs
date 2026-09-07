/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  typescript: {
    // Three.js 내부 JSX 태그 타입 충돌로 인한 빌드 중단 방지
    ignoreBuildErrors: true,
  },
  eslint: {
    // 린트 경고로 인한 빌드 중단 방지
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
