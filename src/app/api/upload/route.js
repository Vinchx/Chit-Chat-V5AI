// src/app/api/upload/route.js
import { NextResponse } from 'next/server';
import { uploadFile, deleteFile } from '@/lib/fileUpload';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    // Kita perlu mengakses data form untuk mendapatkan file
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId'); // opsional, untuk mengkategorikan file berdasarkan user

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'File tidak ditemukan dalam request.' },
        { status: 400 }
      );
    }

    // Konversi file ke buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload file
    const result = await uploadFile(buffer, file.name, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 }
      );
    }

    // Jika userId disediakan, kita bisa update user dengan URL avatar
    if (userId) {
      try {
        await connectToDatabase();
        await User.findByIdAndUpdate(
          userId,
          { avatar: result.path },
          { new: true }
        );
      } catch (dbError) {
        console.error('Gagal update user avatar:', dbError);
        // Jangan kembalikan error ini ke client, hanya log saja
      }
    }

    return NextResponse.json({
      success: true,
      message: 'File berhasil diupload',
      data: result
    });
  } catch (error) {
    console.error('Error upload:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat upload file.' },
      { status: 500 }
    );
  }
}

// Endpoint untuk menghapus file
export async function DELETE(request) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { success: false, message: 'Path file tidak ditemukan.' },
        { status: 400 }
      );
    }

    const result = await deleteFile(filePath);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File berhasil dihapus'
    });
  } catch (error) {
    console.error('Error hapus file:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat menghapus file.' },
      { status: 500 }
    );
  }
}