// src/app/api/auth/verify/[token]/route.js
import { NextResponse } from 'next/server';
import User from '@/models/User';

// Pastikan route ini dinamis
export const dynamicParams = true;

export async function GET(request, { params }) {
  try {
    console.log('All params:', params); // Logging semua parameter

    const awaitedParams = await params;
    const { token } = awaitedParams;

    console.log('Received token:', token); // Logging untuk debugging

    if (!token) {
      console.log('Token is undefined or empty:', { token, params: awaitedParams }); // Logging tambahan
      return NextResponse.json(
        { success: false, message: 'Token verifikasi tidak ditempatkan.' },
        { status: 400 }
      );
    }

    // Cari user berdasarkan token verifikasi
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Token verifikasi tidak valid atau sudah digunakan.' },
        { status: 400 }
      );
    }

    // Periksa apakah akun sudah terverifikasi sebelumnya
    if (user.isVerified) {
      return NextResponse.json(
        { success: false, message: 'Akun sudah terverifikasi sebelumnya.' },
        { status: 400 }
      );
    }

    // Update user - set sebagai terverifikasi
    user.isVerified = true;
    user.verifiedAt = new Date();
    user.verificationToken = null; // Hapus token setelah digunakan
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil diverifikasi! Anda sekarang dapat login.',
      userId: user._id
    });
  } catch (error) {
    console.error('Error dalam verifikasi akun:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan dalam verifikasi akun.' },
      { status: 500 }
    );
  }
}