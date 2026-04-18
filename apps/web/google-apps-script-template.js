/**
 * Google Apps Script — Webhook SIGAP Dinas PUPR Papua Barat Daya
 * 
 * ═══════════════════════════════════════════════════════════════
 * CARA MEMASANG SCRIPT INI:
 * ═══════════════════════════════════════════════════════════════
 * 1. Buka https://script.google.com
 * 2. Buat project baru atau buka project yang sudah ada
 * 3. Paste seluruh kode ini, ganti SPREADSHEET_ID di bawah
 * 4. Klik Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Klik Deploy, lalu copy URL deployment
 * 6. Paste URL tersebut ke file .env sebagai GOOGLE_SCRIPT_URL
 * ═══════════════════════════════════════════════════════════════
 */

// ⬇️ GANTI INI DENGAN ID SPREADSHEET ANDA
// URL: https://docs.google.com/spreadsheets/d/[ID INI]/edit
const SPREADSHEET_ID = '1sbzkAw4aKdtKTyni23_VgqlWTrGTujGA4gAoGFqCA5I';

// ─────────────────────────────────────────────────────────────
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;

        if (action === 'SUBMIT_KONTRAKTOR') return handleKontraktor(data);
        if (action === 'SUBMIT_KEGIATAN') return handleKegiatan(data);
        if (action === 'SUBMIT_USER') return handleUser(data);
        if (action === 'CREATE' || action === 'UPDATE') return handleLegacyContractor(data);

        return ok('Action tidak dikenal, diabaikan');
    } catch (err) {
        return err_(err.message);
    }
}

// ─────────────────────────────────────────────────────────────
// Handler: Data Kontraktor OAP Lengkap
// ─────────────────────────────────────────────────────────────
function handleKontraktor(data) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const files = data.files || {};

    // ── Simpan file ke Google Drive (opsional: ambil dlm subfolder nm perusahaan)
    var mainFolder;
    try {
        mainFolder = getOrCreateFolder("SIGAP_DOCS_KONTRAKTOR");
        var companyFolder = getOrCreateFolder(data.namaPerusahaan, mainFolder);
    } catch (e) {
        Logger.log("Drive Error: " + e.message);
    }

    function save(fObj, prefix) {
        if (!fObj || !fObj.data) return "-";
        try {
            var blob = dataUriToBlob(fObj.data, prefix + "_" + fObj.name);
            var file = companyFolder.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            return file.getUrl();
        } catch (e) { return "Error: " + e.message; }
    }

    // Links
    const linkAkta = save(files.docAkta, "AKTA");
    const linkAktaPerubahan = save(files.docAktaPerubahan, "AKTA_PERUBAHAN");
    const linkNpwpDir = save(files.docNpwpDirektur, "NPWP_DIR");
    const linkNpwpPers = save(files.docNpwpPerusahaan, "NPWP_PERS");
    const linkSiujk = save(files.docSiujk, "SIUJK");
    const linkSmk3 = save(files.docSmk3, "SMK3");
    const linkRek = save(files.docRekening, "REKENING");

    // ── Sheet: Identitas Perusahaan
    appendToSheet(ss, 'Identitas Perusahaan', [
        'No', 'Waktu Input', 'Nama Perusahaan', 'Jenis Usaha', 'Direktur', 'NIK Direktur',
        'Telepon', 'Email', 'Alamat', 'Kota', 'Provinsi', 'Pengguna'
    ], [
        autoNo(ss, 'Identitas Perusahaan'), data.waktuInput, data.namaPerusahaan, data.jenisUsaha,
        data.namaDirektur, data.nikDirektur, data.telepon, data.email,
        data.alamat, data.kota, data.provinsi,
        data.penggunaNama + ' (' + data.penggunaEmail + ')'
    ]);

    // ── Sheet: Akta Perusahaan
    appendToSheet(ss, 'Akta Perusahaan', [
        'No', 'Nama Perusahaan', 'No Akta', 'Tgl Akta', 'Notaris', 'Tempat', 'SK Kemenkumham',
        'No Akta Perubahan', 'Tgl Perubahan', 'Notaris Perubahan', 'Link Dokumen', 'Link Perubahan'
    ], [
        autoNo(ss, 'Akta Perusahaan'), data.namaPerusahaan,
        data.aktaNo, data.aktaTanggal, data.aktaNotaris, data.aktaTempat, data.skKemenkumham,
        data.aktaPerubahanNo, data.aktaPerubahanTanggal, data.aktaPerubahanNotaris,
        linkAkta, linkAktaPerubahan
    ]);

    // ── Sheet: NPWP
    appendToSheet(ss, 'NPWP', [
        'No', 'Nama Perusahaan', 'NPWP Direktur', 'Atas Nama Direktur', 'NPWP Perusahaan', 'Atas Nama Perusahaan', 'Link NPWP Dir', 'Link NPWP Pers'
    ], [
        autoNo(ss, 'NPWP'), data.namaPerusahaan,
        data.npwpDirekturNo, data.npwpDirekturNama, data.npwpPerusahaanNo, data.npwpPerusahaanNama,
        linkNpwpDir, linkNpwpPers
    ]);

    // ── Sheet: SIUJK
    appendToSheet(ss, 'SIUJK', [
        'No', 'Nama Perusahaan', 'Nomor SIUJK', 'Tgl Terbit', 'Masa Berlaku', 'Klasifikasi', 'Kualifikasi', 'Penerbit', 'Link Dokumen'
    ], [
        autoNo(ss, 'SIUJK'), data.namaPerusahaan,
        data.siujkNo, data.siujkTanggal, data.siujkBerlaku, data.siujkKlasifikasi, data.siujkKualifikasi, data.siujkPenerbit,
        linkSiujk
    ]);

    // ── Sheet: SMK3
    appendToSheet(ss, 'SMK3', [
        'No', 'Nama Perusahaan', 'No Sertifikat', 'Tgl Terbit', 'Masa Berlaku', 'Lembaga', 'Tingkat', 'Link Sertifikat'
    ], [
        autoNo(ss, 'SMK3'), data.namaPerusahaan,
        data.smk3No, data.smk3Tanggal, data.smk3Berlaku, data.smk3Lembaga, data.smk3Tingkat,
        linkSmk3
    ]);

    // ── Sheet: Tenaga Ahli
    const taSheet = 'Tenaga Ahli';
    const taHeaders = ['No', 'Nama Perusahaan', 'Nama', 'Bidang Keahlian', 'Jenis Sertifikat', 'No Sertifikat', 'Masa Berlaku', 'Tingkat', 'Link Sertifikat'];
    if (data.tenagaAhli && data.tenagaAhli.length > 0) {
        data.tenagaAhli.forEach(function (ta) {
            if (!ta.nama) return;
            const linkSert = save(ta.docSertifikat, "TA_" + ta.nama.replace(/\s+/g, '_'));
            appendToSheet(ss, taSheet, taHeaders, [
                autoNo(ss, taSheet), data.namaPerusahaan,
                ta.nama, ta.bidang, ta.jenisSertifikat, ta.noSertifikat, ta.berlaku, ta.tingkat,
                linkSert
            ]);
        });
    }

    // ── Sheet: Rekening Bank
    appendToSheet(ss, 'Rekening Bank', [
        'No', 'Nama Perusahaan', 'Bank', 'Cabang', 'No Rekening', 'Atas Nama', 'Link Buku Tabungan'
    ], [
        autoNo(ss, 'Rekening Bank'), data.namaPerusahaan,
        data.bankNama, data.bankCabang, data.bankNoRek, data.bankAtasNama,
        linkRek
    ]);

    return ok('Data & Dokumen kontraktor OAP berhasil disimpan');
}

