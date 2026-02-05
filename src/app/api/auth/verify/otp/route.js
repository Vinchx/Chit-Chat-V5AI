import { NextResponse } from 'next/server';
import User from '@/models/User';
import connectToDatabase from '@/lib/mongodb';

export async function POST(request) {
    try {
        await connectToDatabase();

        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json(
                { success: false, message: "Email dan Kode OTP harus diisi" },
                { status: 400 }
            );
        }

        // Cari user berdasarkan email
        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User tidak ditemukan" },
                { status: 404 }
            );
        }

        // Cek apakah user sudah terverifikasi
        if (user.isVerified) {
            return NextResponse.json(
                { success: true, message: "Akun sudah terverifikasi sebelumnya", isAlreadyVerified: true },
                { status: 200 }
            );
        }

        // Cek kecocokan OTP
        // Pastikan OTP di database ada
        if (!user.verificationOtp) {
            return NextResponse.json(
                { success: false, message: "Tidak ada proses verifikasi OTP yang aktif" },
                { status: 400 }
            );
        }

        // Verifikasi kode
        if (user.verificationOtp !== otp) {
            return NextResponse.json(
                { success: false, message: "Kode OTP salah" },
                { status: 400 }
            );
        }

        // Cek kadaluarsa
        if (new Date() > new Date(user.verificationOtpExpires)) {
            return NextResponse.json(
                { success: false, message: "Kode OTP sudah kadaluarsa. Silakan daftar ulang atau minta kirim ulang." },
                { status: 400 }
            );
        }

        // OTP Valid - Verifikasi User
        user.isVerified = true;
        user.verifiedAt = new Date();
        user.verificationToken = null; // Hapus token lama
        user.verificationOtp = null;   // Hapus OTP lama
        user.verificationOtpExpires = null;

        await user.save();

        return NextResponse.json({
            success: true,
            message: "Verifikasi berhasil! Akun Anda telah aktif."
        });

    } catch (error) {
        console.error('[VERIFY-OTP] Error:', error);
        return NextResponse.json(
            { success: false, message: "Terjadi kesalahan saat verifikasi OTP" },
            { status: 500 }
        );
    }
}
