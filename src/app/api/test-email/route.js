// Test endpoint untuk verifikasi email service
import { NextResponse } from 'next/server';
import EmailService from '@/lib/EmailService';

export async function GET() {
    try {
        console.log('Testing email service...');

        // Cek environment variables
        const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL'];
        const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingEnvVars.length > 0) {
            return NextResponse.json({
                success: false,
                error: 'Missing environment variables',
                missing: missingEnvVars
            }, { status: 500 });
        }

        // Test koneksi SMTP
        const emailService = new EmailService();
        const isConnected = await emailService.verifyConnection();

        if (!isConnected) {
            return NextResponse.json({
                success: false,
                error: 'Email service connection failed',
                config: {
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT,
                    user: process.env.SMTP_USER,
                    from: process.env.FROM_EMAIL
                }
            }, { status: 500 });
        }

        // Test kirim email
        const testResult = await emailService.sendEmail({
            to: process.env.SMTP_USER, // Kirim ke diri sendiri
            subject: 'Test Email - ChitChat V5.1',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email Successful!</h2>
          <p>Email service is working correctly.</p>
          <p>Server URL: ${process.env.NEXT_PUBLIC_SERVER_URL}</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
      `
        });

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully',
            result: testResult,
            config: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                from: process.env.FROM_EMAIL,
                serverUrl: process.env.NEXT_PUBLIC_SERVER_URL
            }
        });

    } catch (error) {
        console.error('Email test error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
