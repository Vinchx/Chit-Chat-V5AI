// src/app/api/auth/send-otp/route.js
import { NextResponse } from 'next/server';
import EmailService from '../../../../lib/EmailService';

// Fungsi untuk generate OTP acak
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
    try {
        const { email, type = 'verification' } = await request.json();
        
        // Validasi input
        if (!email) {
            return NextResponse.json(
                { success: false, message: 'Email wajib diisi' },
                { status: 400 }
            );
        }
        
        // Validasi format email sederhana
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, message: 'Format email tidak valid' },
                { status: 400 }
            );
        }
        
        const emailService = new EmailService();
        
        // Generate OTP
        const otpCode = generateOTP();
        
        let sendResult;
        
        if (type === 'forgot-password') {
            // Jika ini untuk forgot password, kita perlu nama pengguna
            const { userName = 'Pengguna' } = await request.json();
            sendResult = await emailService.sendForgotPasswordOtp(email, otpCode, userName);
        } else {
            // Default adalah OTP verifikasi
            sendResult = await emailService.sendOtpEmail(email, otpCode);
        }
        
        // Simpan OTP ke database atau cache (implementasi tergantung kebutuhan)
        // Contoh: await saveOtpToDatabase(email, otpCode, type);
        
        if (sendResult.success) {
            return NextResponse.json({
                success: true,
                message: `Kode OTP telah dikirim ke ${email}`,
                otpCode: type === 'development' ? otpCode : undefined // Jangan kirim OTP di production
            });
        } else {
            console.error('Gagal mengirim email:', sendResult.error);
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Gagal mengirim kode OTP. Silakan coba lagi nanti.' 
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error di API send-otp:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Terjadi kesalahan server saat mengirim OTP' 
            },
            { status: 500 }
        );
    }
}