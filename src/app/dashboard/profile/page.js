import { auth } from '@/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { redirect } from 'next/navigation';
import ProfileClient from '@/components/ProfileClient';

export default async function DashboardProfilePage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect('/auth');
    }

    await connectToDatabase();
    const user = await User.findById(session.user.id).select('-password');

    if (!user) {
        redirect('/auth');
    }

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

    return <ProfileClient user={userObject} isOwnProfile={true} isEmbedded={true} />;
}
