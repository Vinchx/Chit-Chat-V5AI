/** @type {import('next').NextConfig} */
const nextConfig = {
    // Allow development access from ngrok
    experimental: {
        allowedDevOrigins: [
            'https://breanne-unenrichable-aquatically.ngrok-free.dev'
        ]
    }
};

export default nextConfig;
