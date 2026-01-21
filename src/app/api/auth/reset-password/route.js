// src/app/api/auth/reset-password/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';

export async function POST(request) {
    try {
        const { email, otp, newPassword } = await request.json();

        // Validasi input
        if (!email || !otp || !newPassword) {
            return NextResponse.json(
                { success: false, message: 'Email, OTP, dan password baru harus diisi' },
                { status: 400 }
            );
        }

        // Validasi password minimal 8 karakter
        if (newPassword.length < 8) {
            return NextResponse.json(
                { success: false, message: 'Password minimal 8 karakter' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Cari user berdasarkan email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User tidak ditemukan' },
                { status: 404 }
            );
        }

        // Cek apakah OTP valid
        if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
            return NextResponse.json(
                { success: false, message: 'Kode OTP tidak valid' },
                { status: 400 }
            );
        }

        // Cek apakah OTP sudah expired
        if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
            // Clear OTP yang sudah expired
            user.resetPasswordOtp = null;
            user.resetPasswordExpires = null;
            await user.save();

            return NextResponse.json(
                { success: false, message: 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.' },
                { status: 400 }
            );
        }

        // Hash password baru
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password dan clear OTP fields
        user.password = hashedPassword;
        user.resetPasswordOtp = null;
        user.resetPasswordExpires = null;
        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Password berhasil direset. Silakan login dengan password baru Anda.'
        });

    } catch (error) {
        console.error('Error in reset password:', error);
        return NextResponse.json(
            { success: false, message: 'Terjadi kesalahan. Silakan coba lagi.' },
            { status: 500 }
        );
    }
}
