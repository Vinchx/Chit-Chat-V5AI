// src/app/api/profile/update/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(request) {
  try {
    // Ambil session user yang sedang login
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { displayName, email, bio } = await request.json();

    await connectToDatabase();

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        ...(displayName && { displayName }),
        ...(email && { email }),
        ...(bio && { bio }),
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
