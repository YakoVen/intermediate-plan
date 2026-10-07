import { NextResponse } from 'next/server';
// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY || 'test');
// const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

export async function POST(request: Request) {
  try {
    const { type } = await request.json();

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not set. Simulating email sending.');
      return NextResponse.json({ success: true, simulated: true, type });
    }

    // Email sending logic using Resend would go here based on `type`.
    // Example:
    /*
    if (type === 'admin_alert') {
      await resend.emails.send({
        from: 'alerts@yourstore.com',
        to: adminEmail,
        subject: 'Nouvelle alerte admin',
        html: `<p>Détails: ${JSON.stringify(data)}</p>`
      });
    }
    */

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}
