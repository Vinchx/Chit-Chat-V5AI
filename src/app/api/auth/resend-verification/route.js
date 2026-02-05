// src/app/api/auth/resend-verification/route.js
import { NextResponse } from 'next/server';
import User from '@/models/User';
import EmailService from '@/lib/EmailService';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email wajib diisi.' },
        { status: 400 }
      );
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid.' },
        { status: 400 }
      );
    }

    // Cari user berdasarkan email
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Akun dengan email tersebut tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Periksa apakah akun sudah terverifikasi
    if (user.isVerified) {
      return NextResponse.json(
        { success: false, message: 'Akun sudah terverifikasi.' },
        { status: 400 }
      );
    }

    // Generate verification token baru
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Update user dengan token verifikasi baru
    user.verificationToken = verificationToken;
    await user.save();

    // Tentukan base URL dari request origin
    // Prioritaskan header proxy (ngrok) jika ada
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    // Kirim email verifikasi baru
    try {
      const emailService = new EmailService();
      await emailService.sendEmail({
        to: email,
        subject: 'Verifikasi Akun ChitChat - Aktifkan Akun Anda',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Verifikasi Akun Anda</h2>
            <p>Halo <strong>${user.displayName}</strong>,</p>
            <p>Anda telah meminta link verifikasi akun baru. Untuk mengaktifkan akun Anda, silakan klik tombol di bawah ini:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/auth/verify/${verificationToken}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Verifikasi Akun
              </a>
            </div>
            <p>Atau copy dan paste link berikut ke browser Anda:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
              ${baseUrl}/auth/verify/${verificationToken}
            </p>
            <p>Link verifikasi ini akan kadaluarsa dalam 24 jam.</p>
            <p>Jika Anda tidak meminta link ini, abaikan email ini.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p><small>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</small></p>
          </div>
        `
      });

      return NextResponse.json({
        success: true,
        message: 'Email verifikasi baru telah dikirim ke alamat email Anda.'
      });
    } catch (emailError) {
      console.error('Gagal mengirim email verifikasi ulang:', emailError);
      return NextResponse.json(
        { success: false, message: 'Gagal mengirim email verifikasi. Silakan coba lagi.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error dalam pengiriman ulang verifikasi:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan dalam pengiriman ulang verifikasi.' },
      { status: 500 }
    );
  }
}