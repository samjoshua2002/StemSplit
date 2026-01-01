import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ projects: [] });
        }

        const decoded: any = jwt.verify(token, JWT_SECRET);
        await dbConnect();

        const projects = await Project.find({ userId: decoded.userId }).sort({ createdAt: -1 });
        return NextResponse.json({ projects });
    } catch (error) {
        return NextResponse.json({ projects: [] });
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded: any = jwt.verify(token, JWT_SECRET);
        const { name, originalFile, stems } = await req.json();

        await dbConnect();

        const project = await Project.create({
            userId: decoded.userId,
            name,
            originalFile,
            stems,
        });

        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        console.error('Project creation error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
