// Admin Stats API
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdmin } from '@/lib/admin-config';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request) {
    try {
        const session = await auth();

        // Check authentication
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check admin access
        if (!isAdmin(session.user.email)) {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        await connectToDatabase();

        // Get stats
        const totalUsers = await User.countDocuments();

        // Active users today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeToday = await User.countDocuments({
            lastActive: { $gte: today }
        });

        // Total messages
        const Message = mongoose.models.Message || mongoose.model('Message', new mongoose.Schema({}, { strict: false }));
        const totalMessages = await Message.countDocuments();

        // Total rooms
        const Room = mongoose.models.Room || mongoose.model('Room', new mongoose.Schema({}, { strict: false }));
        const totalRooms = await Room.countDocuments();

        // Recent users
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('username email displayName createdAt avatar')
            .lean();

        return NextResponse.json({
            totalUsers,
            activeToday,
            totalMessages,
            totalRooms,
            recentUsers,
        });

    } catch (error) {
        console.error('[Admin Stats] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
