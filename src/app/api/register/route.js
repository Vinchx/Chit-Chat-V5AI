// src/app/api/register/route.js
import { NextResponse } from 'next/server';
import User from '@/models/User';
import EmailService from '@/lib/EmailService';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function POST(request) {
  try {
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
      verificationToken
    });

    console.log('[REGISTER] Saving user to database...');
    await newUser.save();
    console.log('[REGISTER] User saved successfully!');

    // Kirim email verifikasi
    try {
      console.log('[REGISTER] Initializing email service...');
      const emailService = new EmailService();
      console.log('[REGISTER] Sending verification email to:', email);

      const emailResult = await emailService.sendEmail({
        to: email,
        subject: 'Verifikasi Akun ChitChat - Aktifkan Akun Anda',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Verifikasi Akun Anda</h2>
            <p>Halo <strong>${displayName}</strong>,</p>
            <p>Terima kasih telah mendaftar di ChitChat V5.1 AI. Untuk mengaktifkan akun Anda, silakan klik tombol di bawah ini:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/auth/verify/${verificationToken}"
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Verifikasi Akun
              </a>
            </div>
            <p>Atau copy dan paste link berikut ke browser Anda:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
              ${process.env.NEXT_PUBLIC_SERVER_URL}/auth/verify/${verificationToken}
            </p>
            <p>Link verifikasi ini akan kadaluarsa dalam 24 jam.</p>
            <p>Jika Anda tidak mendaftar di ChitChat, abaikan email ini.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p><small>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</small></p>
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