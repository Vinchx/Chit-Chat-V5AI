// src/app/api/profile/change-password/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';

export async function PUT(request) {
    try {
        // Ambil session user yang sedang login
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized - Silakan login terlebih dahulu' },
                { status: 401 }
            );
        }

        const { currentPassword, newPassword, confirmPassword } = await request.json();

        // Validasi input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json(
                { success: false, message: 'Semua field harus diisi' },
                { status: 400 }
            );
        }

        // Validasi password baru minimal 8 karakter
        if (newPassword.length < 8) {
            return NextResponse.json(
                { success: false, message: 'Password baru minimal 8 karakter' },
                { status: 400 }
            );
        }

        // Validasi password baru dan konfirmasi sama
        if (newPassword !== confirmPassword) {
            return NextResponse.json(
                { success: false, message: 'Password baru dan konfirmasi tidak sama' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Ambil user dari database (termasuk password)
        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User tidak ditemukan' },
                { status: 404 }
            );
        }

        // Validasi password lama
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, message: 'Password saat ini salah' },
                { status: 400 }
            );
        }

        // Cek apakah password baru sama dengan password lama
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return NextResponse.json(
                { success: false, message: 'Password baru tidak boleh sama dengan password lama' },
                { status: 400 }
            );
        }

        // Hash password baru
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        user.password = hashedPassword;
        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Password berhasil diubah'
        });

    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json(
            { success: false, message: 'Terjadi kesalahan. Silakan coba lagi.' },
            { status: 500 }
        );
    }
}
