/**
 * API Route: POST /api/submit-kegiatan
 * Receives form data and forwards to Google Sheets via Apps Script webhook
 */

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

export async function POST(request) {
    try {
        const body = await request.json();

        const {
            namaKegiatan,
            jenisKegiatan,
            lokasi,
            nilaiKontrak,
            kontraktor,
            tanggalMulai,
            tanggalSelesai,
            progres,
            keterangan,
            penggunaEmal,
            penggunaNama,
            waktuInput,
        } = body;

        // Validate required fields
        const required = { namaKegiatan, jenisKegiatan, lokasi, nilaiKontrak, kontraktor, tanggalMulai, tanggalSelesai };
        for (const [key, val] of Object.entries(required)) {
            if (!val) {
                return Response.json({ error: `Field ${key} wajib diisi` }, { status: 400 });
            }
        }

        const payload = {
            action: 'SUBMIT_KEGIATAN',
            timestamp: new Date().toISOString(),
            namaKegiatan,
            jenisKegiatan,
            lokasi,
            nilaiKontrak: Number(nilaiKontrak),
            kontraktor,
            tanggalMulai,
            tanggalSelesai,
            progres: Number(progres) || 0,
            keterangan: keterangan || '',
            penggunaEmail: penggunaEmal || '',
            penggunaNama: penggunaNama || '',
            waktuInput: waktuInput || new Date().toLocaleString('id-ID'),
        };

        // If Google Script URL is configured, send there
        if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes('XXXXXXXXX')) {
            try {
                const gsRes = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!gsRes.ok) {
                    console.error('Google Sheets error:', await gsRes.text());
                }
            } catch (err) {
                console.error('Failed to send to Google Sheets:', err.message);
                // Don't fail the request — just log the error
            }
        } else {
            console.warn('GOOGLE_SCRIPT_URL not configured — data not sent to Google Sheets');
        }

        return Response.json({
            ok: true,
            message: 'Data berhasil disimpan',
            data: payload,
        });

    } catch (error) {
        console.error('Submit error:', error);
        return Response.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
