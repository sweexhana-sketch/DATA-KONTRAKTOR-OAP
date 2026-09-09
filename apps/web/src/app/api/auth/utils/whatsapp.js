/**
 * Utility kirim pesan OTP via WhatsApp menggunakan Fonnte API
 * Env vars:
 *   FONNTE_TOKEN = Token dari https://fonnte.com
 */

export async function sendOtpWhatsApp({ phone, otp, name }) {
  const token = process.env.FONNTE_TOKEN;
  
  if (!token) {
    const errorMsg = '[whatsapp] FONNTE_TOKEN belum disetel di environment variables.';
    console.warn(errorMsg);
    console.log(`\n=============================`);
    console.log(`  OTP WhatsApp untuk ${phone}: ${otp}`);
    console.log(`=============================\n`);
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    }
    return;
  }

  // Bersihkan format nomor HP (ubah 08... menjadi 628...)
  let targetPhone = phone.trim().replace(/[^0-9]/g, '');
  if (targetPhone.startsWith('0')) {
    targetPhone = '62' + targetPhone.substring(1);
  }

  const message = `*Sistem Pendataan Kontraktor OAP* \n\nHalo *${name || 'Pengguna'}*,\n\nKode OTP Anda adalah: *${otp}*\n\nKode ini berlaku selama 5 menit. Mohon JANGAN memberikan kode ini kepada siapapun.`;

  try {
    console.log(`[whatsapp] Mencoba mengirim OTP ke WA ${targetPhone}...`);
    
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token
      },
      body: new URLSearchParams({
        target: targetPhone,
        message: message,
        countryCode: '62'
      })
    });

    const data = await response.json();
    if (!data.status) {
      throw new Error(data.reason || 'Gagal mengirim pesan via Fonnte');
    }

    console.log(`[whatsapp] OTP berhasil dikirim ke WA ${targetPhone}.`);
  } catch (err) {
    console.error('❌ [whatsapp] GAGAL KIRIM WA OTP:', err.message);
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    console.log(`[whatsapp] Fallback Console OTP: ${otp}`);
  }
}
