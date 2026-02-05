// src/app/api/register/route.js
import { NextResponse } from 'next/server';
import User from '@/models/User';
import EmailService from '@/lib/EmailService';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';

export async function POST(request) {
  try {
    // Connect to MongoDB first (critical for Vercel serverless)
    await connectToDatabase();

    console.log('[REGISTER] Starting registration process...');
    const { username, email, password, displayName } = await request.json();
    console.log('[REGISTER] Received data:', { username, email, displayName });

    // Validasi input
    if (!username || !email || !password || !displayName) {
      console.log('[REGISTER] Validation failed: Missing fields');
      return NextResponse.json(
        { success: false, message: "Semua field wajib diisi!" },
        { status: 400 }
      );
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[REGISTER] Validation failed: Invalid email format');
      return NextResponse.json(
        { success: false, message: "Format email tidak valid!" },
        { status: 400 }
      );
    }

    // Validasi panjang password
    if (password.length < 8) {
      console.log('[REGISTER] Validation failed: Password too short');
      return NextResponse.json(
        { success: false, message: "Password minimal 8 karakter!" },
        { status: 400 }
      );
    }

    // Cek apakah user sudah ada
    console.log('[REGISTER] Checking for existing user...');
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      console.log('[REGISTER] User already exists');
      return NextResponse.json(
        { success: false, message: "Username atau email sudah digunakan" },
        { status: 409 }
      );
    }

    // Generate verification token
    console.log('[REGISTER] Generating verification token...');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Generate OTP (6 digits)
    console.log('[REGISTER] Generating OTP...');
    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    // OTP expires in 24 hours (matches token validity implicitly, though DB field is explicit)
    const verificationOtpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Hash password
    console.log('[REGISTER] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru (belum terverifikasi)
    console.log('[REGISTER] Creating new user...');
    const newUser = new User({
      _id: `user${Date.now()}`, // Generate ID unik
      username,
      email,
      password: hashedPassword,
      displayName,
      isVerified: false,
      verificationToken,
      verificationOtp,
      verificationOtpExpires
    });

    console.log('[REGISTER] Saving user to database...');
    await newUser.save();
    console.log('[REGISTER] User saved successfully!');

    // Tentukan base URL dari request origin untuk mendukung localhost dan ngrok
    // Prioritaskan header proxy (ngrok) jika ada
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    console.log('[REGISTER] Using base URL for verification:', baseUrl);

    // Kirim email verifikasi
    try {
      console.log('[REGISTER] Initializing email service...');
      const emailService = new EmailService();
      console.log('[REGISTER] Sending verification email to:', email);

      const emailResult = await emailService.sendEmail({
        to: email,
        subject: 'Verifikasi Akun ChitChat - Kode OTP & Link',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Verifikasi Akun Anda</h2>
            <p>Halo <strong>${displayName}</strong>,</p>
            <p>Terima kasih telah mendaftar di ChitChat V5.1 AI. Gunakan salah satu cara di bawah ini untuk mengaktifkan akun Anda:</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
              <p style="margin-bottom: 10px; font-weight: bold; color: #555;">Cara 1: Masukkan Kode OTP</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; background: #fff; padding: 15px; border: 1px dashed #ccc; display: inline-block; border-radius: 8px;">
                ${verificationOtp}
              </div>
              <p style="font-size: 12px; color: #888; margin-top: 10px;">Masukkan kode ini di halaman verifikasi website.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="margin-bottom: 10px; font-weight: bold; color: #555;">Cara 2: Klik Tombol Verifikasi</p>
              <a href="${baseUrl}/auth/verify/${verificationToken}"
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Verifikasi Akun Otomatis
              </a>
            </div>
            
            <p style="text-align: center; color: #666e">Atau copy link berikut:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px; color: #666;">
              ${baseUrl}/auth/verify/${verificationToken}
            </p>
            
            <p style="font-size: 11px; color: #999; margin-top: 30px; text-align: center;">
              Jika Anda tidak mendaftar di ChitChat, abaikan email ini.
            </p>
          </div>
        `
      });

      console.log('[REGISTER] Email send result:', emailResult);

      if (!emailResult.success) {
        throw new Error(emailResult.error);
      }

      console.log('[REGISTER] Email sent successfully!');
    } catch (emailError) {
      console.error('[REGISTER] Failed to send verification email:', emailError);
      // Jika gagal kirim email, hapus user yang sudah dibuat
      console.log('[REGISTER] Deleting user due to email failure...');
      await User.deleteOne({ _id: newUser._id });
      return NextResponse.json(
        { success: false, message: "Gagal mengirim email verifikasi. Silakan coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Akun berhasil dibuat! Silakan cek email Anda untuk verifikasi akun.",
        userId: newUser._id
      }
    );
  } catch (error) {
    console.error('Error registrasi:', error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat registrasi" },
      { status: 500 }
    );
  }
}