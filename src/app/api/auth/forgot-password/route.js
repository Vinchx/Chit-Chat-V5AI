// src/app/api/auth/forgot-password/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
const EmailService = require('@/lib/EmailService');

// Generate 6-digit OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { success: false, message: 'Email harus diisi' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Cari user berdasarkan email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Untuk keamanan, jangan kasih tau bahwa email tidak terdaftar
            // Tapi tampilkan pesan sukses palsu (opsional, bisa diubah)
            return NextResponse.json(
                { success: false, message: 'Email tidak ditemukan dalam sistem kami' },
                { status: 404 }
            );
        }

        // Generate OTP
        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

        // Simpan OTP ke database
        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = otpExpires;
        await user.save();

        // Kirim email OTP
        const emailService = new EmailService();
        const emailResult = await emailService.sendForgotPasswordOtp(
            user.email,
            otp,
            user.displayName || user.username
        );

        if (!emailResult.success) {
            console.error('Error sending forgot password email:', emailResult.error);
            return NextResponse.json(
                { success: false, message: 'Gagal mengirim email. Silakan coba lagi.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Kode OTP telah dikirim ke email Anda. Berlaku selama 10 menit.'
        });

    } catch (error) {
        console.error('Error in forgot password:', error);
        return NextResponse.json(
            { success: false, message: 'Terjadi kesalahan. Silakan coba lagi.' },
            { status: 500 }
        );
    }
}
