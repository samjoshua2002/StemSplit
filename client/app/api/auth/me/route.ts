import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ user: null });
        }

        const decoded: any = jwt.verify(token, JWT_SECRET);
        await dbConnect();

        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({
            user: {
                name: user.name,
                email: user.email,
                id: user._id
            }
        });
    } catch (error) {
        return NextResponse.json({ user: null });
    }
}
