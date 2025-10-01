import connectToDatabase from "@/lib/mongodb";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";


export async function POST(request) {
    try {
        const { login, password } = await request.json();
        if (!login || !password) {
            return Response.json({
                success: false,
                message: "username/email dan password wajib diisi"
            }, { status: 400 });

        }
        await connectToDatabase()
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users')

        const user = await usersCollection.findOne({
            $or: [{ username: login }, { email: login }]
        });

        if (!user) {
            return Response.json({
                success: false,
                message: "Username/email tidak ditemukan!"
            }, { status: 404 });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return Response.json({
                success: false,
                message: "password salah"
            }, { status: 401 });
        }

        const tokenData = {
            userId: user._id,
            username: user.username,
            email: user.email,
            displayName: user.displayName
        };

        const token = jwt.sign(
            tokenData,
            'secretbet',
            { expiresIn: '7d' }
        );

        return Response.json({
            success: true,
            message: "Login berhasil! Selamat datang! 🎉",
            token: token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName
            }
        }, { status: 200 });
    } catch (error) {
        return Response.json({
            success: false,
            message: "eror jir",
            error: error.message
        }, { status: 500 });
    }

}