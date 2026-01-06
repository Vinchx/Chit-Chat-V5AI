// src/app/profile/[userId]/page.js
import { auth } from '@/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { notFound } from 'next/navigation';
import ProfileClient from '@/components/ProfileClient';

export default async function ProfilePage({ params }) {
  const { userId } = await params; // Gunakan await untuk Next.js 13+

  // Ambil session user yang sedang login (jika ada)
  const session = await auth();

  await connectToDatabase();

  // Ambil data user dari database
  const user = await User.findById(userId).select('-password');

  if (!user) {
    notFound(); // Tampilkan 404 jika user tidak ditemukan
  }

  // Konversi Mongoose document ke plain object
  const userObject = JSON.parse(JSON.stringify({
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar ? user.avatar.replace(/\\/g, '/') : null, // Normalize path untuk Next.js
    bio: user.bio || '',
    isOnline: user.isOnline,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    verificationToken: user.verificationToken,
    verifiedAt: user.verifiedAt
  }));

  // Tentukan apakah user yang dilihat adalah user yang sedang login
  const isOwnProfile = session && session.user && session.user.id === userId;

  return <ProfileClient user={userObject} isOwnProfile={isOwnProfile} />;
}