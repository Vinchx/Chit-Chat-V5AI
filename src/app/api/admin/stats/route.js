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

        // Active users (currently online)
        const activeToday = await User.countDocuments({
            isOnline: true
        });

        // Total messages
        const Message = mongoose.models.Message || mongoose.model('Message', new mongoose.Schema({}, { strict: false }));
        const totalMessages = await Message.countDocuments();

        // Total rooms
        const Room = mongoose.models.Room || mongoose.model('Room', new mongoose.Schema({}, { strict: false }));
        const totalRooms = await Room.countDocuments();

        // Recent users - with optional date range filter and pagination
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 5;

        // Build date filter query
        let dateQuery = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            // Set start to beginning of day (00:00:00.000)
            start.setHours(0, 0, 0, 0);

            // Set end to end of day (23:59:59.999)
            end.setHours(23, 59, 59, 999);

            dateQuery = {
                createdAt: {
                    $gte: start,
                    $lte: end
                }
            };
        }

        // Get total count for pagination
        const totalRecentUsers = await User.countDocuments(dateQuery);
        const totalPages = Math.ceil(totalRecentUsers / limit);

        const recentUsers = await User.find(dateQuery)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('username email displayName createdAt avatar')
            .lean();

        return NextResponse.json({
            totalUsers,
            activeToday,
            totalMessages,
            totalRooms,
            recentUsers,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalRecentUsers,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        console.error('[Admin Stats] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
