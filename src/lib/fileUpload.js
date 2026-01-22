// src/lib/fileUpload.js
import { promises as fs } from 'fs';
import path from 'path';

// Direktori untuk menyimpan file upload
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Buat direktori upload jika belum ada
await fs.mkdir(UPLOAD_DIR, { recursive: true });

// Ekstensi file yang diizinkan
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadFile(fileBuffer, originalFilename, userId = null) {
  try {
    // Validasi ekstensi file
    const fileExtension = path.extname(originalFilename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      throw new Error(`Ekstensi file tidak diizinkan. Hanya: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // Validasi ukuran file
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new Error(`Ukuran file terlalu besar. Maksimal: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Buat nama file unik
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const uniqueFilename = `${timestamp}_${randomString}${fileExtension}`;

    // Tambahkan folder user jika disediakan
    const userDir = userId ? path.join(UPLOAD_DIR, userId) : UPLOAD_DIR;
    await fs.mkdir(userDir, { recursive: true });

    // Path lengkap file
    const filePath = path.join(userDir, uniqueFilename);

    // Simpan file
    await fs.writeFile(filePath, fileBuffer);

    // Kembalikan path file yang bisa diakses
    const relativePath = path.join('/uploads', userId ? userId : '', uniqueFilename);

    return {
      success: true,
      filename: uniqueFilename,
      path: relativePath,
      originalName: originalFilename,
      size: fileBuffer.length,
      type: fileExtension,
    };
  } catch (error) {
    console.error('Error upload file:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function deleteFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.unlink(fullPath);
    return { success: true };
  } catch (error) {
    console.error('Error hapus file:', error);
    return { success: false, error: error.message };
  }
}

// Fungsi untuk memvalidasi file sebelum upload
export function validateFile(fileBuffer, originalFilename) {
  const fileExtension = path.extname(originalFilename).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      valid: false,
      error: `Ekstensi file tidak diizinkan. Hanya: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  if (fileBuffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  return { valid: true };
}