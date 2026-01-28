import { auth } from '@/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { notFound, redirect } from 'next/navigation';
import ProfileClient from '@/components/ProfileClient';

export default async function DashboardFriendProfilePage({ params }) {
    const { userId } = await params;
    const session = await auth();

    if (!session || !session.user) {
        redirect('/auth');
    }

    await connectToDatabase();

    // Ambil data user dari database
    const user = await User.findById(userId).select('-password');

    if (!user) {
        notFound();
    }

    // Konversi Mongoose document ke plain object
    const userObject = JSON.parse(JSON.stringify({
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar ? user.avatar.replace(/\\/g, '/') : null,
        banner: user.banner ? user.banner.replace(/\\/g, '/') : null,
        bio: user.bio || '',
        isOnline: user.isOnline,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        verificationToken: user.verificationToken,
        verifiedAt: user.verifiedAt
    }));

    // Helper untuk cek apakah ini profile sendiri
    // (Meskipun biasanya user akan diarahkan ke /dashboard/profile jika profile sendiri, 
    // handle ini untuk safety jika user navigasi manual via URL)
    const isOwnProfile = session.user.id === userId;

    return <ProfileClient user={userObject} isOwnProfile={isOwnProfile} isEmbedded={true} />;
}