// ─────────────────────────────────────────────────────────────
// Handler: Data User
// ─────────────────────────────────────────────────────────────
function handleUser(data) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    appendToSheet(ss, 'Users', [
        'No', 'Waktu', 'Nama', 'Email', 'Role'
    ], [
        autoNo(ss, 'Users'), data.timestamp || new Date().toISOString(), data.name, data.email, data.role
    ]);
    return ok('Data user berhasil disimpan ke Sheets');
}

// ─────────────────────────────────────────────────────────────
// Drive Helpers
// ─────────────────────────────────────────────────────────────
function getOrCreateFolder(name, parent) {
    var folders = (parent || DriveApp).getFoldersByName(name);
    if (folders.hasNext()) return folders.next();
    return (parent || DriveApp).createFolder(name);
}

function dataUriToBlob(dataUri, fileName) {
    var parts = dataUri.split(',');
    var contentType = parts[0].split(':')[1].split(';')[0];
    var decoded = Utilities.base64Decode(parts[1]);
    return Utilities.newBlob(decoded, contentType, fileName);
}

// ─────────────────────────────────────────────────────────────
// Handler: Data Kegiatan (legacy)
// ─────────────────────────────────────────────────────────────
function handleKegiatan(data) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    appendToSheet(ss, 'Data Kegiatan', [
        'No', 'Waktu', 'Nama Kegiatan', 'Jenis', 'Lokasi', 'Kontraktor', 'Nilai Kontrak', 'Mulai', 'Selesai', 'Progres%', 'Keterangan', 'Pengguna'
    ], [
        autoNo(ss, 'Data Kegiatan'), data.waktuInput, data.namaKegiatan, data.jenisKegiatan,
        data.lokasi, data.kontraktor, data.nilaiKontrak, data.tanggalMulai, data.tanggalSelesai,
        data.progres, data.keterangan, data.penggunaNama
    ]);
    return ok('Data kegiatan berhasil disimpan');
}

function handleLegacyContractor(data) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const c = data.contractor || {};
    appendToSheet(ss, 'Kontrak', ['ID', 'NIK', 'Nama', 'Perusahaan', 'Status', 'Timestamp'],
        [c.id, c.nik, c.full_name, c.company_name, c.status, data.timestamp]);
    return ok('OK');
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function appendToSheet(ss, name, headers, row) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
        sheet = ss.insertSheet(name);
        var headerRange = sheet.getRange(1, 1, 1, headers.length);
        headerRange.setValues([headers]);
        headerRange.setBackground('#1a3a6b').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(10);
        sheet.setFrozenRows(1);
        sheet.setColumnWidth(1, 40);
    }
    sheet.appendRow(row);
}

function autoNo(ss, name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) return 1;
    var last = sheet.getLastRow();
    return Math.max(last, 1); // baris 1 = header, so last = jumlah data
}

function ok(msg) {
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: msg })).setMimeType(ContentService.MimeType.JSON);
}

function err_(msg) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: msg })).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'SIGAP PUPR PBD aktif', timestamp: new Date().toISOString() })).setMimeType(ContentService.MimeType.JSON);
}
