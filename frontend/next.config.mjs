import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    'http://192.168.0.47:3000', // Replace with your target local IP
  ],
  // Silence monorepo root inference warning; set tracing root to repo root
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@student': path.resolve(__dirname, 'src/student'),
      '@teacher': path.resolve(__dirname, 'src/teacher'),
      phaser: path.resolve(__dirname, 'node_modules/phaser/dist/phaser.min.js'),
    };
    return config;
  },
};

export default nextConfig;
