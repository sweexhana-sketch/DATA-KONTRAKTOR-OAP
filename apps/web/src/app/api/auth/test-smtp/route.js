/**
 * GET /api/auth/test-smtp
 * Endpoint khusus untuk cek apakah SMTP sudah terkonfigurasi dengan benar
 */
import { testSmtpConnection } from '@/app/api/auth/utils/mailer';

export async function GET() {
  const result = await testSmtpConnection();
  
  if (result.ok) {
    return Response.json({ 
      ok: true, 
      message: result.message,
      config: {
        user: process.env.SMTP_USER ? 'TERISI' : 'KOSONG',
        pass: process.env.SMTP_PASS ? 'TERISI' : 'KOSONG',
        from: process.env.SMTP_FROM || 'DEFAULT'
      }
    });
  } else {
    return Response.json({ 
      ok: false, 
      error: result.error,
      help: 'Pastikan environment variables SMTP_USER dan SMTP_PASS sudah disetel di Vercel Dashboard.'
    }, { status: 500 });
  }
}
