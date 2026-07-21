import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name')?.toString() ?? '';
    const email = formData.get('email')?.toString() ?? '';
    const message = formData.get('message')?.toString() ?? '';

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, message: 'Please fill all fields.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Thanks ${name}! Your message has been received.`,
      details: { email, message }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Something went wrong.' }, { status: 500 });
  }
}
