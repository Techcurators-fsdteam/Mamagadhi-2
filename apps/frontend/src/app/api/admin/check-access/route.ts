import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check for admin session in localStorage (this will be handled client-side)
    // For now, just return success as authentication is handled by the React components
    return NextResponse.json({ access: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (username === expectedUsername && password === expectedPassword) {
      return NextResponse.json({ access: true, token: 'admin-authenticated' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
