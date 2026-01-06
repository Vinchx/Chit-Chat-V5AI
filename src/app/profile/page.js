// src/app/profile/page.js
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function MyProfilePage() {
  // Ambil session user yang sedang login
  const session = await auth();

  if (!session || !session.user) {
    // Redirect ke halaman login jika tidak ada session
    redirect('/auth');
  }

  // Redirect ke halaman profile user yang sedang login
  redirect(`/profile/${session.user.id}`);
}