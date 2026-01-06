// src/app/api/upload/avatar/delete/route.js
import { NextResponse } from 'next/server';
import { deleteFile } from '@/lib/fileUpload';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { auth } from '@/auth';

export async function DELETE(request) {
  try {
    // Ambil session user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Anda harus login untuk menghapus avatar.' },
        { status: 401 }
      );
    }

    // Ambil user sebelum update untuk mendapatkan avatar lama
    await connectToDatabase();
    const user = await User.findById(session.user.id).select('avatar');

    if (!user || !user.avatar) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada avatar untuk dihapus.' },
        { status: 400 }
      );
    }

    // Hanya hapus file jika merupakan upload lokal kita
    if (user.avatar.startsWith('/uploads/')) {
      try {
        await deleteFile(user.avatar);
      } catch (deleteError) {
        console.error('Gagal hapus avatar:', deleteError);
        // Lanjutkan meskipun gagal hapus file, karena kita tetap perlu reset avatar di database
      }
    }

    // Reset avatar user ke null
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { avatar: null },
      { new: true }
    ).select('-password'); // Jangan kembalikan password

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Gagal memperbarui data user.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar berhasil dihapus',
      data: {
        avatar: updatedUser.avatar,
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Error hapus avatar:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat menghapus avatar.' },
      { status: 500 }
    );
  }
}