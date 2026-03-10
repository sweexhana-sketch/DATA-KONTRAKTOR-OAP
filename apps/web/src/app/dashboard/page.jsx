import { useState, useEffect } from "react";
import { signOut, useSession } from "@auth/create/react";
import logoPBD from "@/assets/logo-papua-barat-daya.png";

const TABS = [
    { id: "identitas", label: "Identitas Perusahaan", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { id: "akta", label: "Akta Perusahaan", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { id: "npwp", label: "NPWP", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
    { id: "siujk", label: "SIUJK", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { id: "smk3", label: "SMK3", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { id: "tenagaAhli", label: "Tenaga Ahli", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { id: "rekening", label: "Rekening Bank", icon: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" },
];

const initialForm = {
    // Identitas
    namaPerusahaan: "", jenisUsaha: "", alamat: "", kota: "", provinsi: "Papua Barat Daya",
    telepon: "", email: "", website: "", namaDirektur: "", nikDirektur: "",
    // Akta
    aktaNo: "", aktaTanggal: "", aktaNotaris: "", aktaTempat: "", skKemenkumham: "",
    aktaPerubahanNo: "", aktaPerubahanTanggal: "", aktaPerubahanNotaris: "",
    // NPWP
    npwpDirekturNo: "", npwpDirekturNama: "",
    npwpPerusahaanNo: "", npwpPerusahaanNama: "",
    // SIUJK
    siujkNo: "", siujkTanggal: "", siujkBerlaku: "", siujkKlasifikasi: "", siujkKualifikasi: "",
    siujkPenerbit: "",
    // SMK3
    smk3No: "", smk3Tanggal: "", smk3Berlaku: "", smk3Lembaga: "", smk3Tingkat: "",
    // Rekening
    bankNama: "", bankNoRek: "", bankAtasNama: "", bankCabang: "",
};

// File state keys
const FILE_FIELDS = [
    "docAkta", "docAktaPerubahan", "docNpwpDirektur", "docNpwpPerusahaan",
    "docSiujk", "docSmk3", "docRekening"
];

function SectionHeader({ icon, title, subtitle }) {
    return (
        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #1a3a6b, #2563eb)" }}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
                </svg>
            </div>
            <div>
                <h3 className="text-base font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
        </div>
    );
}

function Field({ label, required, children, half }) {
    return (
        <div className={half ? "" : "md:col-span-2"}>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                {label} {required && <span className="text-red-500 normal-case">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputCls = "w-full h-11 px-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1a3a6b] transition-all bg-white";
const fileCls = "w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer";
const selectCls = inputCls;

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState("identitas");
    const [form, setForm] = useState(initialForm);
    const [files, setFiles] = useState({});
    const [tenagaAhli, setTenagaAhli] = useState([{ nama: "", bidang: "", jenisSertifikat: "", noSertifikat: "", berlaku: "", tingkat: "", docSertifikat: null }]);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [records, setRecords] = useState([]);

    useEffect(() => {
        // Log status for debugging on Vercel
        console.log("[Dashboard] Session status:", status);

        if (status === "unauthenticated") {
            const timer = setTimeout(() => {
                console.log("[Dashboard] Status still unauthenticated after delay, redirecting...");
                window.location.href = "/account/signin";
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [status]);

    useEffect(() => {
        try { setRecords(JSON.parse(localStorage.getItem("oap_records") || "[]")); } catch { }
    }, []);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 font-['Inter']">
                <div className="text-center animate-pulse">
                    <img src={logoPBD} alt="Logo" className="w-20 h-20 mx-auto mb-4 opacity-80" />
                    <p className="text-gray-500 font-medium tracking-wide">Memverifikasi Sesi...</p>
                </div>
            </div>
        );
    }

    const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

    const handleFileChange = (field, taIndex = null) => async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Limit size to 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert("Ukuran file maksimal 5MB");
            e.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64Data = reader.result;
            if (taIndex !== null) {
                setTenagaAhli(p => p.map((ta, idx) => idx === taIndex ? { ...ta, [field]: { name: file.name, type: file.type, data: base64Data } } : ta));
            } else {
                setFiles(p => ({ ...p, [field]: { name: file.name, type: file.type, data: base64Data } }));
            }
        };
        reader.readAsDataURL(file);
    };

    const addTenagaAhli = () => setTenagaAhli(p => [...p, { nama: "", bidang: "", jenisSertifikat: "", noSertifikat: "", berlaku: "", tingkat: "", docSertifikat: null }]);
    const removeTenagaAhli = (i) => setTenagaAhli(p => p.filter((_, idx) => idx !== i));
    const setTA = (i, field) => (e) => setTenagaAhli(p => p.map((ta, idx) => idx === i ? { ...ta, [field]: e.target.value } : ta));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setResult(null);
        if (!form.namaPerusahaan || !form.namaDirektur) {
            setResult({ ok: false, message: "Minimal isi Nama Perusahaan dan Nama Direktur" });
            setSubmitting(false);
            return;
        }
        try {
            const payload = {
                ...form,
                files,
                tenagaAhli,
                penggunaEmail: session?.user?.email,
                penggunaNama: session?.user?.name,
                waktuInput: new Date().toLocaleString("id-ID")
            };

            const res = await fetch("/api/submit-kontraktor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                setResult({ ok: true, message: `Data perusahaan "${form.namaPerusahaan}" berhasil disimpan dan dikirim ke Google Sheets!` });
                const updated = [{ ...payload, id: Date.now() }, ...records].slice(0, 100);
                setRecords(updated);
                localStorage.setItem("oap_records", JSON.stringify(updated));
                // Reset files after success
                setFiles({});
            } else {
                setResult({ ok: false, message: data.error || "Gagal menyimpan data." });
            }
        } catch { setResult({ ok: false, message: "Terjadi kesalahan koneksi." }); }
        finally { setSubmitting(false); }
    };

    const currentTabIdx = TABS.findIndex(t => t.id === activeTab);

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Top Nav */}
            <header className="bg-white border-b-2 border-gray-100 shadow-sm sticky top-0 z-30">
                <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <img src={logoPBD} alt="Logo PBD" className="w-10 h-10 object-contain" />
                        <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Dinas PUPR</div>
                            <div className="text-sm font-black text-[#1a3a6b] leading-tight">Provinsi Papua Barat Daya</div>
                        </div>
                    </div>
                    <div className="hidden md:block text-center">
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Sistem Pendataan</div>
                        <div className="text-sm font-bold text-gray-800">Kontraktor OAP</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <div className="text-sm font-semibold text-gray-800">{session?.user?.name || "Pengguna"}</div>
                            <div className="text-xs text-gray-400">{session?.user?.email}</div>
                        </div>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "linear-gradient(135deg, #1a3a6b, #2563eb)" }}>
                            {(session?.user?.name || "U")[0].toUpperCase()}
                        </div>
                        <button onClick={() => signOut({ callbackUrl: "/account/signin" })} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition px-2.5 py-1.5 rounded-lg hover:bg-red-50 border border-gray-200">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Keluar
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-screen-xl mx-auto px-4 py-8">
                {/* Hero Banner */}
                <div className="rounded-2xl mb-8 p-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a3a6b 0%, #1d4ed8 60%, #7c3aed 100%)" }}>
                    <div className="absolute right-0 top-0 bottom-0 w-64 opacity-10 flex items-center justify-end pr-6">
                        <img src={logoPBD} alt="" className="w-40 h-40 object-contain" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-xs uppercase tracking-wider text-blue-200 font-semibold mb-1">Sistem Informasi</div>
                        <h2 className="text-2xl font-black mb-1">Pendataan Kontraktor OAP</h2>
                        <p className="text-blue-100 text-sm max-w-xl">
                            Selamat datang, <strong>{session?.user?.name}</strong>. Isi data perusahaan kontraktor Orang Asli Papua secara lengkap. Data yang diinput akan otomatis tersimpan ke Google Sheets Dinas PUPR.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Tab Navigation */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
                        <div className="flex overflow-x-auto scrollbar-hide">
                            {TABS.map((tab, i) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-4 text-xs font-semibold whitespace-nowrap transition-all border-b-3 flex-shrink-0 ${activeTab === tab.id
                                        ? "border-b-2 border-[#1a3a6b] text-[#1a3a6b] bg-blue-50"
                                        : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon} />
                                    </svg>
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{i + 1}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#1a3a6b] to-[#2563eb] rounded-full transition-all" style={{ width: `${((currentTabIdx + 1) / TABS.length) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{currentTabIdx + 1} / {TABS.length}</span>
                    </div>

                    {/* Form Content */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">

                        {/* === TAB 1: IDENTITAS PERUSAHAAN === */}
                        {activeTab === "identitas" && (
                            <>
                                <SectionHeader icon={TABS[0].icon} title="Identitas Perusahaan" subtitle="Data dasar perusahaan kontraktor OAP" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Field label="Nama Perusahaan" required>
                                            <input value={form.namaPerusahaan} onChange={set("namaPerusahaan")} placeholder="PT / CV / UD nama perusahaan" className={inputCls} />
                                        </Field>
                                    </div>
                                    <Field label="Jenis Badan Usaha" required half>
                                        <select value={form.jenisUsaha} onChange={set("jenisUsaha")} className={selectCls}>
                                            <option value="">Pilih Jenis Usaha</option>
                                            {["PT (Perseroan Terbatas)", "CV (Comanditaire Vennootschap)", "Firma", "UD (Usaha Dagang)", "Koperasi"].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Nama Direktur Utama" required half>
                                        <input value={form.namaDirektur} onChange={set("namaDirektur")} placeholder="Nama lengkap direktur" className={inputCls} />
                                    </Field>
                                    <Field label="NIK Direktur" required half>
                                        <input value={form.nikDirektur} onChange={set("nikDirektur")} placeholder="16 digit NIK" maxLength={16} className={inputCls} />
                                    </Field>
                                    <Field label="Nomor Telepon" required half>
                                        <input value={form.telepon} onChange={set("telepon")} placeholder="08xx-xxxx-xxxx" className={inputCls} />
                                    </Field>
                                    <Field label="Email Perusahaan" half>
                                        <input type="email" value={form.email} onChange={set("email")} placeholder="email@perusahaan.com" className={inputCls} />
                                    </Field>
                                    <Field label="Website" half>
                                        <input value={form.website} onChange={set("website")} placeholder="www.perusahaan.com (opsional)" className={inputCls} />
                                    </Field>
                                    <div className="md:col-span-2">
                                        <Field label="Alamat Lengkap Perusahaan" required>
                                            <textarea value={form.alamat} onChange={set("alamat")} rows={2} placeholder="Jalan, kelurahan, kecamatan" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1a3a6b] transition-all resize-none" />
                                        </Field>
                                    </div>
                                    <Field label="Kota / Kabupaten" required half>
                                        <input value={form.kota} onChange={set("kota")} placeholder="Kota / Kabupaten" className={inputCls} />
                                    </Field>
                                    <Field label="Provinsi" half>
                                        <input value={form.provinsi} onChange={set("provinsi")} className={inputCls} readOnly />
                                    </Field>
                                </div>
                            </>
                        )}

                        {/* === TAB 2: AKTA PERUSAHAAN === */}
                        {activeTab === "akta" && (
                            <>
                                <SectionHeader icon={TABS[1].icon} title="Akta Perusahaan" subtitle="Data akta pendirian dan perubahan perusahaan" />
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-[#1a3a6b]" />
                                        <h4 className="text-sm font-bold text-gray-800">Akta Pendirian Perusahaan</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Field label="Nomor Akta" required half>
                                            <input value={form.aktaNo} onChange={set("aktaNo")} placeholder="Nomor akta pendirian" className={inputCls} />
                                        </Field>
                                        <Field label="Tanggal Akta" required half>
                                            <input type="date" value={form.aktaTanggal} onChange={set("aktaTanggal")} className={inputCls} />
                                        </Field>
                                        <Field label="Nama Notaris" required half>
                                            <input value={form.aktaNotaris} onChange={set("aktaNotaris")} placeholder="Nama notaris penerbit" className={inputCls} />
                                        </Field>
                                        <Field label="Tempat / Kota Notaris" half>
                                            <input value={form.aktaTempat} onChange={set("aktaTempat")} placeholder="Kota tempat akta dibuat" className={inputCls} />
                                        </Field>
                                        <Field label="Upload Akta Pendirian (PDF/JPG)" required>
                                            <input type="file" onChange={handleFileChange("docAkta")} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                            {files.docAkta && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ {files.docAkta.name}</p>}
                                        </Field>
                                        <div className="md:col-span-2">
                                            <Field label="SK Pengesahan Kemenkumham">
                                                <input value={form.skKemenkumham} onChange={set("skKemenkumham")} placeholder="Nomor SK Kemenkumham (jika ada)" className={inputCls} />
                                            </Field>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-5 border-t border-dashed border-gray-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                        <h4 className="text-sm font-bold text-gray-800">Akta Perubahan (Jika Ada)</h4>
                                        <span className="text-xs text-gray-400 italic">— opsional</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Field label="Nomor Akta Perubahan" half>
                                            <input value={form.aktaPerubahanNo} onChange={set("aktaPerubahanNo")} placeholder="Nomor akta perubahan terakhir" className={inputCls} />
                                        </Field>
                                        <Field label="Tanggal Perubahan" half>
                                            <input type="date" value={form.aktaPerubahanTanggal} onChange={set("aktaPerubahanTanggal")} className={inputCls} />
                                        </Field>
                                        <Field label="Notaris Perubahan" half>
                                            <input value={form.aktaPerubahanNotaris} onChange={set("aktaPerubahanNotaris")} placeholder="Nama notaris akta perubahan" className={inputCls} />
                                        </Field>
                                        <Field label="Upload Akta Perubahan (PDF/JPG)">
                                            <input type="file" onChange={handleFileChange("docAktaPerubahan")} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                            {files.docAktaPerubahan && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ {files.docAktaPerubahan.name}</p>}
                                        </Field>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* === TAB 3: NPWP === */}
                        {activeTab === "npwp" && (
                            <>
                                <SectionHeader icon={TABS[2].icon} title="Nomor Pokok Wajib Pajak (NPWP)" subtitle="NPWP Direktur dan NPWP Perusahaan" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 bg-[#1a3a6b] rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-800">NPWP Direktur</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <Field label="Nomor NPWP Direktur" required half>
                                                <input value={form.npwpDirekturNo} onChange={set("npwpDirekturNo")} placeholder="XX.XXX.XXX.X-XXX.XXX" className={inputCls} />
                                            </Field>
                                            <Field label="Atas Nama" required half>
                                                <input value={form.npwpDirekturNama} onChange={set("npwpDirekturNama")} placeholder="Nama sesuai NPWP direktur" className={inputCls} />
                                            </Field>
                                            <Field label="Upload NPWP Direktur (PDF/JPG)" required>
                                                <input type="file" onChange={handleFileChange("docNpwpDirektur")} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                                {files.docNpwpDirektur && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ {files.docNpwpDirektur.name}</p>}
                                            </Field>
                                        </div>
                                    </div>
                                    <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-800">NPWP Perusahaan</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <Field label="Nomor NPWP Perusahaan" required half>
                                                <input value={form.npwpPerusahaanNo} onChange={set("npwpPerusahaanNo")} placeholder="XX.XXX.XXX.X-XXX.XXX" className={inputCls} />
                                            </Field>
                                            <Field label="Atas Nama" required half>
                                                <input value={form.npwpPerusahaanNama} onChange={set("npwpPerusahaanNama")} placeholder="Nama sesuai NPWP perusahaan" className={inputCls} />
                                            </Field>
                                            <Field label="Upload NPWP Perusahaan (PDF/JPG)" required>
                                                <input type="file" onChange={handleFileChange("docNpwpPerusahaan")} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                                {files.docNpwpPerusahaan && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ {files.docNpwpPerusahaan.name}</p>}
                                            </Field>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* === TAB 4: SIUJK === */}
                        {activeTab === "siujk" && (
                            <>
                                <SectionHeader icon={TABS[3].icon} title="Surat Izin Usaha Jasa Konstruksi (SIUJK)" subtitle="Izin usaha resmi bidang konstruksi" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Field label="Nomor SIUJK" required>
                                            <input value={form.siujkNo} onChange={set("siujkNo")} placeholder="Nomor SIUJK" className={inputCls} />
                                        </Field>
                                    </div>
                                    <Field label="Tanggal Terbit" required half>
                                        <input type="date" value={form.siujkTanggal} onChange={set("siujkTanggal")} className={inputCls} />
                                    </Field>
                                    <Field label="Masa Berlaku s/d" required half>
                                        <input type="date" value={form.siujkBerlaku} onChange={set("siujkBerlaku")} className={inputCls} />
                                    </Field>
                                    <Field label="Klasifikasi" required half>
                                        <select value={form.siujkKlasifikasi} onChange={set("siujkKlasifikasi")} className={selectCls}>
                                            <option value="">Pilih Klasifikasi</option>
                                            {["Sipil", "Mekanikal", "Elektrikal", "Tata Lingkungan", "Manajemen Pelaksanaan"].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Kualifikasi" required half>
                                        <select value={form.siujkKualifikasi} onChange={set("siujkKualifikasi")} className={selectCls}>
                                            <option value="">Pilih Kualifikasi</option>
                                            {["Kecil (K1)", "Kecil (K2)", "Kecil (K3)", "Menengah (M1)", "Menengah (M2)", "Besar (B1)", "Besar (B2)"].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Upload SIUJK (PDF/JPG)" required>
                                        <input type="file" onChange={handleFileChange("docSiujk")} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                        {files.docSiujk && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ {files.docSiujk.name}</p>}
                                    </Field>
                                    <div className="md:col-span-2">
                                        <Field label="Lembaga / Instansi Penerbit">
                                            <input value={form.siujkPenerbit} onChange={set("siujkPenerbit")} placeholder="Nama instansi yang menerbitkan SIUJK" className={inputCls} />
                                        </Field>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* === TAB 5: SMK3 === */}
                        {activeTab === "smk3" && (
                            <>
                                <SectionHeader icon={TABS[4].icon} title="Sistem Manajemen K3 (SMK3)" subtitle="Sertifikat Keselamatan dan Kesehatan Kerja" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Field label="Nomor Sertifikat SMK3" required>
                                            <input value={form.smk3No} onChange={set("smk3No")} placeholder="Nomor sertifikat SMK3" className={inputCls} />
                                        </Field>
                                    </div>
                                    <Field label="Tanggal Terbit" required half>
                                        <input type="date" value={form.smk3Tanggal} onChange={set("smk3Tanggal")} className={inputCls} />
                                    </Field>
                                    <Field label="Masa Berlaku s/d" required half>
                                        <input type="date" value={form.smk3Berlaku} onChange={set("smk3Berlaku")} className={inputCls} />
                                    </Field>
                                    <Field label="Lembaga Sertifikasi" required half>
                                        <input value={form.smk3Lembaga} onChange={set("smk3Lembaga")} placeholder="Nama lembaga sertifikasi K3" className={inputCls} />
                                    </Field>
                                    <Field label="Tingkat Penilaian" half>
                                        <select value={form.smk3Tingkat} onChange={set("smk3Tingkat")} className={selectCls}>
                                            <option value="">Pilih Tingkat</option>
                                            {["Memuaskan (≥85%)", "Baik (64%-85%)", "Perlu Peningkatan (<64%)", "Belum Tersertifikasi"].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Upload Sertifikat SMK3 (PDF/JPG)" required>
                                        <input type="file" onChange={handleFileChange("docSmk3")} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                        {files.docSmk3 && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ {files.docSmk3.name}</p>}
                                    </Field>
                                </div>
                            </>
                        )}

                        {/* === TAB 6: TENAGA AHLI === */}
                        {activeTab === "tenagaAhli" && (
                            <>
                                <SectionHeader icon={TABS[5].icon} title="Tenaga Ahli & Tenaga Terampil" subtitle="Daftar SKA / SKT yang dimiliki perusahaan" />
                                <div className="space-y-4">
                                    {tenagaAhli.map((ta, i) => (
                                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-bold text-[#1a3a6b] uppercase tracking-wide">Personil #{i + 1}</span>
                                                {tenagaAhli.length > 1 && (
                                                    <button type="button" onClick={() => removeTenagaAhli(i)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        Hapus
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Nama Lengkap *</label>
                                                    <input value={ta.nama} onChange={setTA(i, "nama")} placeholder="Nama tenaga ahli" className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Bidang Keahlian *</label>
                                                    <input value={ta.bidang} onChange={setTA(i, "bidang")} placeholder="e.g. Sipil, Arsitektur" className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Jenis Sertifikat</label>
                                                    <select value={ta.jenisSertifikat} onChange={setTA(i, "jenisSertifikat")} className={selectCls}>
                                                        <option value="">Pilih Jenis</option>
                                                        <option value="SKA">SKA (Sertifikat Keahlian)</option>
                                                        <option value="SKT">SKT (Sertifikat Ketrampilan)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Nomor Sertifikat</label>
                                                    <input value={ta.noSertifikat} onChange={setTA(i, "noSertifikat")} placeholder="Nomor SKA/SKT" className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Masa Berlaku</label>
                                                    <input type="date" value={ta.berlaku} onChange={setTA(i, "berlaku")} className={inputCls} />
                                                </div>
                                                <div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Tingkat</label>
                                                        <select value={ta.tingkat} onChange={setTA(i, "tingkat")} className={selectCls}>
                                                            <option value="">Pilih Tingkat</option>
                                                            {["Muda", "Madya", "Utama", "Terampil"].map(v => <option key={v} value={v}>{v}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="md:col-span-3">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Upload Sertifikat SKA/SKT *</label>
                                                    <input type="file" onChange={handleFileChange("docSertifikat", i)} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                                    {ta.docSertifikat && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ {ta.docSertifikat.name}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addTenagaAhli} className="flex items-center gap-2 text-sm text-[#1a3a6b] font-semibold py-3 px-4 border-2 border-dashed border-[#1a3a6b] rounded-xl hover:bg-blue-50 transition w-full justify-center">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        Tambah Tenaga Ahli
                                    </button>
                                </div>
                            </>
                        )}

                        {/* === TAB 7: REKENING === */}
                        {activeTab === "rekening" && (
                            <>
                                <SectionHeader icon={TABS[6].icon} title="Rekening Bank Perusahaan" subtitle="Informasi rekening resmi atas nama perusahaan" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Nama Bank" required half>
                                        <select value={form.bankNama} onChange={set("bankNama")} className={selectCls}>
                                            <option value="">Pilih Bank</option>
                                            {["Bank Papua", "Bank BRI", "Bank Mandiri", "Bank BNI", "Bank BTN", "Bank BCA", "Bank Muamalat", "Bank Syariah Indonesia (BSI)", "Lainnya"].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Cabang / Unit" half>
                                        <input value={form.bankCabang} onChange={set("bankCabang")} placeholder="Nama cabang bank" className={inputCls} />
                                    </Field>
                                    <Field label="Nomor Rekening" required half>
                                        <input value={form.bankNoRek} onChange={set("bankNoRek")} placeholder="Nomor rekening perusahaan" className={inputCls} />
                                    </Field>
                                    <Field label="Atas Nama Rekening" required half>
                                        <input value={form.bankAtasNama} onChange={set("bankAtasNama")} placeholder="Nama pemilik rekening" className={inputCls} />
                                    </Field>
                                    <Field label="Upload Buku Tabungan / Surat Bank (PDF/JPG)" required>
                                        <input type="file" onChange={handleFileChange("docRekening")} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                        {files.docRekening && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ {files.docRekening.name}</p>}
                                    </Field>
                                </div>

                                {/* Summary before submit */}
                                <div className="mt-8 bg-blue-50 rounded-xl p-5 border border-blue-100">
                                    <h4 className="text-sm font-bold text-[#1a3a6b] mb-3">Ringkasan Data yang Akan Disimpan:</h4>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                        {[
                                            ["Perusahaan", form.namaPerusahaan || "—"],
                                            ["Jenis Usaha", form.jenisUsaha || "—"],
                                            ["Direktur", form.namaDirektur || "—"],
                                            ["NPWP Direktur", form.npwpDirekturNo || "—"],
                                            ["NPWP Perusahaan", form.npwpPerusahaanNo || "—"],
                                            ["No. SIUJK", form.siujkNo || "—"],
                                            ["Kualifikasi", form.siujkKualifikasi || "—"],
                                            ["SMK3", form.smk3No || "—"],
                                            ["Tenaga Ahli", `${tenagaAhli.filter(t => t.nama).length} orang`],
                                            ["Rekening", form.bankNoRek ? `${form.bankNama} — ${form.bankNoRek}` : "—"],
                                        ].map(([k, v]) => (
                                            <div key={k} className="flex gap-2">
                                                <span className="text-gray-500 w-36 flex-shrink-0">{k}:</span>
                                                <span className="font-semibold text-gray-800 truncate">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Result Alert */}
                    {result && (
                        <div className={`rounded-xl p-4 mb-5 flex items-start gap-3 text-sm ${result.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={result.ok ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                            </svg>
                            <p>{result.message}</p>
                        </div>
                    )}

                    {/* Navigation & Submit */}
                    <div className="flex items-center justify-between">
                        <button type="button" onClick={() => setActiveTab(TABS[Math.max(0, currentTabIdx - 1)].id)} disabled={currentTabIdx === 0} className="flex items-center gap-2 px-5 h-11 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-40">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            Sebelumnya
                        </button>

                        <div className="flex gap-3">
                            {currentTabIdx < TABS.length - 1 ? (
                                <button type="button" onClick={() => setActiveTab(TABS[currentTabIdx + 1].id)} className="flex items-center gap-2 px-6 h-11 text-white rounded-xl text-sm font-bold transition" style={{ background: "linear-gradient(135deg, #1a3a6b, #2563eb)" }}>
                                    Selanjutnya
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            ) : (
                                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-7 h-11 text-white rounded-xl text-sm font-bold transition active:scale-[0.98] disabled:opacity-60" style={{ background: "linear-gradient(135deg, #166534, #16a34a)" }}>
                                    {submitting ? (
                                        <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Menyimpan...</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>Simpan & Kirim ke Spreadsheet</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* Records Table */}
                {records.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8">
                        <h3 className="text-base font-bold text-gray-900 mb-4">Data Kontraktor yang Telah Diinput ({records.length})</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase text-gray-400 bg-gray-50 border-b">
                                        {["No", "Nama Perusahaan", "Direktur", "Jenis Usaha", "SIUJK Klasifikasi", "Waktu Input"].map(h => (
                                            <th key={h} className="py-3 px-3 font-semibold whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r, i) => (
                                        <tr key={r.id || i} className="border-b border-gray-50 hover:bg-blue-50/30 transition">
                                            <td className="py-3 px-3 text-gray-400 text-center">{i + 1}</td>
                                            <td className="py-3 px-3 font-semibold text-[#1a3a6b]">{r.namaPerusahaan}</td>
                                            <td className="py-3 px-3 text-gray-700">{r.namaDirektur}</td>
                                            <td className="py-3 px-3"><span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{r.jenisUsaha}</span></td>
                                            <td className="py-3 px-3 text-gray-600">{r.siujkKlasifikasi} — {r.siujkKualifikasi}</td>
                                            <td className="py-3 px-3 text-gray-400 text-xs">{r.waktuInput}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="mt-12 border-t border-gray-200 bg-white py-5">
                <div className="max-w-screen-xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <img src={logoPBD} alt="" className="w-6 h-6 object-contain" />
                        <span className="text-xs text-gray-500">Dinas PUPR Provinsi Papua Barat Daya</span>
                    </div>
                    <p className="text-xs text-gray-400">Sistem Pendataan Kontraktor OAP — © 2025 — "Bersatu Membangun Negeri"</p>
                </div>
            </footer>
        </div>
    );
}
