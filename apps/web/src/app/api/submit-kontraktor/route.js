/**
 * POST /api/submit-kontraktor
 * Menerima data perusahaan kontraktor OAP dan meneruskannya ke Google Sheets
 */

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

export async function POST(request) {
    try {
        const body = await request.json();
        const { namaPerusahaan, namaDirektur } = body;

        if (!namaPerusahaan || !namaDirektur) {
            return Response.json({ error: 'Nama perusahaan dan nama direktur wajib diisi' }, { status: 400 });
        }

        const payload = {
            action: 'SUBMIT_KONTRAKTOR',
            timestamp: new Date().toISOString(),
            ...body,
        };

        // Kirim ke Google Sheets jika URL sudah dikonfigurasi
        if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes('XXXXXXXXX')) {
            try {
                const gsRes = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!gsRes.ok) {
                    console.error('Google Sheets error:', gsRes.status, await gsRes.text());
                } else {
                    console.log('Data kontraktor berhasil dikirim ke Google Sheets');
                }
            } catch (err) {
                console.error('Gagal menghubungi Google Sheets:', err.message);
            }
        } else {
            console.warn('GOOGLE_SCRIPT_URL belum dikonfigurasi — data tidak dikirim ke Sheets');
        }

        return Response.json({ ok: true, message: `Data perusahaan "${namaPerusahaan}" berhasil disimpan` });

    } catch (error) {
        console.error('Error submit-kontraktor:', error);
        return Response.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
