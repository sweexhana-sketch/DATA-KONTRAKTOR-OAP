import sql from "@/app/api/utils/sql";

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

export async function POST(request) {
    try {
        const body = await request.json();
        const { 
            namaPerusahaan, 
            namaDirektur, 
            nikDirektur,
            jenisUsaha,
            alamat,
            kota,
            telepon,
            email,
            siujkKlasifikasi,
            npwpPerusahaanNo
        } = body;

        if (!namaPerusahaan || !namaDirektur) {
            return Response.json({ error: 'Nama perusahaan dan nama direktur wajib diisi' }, { status: 400 });
        }

        // 1. Simpan ke Database Postgres (untuk sinkronisasi ke SI PRO)
        try {
            // Cek jika NIK sudah ada untuk menghindari duplikat
            const existing = await sql`SELECT id FROM contractors WHERE nik = ${nikDirektur || 'UNKNOWN'}`;
            
            if (existing.length > 0) {
                // Update existing record
                await sql`
                    UPDATE contractors SET
                        company_name = ${namaPerusahaan},
                        full_name = ${namaDirektur},
                        company_type = ${jenisUsaha || null},
                        company_address = ${alamat || null},
                        city = ${kota || null},
                        phone = ${telepon || null},
                        email = ${email || null},
                        small_classification = ${siujkKlasifikasi || null},
                        npwp = ${npwpPerusahaanNo || null},
                        status = 'pending',
                        updated_at = NOW()
                    WHERE nik = ${nikDirektur}
                `;
                console.log(`[DB] Updated existing contractor: ${namaPerusahaan}`);
            } else {
                // Insert new record
                await sql`
                    INSERT INTO contractors (
                        nik,
                        full_name,
                        company_name,
                        company_type,
                        company_address,
                        city,
                        phone,
                        email,
                        small_classification,
                        npwp,
                        status
                    ) VALUES (
                        ${nikDirektur || 'OAP-' + Date.now()},
                        ${namaDirektur},
                        ${namaPerusahaan},
                        ${jenisUsaha || null},
                        ${alamat || null},
                        ${kota || null},
                        ${telepon || null},
                        ${email || null},
                        ${siujkKlasifikasi || null},
                        ${npwpPerusahaanNo || null},
                        'pending'
                    )
                `;
                console.log(`[DB] Inserted new contractor: ${namaPerusahaan}`);
            }
        } catch (dbErr) {
            console.error('[DB] Database sync error:', dbErr);
            // Lanjut ke Google Sheets meskipun DB gagal
        }

        const payload = {
            action: 'SUBMIT_KONTRAKTOR',
            timestamp: new Date().toISOString(),
            ...body,
        };

        // 2. Kirim ke Google Sheets (Legacy Sync)
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
        }

        return Response.json({ ok: true, message: `Data perusahaan "${namaPerusahaan}" berhasil disimpan ke Database & Spreadsheet` });

    } catch (error) {
        console.error('Error submit-kontraktor:', error);
        return Response.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
