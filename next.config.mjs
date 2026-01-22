/** @type {import('next').NextConfig} */
const nextConfig = {
    // Allow development access from ngrok
    experimental: {
        allowedDevOrigins: [
            'https://breanne-unenrichable-aquatically.ngrok-free.dev'
        ]
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '2b0xnnc9jmziigps.public.blob.vercel-storage.com',
            },
        ],
    },
};

export default nextConfig;
