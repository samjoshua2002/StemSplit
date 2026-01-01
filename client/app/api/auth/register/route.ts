import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Please provide all fields' }, { status: 400 });
        }

        await dbConnect();

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Create user
        const user = await User.create({ name, email, password });

        // Generate JWT - 30 days
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

        const response = NextResponse.json(
            { message: 'User registered successfully', user: { name: user.name, email: user.email } },
            { status: 201 }
        );

        // Set cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
