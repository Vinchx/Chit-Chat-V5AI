// src/app/api/users/[username]/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { isValidObjectId } from 'mongoose';

export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const awaitedParams = await params;
    const { username } = awaitedParams;

    console.log('=== API /api/users/[username] Debug ===');
    console.log('Received username param:', username);
    console.log('Username type:', typeof username);

    if (!username) {
      console.error('Username is missing!');
      return NextResponse.json(
        { success: false, message: 'Username/ID tidak ditemukan.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Auto-detect: check if it's a valid MongoDB ObjectId first
    let user;
    console.log('Checking if username is valid ObjectId...');
    console.log('isValidObjectId result:', isValidObjectId(username));

    if (isValidObjectId(username)) {
      // Try to find by ID first if it's a valid ObjectId
      console.log('Attempting to find user by ID:', username);
      user = await User.findById(username).select('-password -verificationToken');
      console.log('User found by ID:', user ? user.username : 'NOT FOUND');
    }

    // If not found by ID, try by username
    if (!user) {
      console.log('Attempting to find user by username:', username);
      user = await User.findOne({ username }).select('-password -verificationToken');
      console.log('User found by username:', user ? user.username : 'NOT FOUND');
    }

    // If still not found, try by _id field (for legacy IDs like "user002")
    if (!user) {
      console.log('Attempting to find user by _id field (legacy):', username);
      user = await User.findOne({ _id: username }).select('-password -verificationToken');
      console.log('User found by _id field:', user ? user.username : 'NOT FOUND');
    }

    if (!user) {
      console.error('User not found for:', username);
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Normalize avatar path for Next.js Image
    const userObject = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar ? user.avatar.replace(/\\/g, '/') : null,
      bio: user.bio || '',
      isOnline: user.isOnline,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      verifiedAt: user.verifiedAt
    };

    return NextResponse.json({
      success: true,
      user: userObject,
      // Legacy format for backward compatibility
      data: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar ? user.avatar.replace(/\\/g, '/') : null,
        isOnline: user.isOnline,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error mengambil data user:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil data user.' },
      { status: 500 }
    );
  }
}