// src/app/api/upload/avatar/route.js
import { NextResponse } from 'next/server';
import { uploadFile, deleteFile } from '@/lib/fileUpload';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { auth } from '@/auth';

export async function POST(request) {
  try {
    // Ambil session user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Anda harus login untuk mengupload avatar.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File tidak ditemukan dalam request.' },
        { status: 400 }
      );
    }

    // Konversi file ke buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload file ke direktori avatar user
    const result = await uploadFile(buffer, file.name, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 }
      );
    }

    // Ambil user sebelum update untuk mendapatkan avatar lama
    await connectToDatabase();
    const userBeforeUpdate = await User.findById(session.user.id).select('avatar');

    // Update user dengan URL avatar baru
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { avatar: result.path },
      { new: true }
    ).select('-password'); // Jangan kembalikan password

    // Hapus avatar lama jika ada
    if (userBeforeUpdate.avatar && userBeforeUpdate.avatar.startsWith('/uploads/')) {
      try {
        await deleteFile(userBeforeUpdate.avatar);
      } catch (deleteError) {
        console.error('Gagal hapus avatar lama:', deleteError);
        // Jangan kembalikan error ini ke client, hanya log saja
      }
    }

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Gagal memperbarui data user.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar berhasil diupdate',
      data: {
        avatar: result.path,
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Error upload avatar:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat upload avatar.' },
      { status: 500 }
    );
  }
}