import { useState, useEffect } from "react";
import { signOut, useSession } from "@auth/create/react";
import logoPBD from "@/assets/logo-papua-barat-daya.png";
import { LogoRow } from "@/utils/logos";

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
    anggotaAsosiasi: "Non Asosiasi", namaAsosiasi: "",
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
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-white/10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
                </svg>
            </div>
            <div>
                <h3 className="text-lg font-black text-white tracking-wide">{title}</h3>
                {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

function Field({ label, required, children, half }) {
    return (
        <div className={half ? "" : "md:col-span-2"}>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                {label} {required && <span className="text-amber-500 normal-case">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputCls = "w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono";
const fileCls = "w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500/10 file:text-amber-400 hover:file:bg-amber-500/20 cursor-pointer transition-all";
const selectCls = inputCls + " appearance-none [&>option]:bg-[#0f172a] [&>option]:text-white";

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
        if (status === "unauthenticated") {
            const timer = setTimeout(() => {
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
            <div className="min-h-screen bg-[#020617] flex items-center justify-center font-['Inter',sans-serif]">
                <div className="text-center animate-pulse">
                    <img src={logoPBD.src || logoPBD} alt="Logo" className="w-24 h-24 mx-auto mb-6 opacity-80 drop-shadow-2xl" />
                    <p className="text-amber-400 font-semibold tracking-widest uppercase text-sm">Memverifikasi Sesi...</p>
                </div>
            </div>
        );
    }

    const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

    const handleFileChange = (field, taIndex = null) => async (e) => {
        const file = e.target.files[0];
        if (!file) return;

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
                setResult({ ok: true, message: `Data perusahaan "${form.namaPerusahaan}" berhasil disimpan dan dikirim.` });
                const updated = [{ ...payload, id: Date.now() }, ...records].slice(0, 100);
                setRecords(updated);
                localStorage.setItem("oap_records", JSON.stringify(updated));
                setFiles({});
            } else {
                setResult({ ok: false, message: data.error || "Gagal menyimpan data." });
            }
        } catch { setResult({ ok: false, message: "Terjadi kesalahan koneksi." }); }
        finally { setSubmitting(false); }
    };

    const currentTabIdx = TABS.findIndex(t => t.id === activeTab);

    return (
        <div className="min-h-screen bg-[#020617] relative overflow-hidden font-['Inter',sans-serif] text-slate-300 pb-20">
            {/* Premium Dark Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
                <div className="absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-amber-600/5 blur-3xl" />
                <div className="absolute -bottom-60 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-teal-900/10 blur-3xl" />
                {/* Construction Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)]" style={{ backgroundSize: '48px 48px' }} />
            </div>

            {/* Top Nav */}
            <header className="relative z-30 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 shadow-2xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
                    <div className="flex items-center gap-4">
                        <img src={logoPBD.src || logoPBD} alt="Logo PBD" className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                        <div>
                            <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-bold">Dinas PUPR</div>
                            <div className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Provinsi Papua Barat Daya</div>
                        </div>
                    </div>
                    <div className="hidden lg:block text-center border-x border-white/10 px-8 py-2">
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-1">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span className="text-[10px] font-semibold tracking-wider text-slate-300 uppercase">Terintegrasi SI PRO</span>
                        </div>
                        <div className="text-sm font-black text-white tracking-widest uppercase">Pendataan Kontraktor OAP</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block text-right">
                            <div className="text-sm font-bold text-white">{session?.user?.name || "Pengguna"}</div>
                            <div className="text-xs text-slate-400">{session?.user?.email}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-black bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                            {(session?.user?.name || "U")[0].toUpperCase()}
                        </div>
                        <button onClick={() => signOut({ callbackUrl: "/account/signin" })} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-400 transition ml-2 border-l border-white/10 pl-4 py-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            <span className="hidden sm:inline">Keluar</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Hero Banner */}
                <div className="rounded-3xl mb-10 p-8 sm:p-10 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative overflow-hidden bg-[#0f172a]/60 backdrop-blur-2xl">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 opacity-5 pointer-events-none">
                        <img src={logoPBD.src || logoPBD} alt="" className="w-full h-full object-contain" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="text-xs uppercase tracking-[0.2em] text-amber-500 font-bold mb-2">Portal Pendataan</div>
                        <h2 className="text-3xl sm:text-4xl font-black mb-3 text-white">Profil Kontraktor OAP</h2>
                        <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
                            Selamat datang, <strong className="text-amber-400">{session?.user?.name}</strong>. Silakan lengkapi data profil perusahaan secara akurat. Data yang diinput akan divalidasi dan terintegrasi langsung dengan ekosistem SI PRO.
                        </p>

                        <div className="mt-8 pt-8 border-t border-white/10 md:w-max">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="h-px bg-gradient-to-r from-amber-500/50 to-transparent flex-1" />
                                <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.2em]">Otoritas Sistem Terintegrasi</p>
                            </div>
                            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700" />
                                <LogoRow />
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Tab Navigation */}
                    <div className="rounded-2xl border border-white/10 mb-6 bg-[#0f172a]/40 backdrop-blur-xl overflow-hidden p-1 shadow-lg">
                        <div className="flex overflow-x-auto scrollbar-hide gap-1">
                            {TABS.map((tab, i) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-6 py-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 rounded-xl ${activeTab === tab.id
                                        ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.2)]"
                                        : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                        }`}
                                >
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                    </svg>
                                    <span className="hidden lg:inline">{tab.label}</span>
                                    <span className="lg:hidden">{i + 1}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-6 flex items-center gap-4 px-1">
                        <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${((currentTabIdx + 1) / TABS.length) * 100}%` }} />
                        </div>
                        <span className="text-xs text-amber-500 font-bold uppercase tracking-widest whitespace-nowrap bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">Langkah {currentTabIdx + 1}/{TABS.length}</span>
                    </div>

                    {/* Form Content */}
                    <div className="rounded-3xl border border-white/10 p-6 sm:p-10 mb-8 bg-[#0f172a]/60 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] relative">
                        {/* Section Glow */}
                        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                        {/* === TAB 1: IDENTITAS PERUSAHAAN === */}
                        {activeTab === "identitas" && (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                <SectionHeader icon={TABS[0].icon} title="Identitas Perusahaan" subtitle="Lengkapi informasi dasar perusahaan" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                    <div className="md:col-span-2">
                                        <Field label="Nama Perusahaan" required>
                                            <input value={form.namaPerusahaan} onChange={set("namaPerusahaan")} placeholder="PT / CV / UD ..." className={inputCls} />
                                        </Field>
                                    </div>
                                    <Field label="Jenis Badan Usaha" required half>
                                        <select value={form.jenisUsaha} onChange={set("jenisUsaha")} className={selectCls}>
                                            <option value="">Pilih Jenis Usaha</option>
                                            {["PT (Perseroan Terbatas)", "CV (Comanditaire Vennootschap)", "Firma", "UD (Usaha Dagang)", "Koperasi"].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Nama Direktur Utama" required half>
                                        <input value={form.namaDirektur} onChange={set("namaDirektur")} placeholder="Nama lengkap sesuai KTP" className={inputCls} />
                                    </Field>
                                    <Field label="NIK Direktur" required half>
                                        <input value={form.nikDirektur} onChange={set("nikDirektur")} placeholder="16 digit angka NIK" maxLength={16} className={inputCls} />
                                    </Field>
                                    <Field label="Nomor Telepon" required half>
                                        <input value={form.telepon} onChange={set("telepon")} placeholder="08xx-xxxx-xxxx" className={inputCls} />
                                    </Field>
                                    <Field label="Email Perusahaan" half>
                                        <input type="email" value={form.email} onChange={set("email")} placeholder="email@perusahaan.com" className={inputCls} />
                                    </Field>
                                    <Field label="Website" half>
                                        <input value={form.website} onChange={set("website")} placeholder="www.perusahaan.com" className={inputCls} />
                                    </Field>
                                    <Field label="Keanggotaan Asosiasi" required half>
                                        <select value={form.anggotaAsosiasi} onChange={set("anggotaAsosiasi")} className={selectCls}>
                                            <option value="Non Asosiasi">Non Asosiasi</option>
                                            <option value="Asosiasi">Asosiasi</option>
                                        </select>
                                    </Field>
                                    {form.anggotaAsosiasi === "Asosiasi" && (
                                        <Field label="Nama Asosiasi" required half>
                                            <input value={form.namaAsosiasi} onChange={set("namaAsosiasi")} placeholder="Nama wadah asosiasi" className={inputCls} />
                                        </Field>
                                    )}
                                    <div className="md:col-span-2">
                                        <Field label="Alamat Lengkap Perusahaan" required>
                                            <textarea value={form.alamat} onChange={set("alamat")} rows={3} placeholder="Nama jalan, kelurahan, kecamatan..." className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono resize-none" />
                                        </Field>
                                    </div>
                                    <Field label="Kota / Kabupaten" required half>
                                        <input value={form.kota} onChange={set("kota")} placeholder="Kota / Kabupaten" className={inputCls} />
                                    </Field>
                                    <Field label="Provinsi" half>
                                        <input value={form.provinsi} onChange={set("provinsi")} className={inputCls} readOnly />
                                    </Field>
                                </div>
                            </div>
                        )}

                        {/* === SEC 2-6 follow same pattern... === */}
                        {/* Because rewriting fully requires duplicating tabs with new styles. I will ensure all inputs use new styles. */}
                        
                        {activeTab === "akta" && (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                <SectionHeader icon={TABS[1].icon} title="Akta Perusahaan" subtitle="Legalitas pendirian dan perubahan" />
                                <div className="mb-10 p-6 rounded-2xl bg-black/20 border border-white/5">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">Akta Pendirian</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field label="Nomor Akta" required half><input value={form.aktaNo} onChange={set("aktaNo")} placeholder="No akta" className={inputCls} /></Field>
                                        <Field label="Tanggal Akta" required half><input type="date" value={form.aktaTanggal} onChange={set("aktaTanggal")} className={inputCls} /></Field>
                                        <Field label="Nama Notaris" required half><input value={form.aktaNotaris} onChange={set("aktaNotaris")} placeholder="Nama notaris" className={inputCls} /></Field>
                                        <Field label="Tempat / Kota Notaris" half><input value={form.aktaTempat} onChange={set("aktaTempat")} placeholder="Domisili notaris" className={inputCls} /></Field>
                                        <Field label="Upload Akta (PDF/JPG)" required>
                                            <input type="file" onChange={handleFileChange("docAkta")} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                            {files.docAkta && <p className="text-[10px] text-green-400 mt-2 font-bold uppercase">✓ {files.docAkta.name}</p>}
                                        </Field>
                                        <div className="md:col-span-2">
                                            <Field label="SK Pengesahan Kemenkumham"><input value={form.skKemenkumham} onChange={set("skKemenkumham")} placeholder="Nomor SK (opsional)" className={inputCls} /></Field>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-black/20 border border-white/5 border-dashed">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white uppercase tracking-widest">Akta Perubahan</h4>
                                            <span className="text-[10px] text-slate-500 font-medium">Kosongkan jika tidak ada</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field label="Nomor Akta Perubahan" half><input value={form.aktaPerubahanNo} onChange={set("aktaPerubahanNo")} className={inputCls} /></Field>
                                        <Field label="Tanggal Perubahan" half><input type="date" value={form.aktaPerubahanTanggal} onChange={set("aktaPerubahanTanggal")} className={inputCls} /></Field>
                                        <Field label="Notaris Perubahan" half><input value={form.aktaPerubahanNotaris} onChange={set("aktaPerubahanNotaris")} className={inputCls} /></Field>
                                        <Field label="Upload Akta Perubahan (PDF/JPG)">
                                            <input type="file" onChange={handleFileChange("docAktaPerubahan")} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                            {files.docAktaPerubahan && <p className="text-[10px] text-green-400 mt-2 font-bold uppercase">✓ {files.docAktaPerubahan.name}</p>}
                                        </Field>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "npwp" && (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                <SectionHeader icon={TABS[2].icon} title="NPWP" subtitle="Informasi pajak direktur dan badan usaha" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-6 rounded-2xl bg-black/20 border border-white/5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            </div>
                                            <h4 className="text-sm font-bold text-white uppercase tracking-widest">NPWP Direktur</h4>
                                        </div>
                                        <div className="space-y-6">
                                            <Field label="Nomor NPWP" required half><input value={form.npwpDirekturNo} onChange={set("npwpDirekturNo")} placeholder="XX.XXX.XXX.X-XXX.XXX" className={inputCls} /></Field>
                                            <Field label="Atas Nama" required half><input value={form.npwpDirekturNama} onChange={set("npwpDirekturNama")} className={inputCls} /></Field>
                                            <Field label="Upload (PDF/JPG)" required>
                                                <input type="file" onChange={handleFileChange("docNpwpDirektur")} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                                {files.docNpwpDirektur && <p className="text-[10px] text-green-400 mt-2 font-bold uppercase">✓ {files.docNpwpDirektur.name}</p>}
                                            </Field>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-black/20 border border-white/5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                                            </div>
                                            <h4 className="text-sm font-bold text-white uppercase tracking-widest">NPWP Perusahaan</h4>
                                        </div>
                                        <div className="space-y-6">
                                            <Field label="Nomor NPWP" required half><input value={form.npwpPerusahaanNo} onChange={set("npwpPerusahaanNo")} placeholder="XX.XXX.XXX.X-XXX.XXX" className={inputCls} /></Field>
                                            <Field label="Atas Nama" required half><input value={form.npwpPerusahaanNama} onChange={set("npwpPerusahaanNama")} className={inputCls} /></Field>
                                            <Field label="Upload (PDF/JPG)" required>
                                                <input type="file" onChange={handleFileChange("docNpwpPerusahaan")} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                                {files.docNpwpPerusahaan && <p className="text-[10px] text-green-400 mt-2 font-bold uppercase">✓ {files.docNpwpPerusahaan.name}</p>}
                                            </Field>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "siujk" && (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                <SectionHeader icon={TABS[3].icon} title="SIUJK" subtitle="Surat Izin Usaha Jasa Konstruksi" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2"><Field label="Nomor SIUJK" required><input value={form.siujkNo} onChange={set("siujkNo")} className={inputCls} /></Field></div>
                                    <Field label="Tanggal Terbit" required half><input type="date" value={form.siujkTanggal} onChange={set("siujkTanggal")} className={inputCls} /></Field>
                                    <Field label="Masa Berlaku" required half><input type="date" value={form.siujkBerlaku} onChange={set("siujkBerlaku")} className={inputCls} /></Field>
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
                                        {files.docSiujk && <p className="text-[10px] text-green-400 mt-2 font-bold uppercase">✓ {files.docSiujk.name}</p>}
                                    </Field>
                                    <div className="md:col-span-2"><Field label="Penerbit"><input value={form.siujkPenerbit} onChange={set("siujkPenerbit")} className={inputCls} /></Field></div>
                                </div>
                            </div>
                        )}

                        {activeTab === "smk3" && (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                <SectionHeader icon={TABS[4].icon} title="SMK3" subtitle="Sistem Manajemen K3" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2"><Field label="Nomor Sertifikat SMK3" required><input value={form.smk3No} onChange={set("smk3No")} className={inputCls} /></Field></div>
                                    <Field label="Tanggal Terbit" required half><input type="date" value={form.smk3Tanggal} onChange={set("smk3Tanggal")} className={inputCls} /></Field>
                                    <Field label="Masa Berlaku" required half><input type="date" value={form.smk3Berlaku} onChange={set("smk3Berlaku")} className={inputCls} /></Field>
                                    <Field label="Lembaga Sertifikasi" required half><input value={form.smk3Lembaga} onChange={set("smk3Lembaga")} className={inputCls} /></Field>
                                    <Field label="Tingkat Penilaian" half>
                                        <select value={form.smk3Tingkat} onChange={set("smk3Tingkat")} className={selectCls}>
                                            <option value="">Pilih Tingkat</option>
                                            {["Memuaskan (≥85%)", "Baik (64%-85%)", "Perlu Peningkatan (<64%)", "Belum Tersertifikasi"].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Upload (PDF/JPG)" required>
                                        <input type="file" onChange={handleFileChange("docSmk3")} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                        {files.docSmk3 && <p className="text-[10px] text-green-400 mt-2 font-bold uppercase">✓ {files.docSmk3.name}</p>}
                                    </Field>
                                </div>
                            </div>
                        )}

                        {activeTab === "tenagaAhli" && (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                <SectionHeader icon={TABS[5].icon} title="Tenaga Ahli" subtitle="Daftar SKA / SKT Perusahaan" />
                                <div className="space-y-6">
                                    {tenagaAhli.map((ta, i) => (
                                        <div key={i} className="p-6 rounded-2xl bg-black/20 border border-white/5 relative">
                                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                                                <span className="text-sm font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-lg">Personil #{i + 1}</span>
                                                {tenagaAhli.length > 1 && (
                                                    <button type="button" onClick={() => removeTenagaAhli(i)} className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-400 flex items-center gap-1.5 transition">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        Hapus
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div><label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Nama Lengkap *</label><input value={ta.nama} onChange={setTA(i, "nama")} className={inputCls} /></div>
                                                <div><label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Bidang *</label><input value={ta.bidang} onChange={setTA(i, "bidang")} className={inputCls} /></div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Sertifikat</label>
                                                    <select value={ta.jenisSertifikat} onChange={setTA(i, "jenisSertifikat")} className={selectCls}>
                                                        <option value="">Pilih</option><option value="SKA">SKA</option><option value="SKT">SKT</option>
                                                    </select>
                                                </div>
                                                <div><label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Nomor</label><input value={ta.noSertifikat} onChange={setTA(i, "noSertifikat")} className={inputCls} /></div>
                                                <div><label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Masa Berlaku</label><input type="date" value={ta.berlaku} onChange={setTA(i, "berlaku")} className={inputCls} /></div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Tingkat</label>
                                                    <select value={ta.tingkat} onChange={setTA(i, "tingkat")} className={selectCls}>
                                                        <option value="">Pilih</option>
                                                        {["Muda", "Madya", "Utama", "Terampil"].map(v => <option key={v} value={v}>{v}</option>)}
                                                    </select>
                                                </div>
                                                <div className="md:col-span-3">
                                                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Upload SKA/SKT *</label>
                                                    <input type="file" onChange={handleFileChange("docSertifikat", i)} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                                    {ta.docSertifikat && <p className="text-[10px] text-green-400 mt-2 font-bold uppercase">✓ {ta.docSertifikat.name}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addTenagaAhli} className="flex items-center gap-2 text-sm text-amber-400 font-bold uppercase tracking-wider py-4 px-6 border border-dashed border-amber-500/30 rounded-2xl hover:bg-amber-500/10 transition w-full justify-center">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        Tambah Personil
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "rekening" && (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                <SectionHeader icon={TABS[6].icon} title="Rekening Bank" subtitle="Rekening resmi perusahaan" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="Nama Bank" required half>
                                        <select value={form.bankNama} onChange={set("bankNama")} className={selectCls}>
                                            <option value="">Pilih Bank</option>
                                            {["Bank Papua", "Bank BRI", "Bank Mandiri", "Bank BNI", "Bank BTN", "Bank BCA", "Bank Muamalat", "Bank Syariah Indonesia (BSI)", "Lainnya"].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Cabang / Unit" half><input value={form.bankCabang} onChange={set("bankCabang")} className={inputCls} /></Field>
                                    <Field label="Nomor Rekening" required half><input value={form.bankNoRek} onChange={set("bankNoRek")} className={inputCls} /></Field>
                                    <Field label="Atas Nama Rekening" required half><input value={form.bankAtasNama} onChange={set("bankAtasNama")} className={inputCls} /></Field>
                                    <Field label="Upload Cover Tabungan (PDF/JPG)" required>
                                        <input type="file" onChange={handleFileChange("docRekening")} accept=".pdf,.jpg,.jpeg,.png" className={fileCls} />
                                        {files.docRekening && <p className="text-[10px] text-green-400 mt-2 font-bold uppercase">✓ {files.docRekening.name}</p>}
                                    </Field>
                                </div>

                                <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-3xl" />
                                     <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-6">Konfirmasi Data Terakhir</h4>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                        {[
                                            ["Perusahaan", form.namaPerusahaan || "—"],
                                            ["Atas Nama", form.namaDirektur || "—"],
                                            ["NPWP Direktur", form.npwpDirekturNo || "—"],
                                            ["NPWP Perusahaan", form.npwpPerusahaanNo || "—"],
                                            ["SIUJK", form.siujkNo || "—"],
                                            ["SMK3", form.smk3No || "—"],
                                            ["Tenaga Ahli", `${tenagaAhli.filter(t => t.nama).length} Orang terdata`],
                                            ["Asosiasi", form.anggotaAsosiasi === "Asosiasi" ? form.namaAsosiasi : "Non Asosiasi"],
                                        ].map(([k, v]) => (
                                            <div key={k} className="flex flex-col border-b border-white/5 pb-2">
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{k}</span>
                                                <span className="font-semibold text-white truncate">{v}</span>
                                            </div>
                                        ))}
                                     </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Result Alert */}
                    {result && (
                        <div className={`rounded-2xl p-5 mb-8 flex items-start gap-4 text-sm font-medium backdrop-blur-md border ${result.ok ? "bg-green-500/10 border-green-500/20 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]" : "bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]"}`}>
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={result.ok ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                            </svg>
                            <p className="leading-relaxed">{result.message}</p>
                        </div>
                    )}

                    {/* Navigation & Submit */}
                    <div className="flex items-center justify-between mt-8">
                        <button type="button" onClick={() => setActiveTab(TABS[Math.max(0, currentTabIdx - 1)].id)} disabled={currentTabIdx === 0} className="flex items-center gap-2 px-6 h-12 border border-white/10 text-slate-400 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-white/5 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                            Kembali
                        </button>

                        <div>
                            {currentTabIdx < TABS.length - 1 ? (
                                <button type="button" onClick={() => setActiveTab(TABS[currentTabIdx + 1].id)} className="flex items-center gap-2 px-8 h-12 bg-white/10 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-white/20 transition-all border border-white/20 shadow-lg">
                                    Lanjut
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            ) : (
                                <button type="submit" disabled={submitting} className="flex items-center gap-3 px-8 h-12 rounded-xl text-sm font-bold uppercase tracking-wider text-black transition-all active:scale-[0.98] disabled:opacity-60 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                                    {submitting ? (
                                        <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Memproses...</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Simpan & Integrasi Ke SI PRO</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* Records Table */}
                {records.length > 0 && (
                    <div className="mt-16 rounded-3xl border border-white/10 p-6 sm:p-10 bg-[#0f172a]/60 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">Riwayat Pendaftaran</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">{records.length} Berkas terintegrasi</p>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-widest text-slate-400 bg-black/40 border-b border-white/5">
                                        {["Komp.", "Perusahaan", "Direktur", "Kategori", "Status Sinkronisasi", "Tanggal"].map(h => (
                                            <th key={h} className="py-4 px-5 font-bold">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r, i) => (
                                        <tr key={r.id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-5 text-slate-500 font-mono text-xs">{(i + 1).toString().padStart(2, '0')}</td>
                                            <td className="py-4 px-5 font-bold text-white">{r.namaPerusahaan}</td>
                                            <td className="py-4 px-5 text-slate-300">{r.namaDirektur}</td>
                                            <td className="py-4 px-5"><span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">{r.jenisUsaha?.split(' ')[0] || r.jenisUsaha}</span></td>
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-2 w-2 rounded-full bg-green-500" />
                                                    <span className="text-xs text-green-400 font-semibold uppercase tracking-wider">Terkirim ke SI PRO</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 text-slate-500 text-xs font-mono">{r.waktuInput}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 mt-12 border-t border-white/10 bg-black/40 backdrop-blur-xl py-6">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                    <div className="flex items-center gap-3">
                        <img src={logoPBD.src || logoPBD} alt="" className="w-8 h-8 object-contain opacity-50 grayscale" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dinas PUPR Provinsi Papua Barat Daya</span>
                            <span className="text-[10px] text-slate-600 font-mono mt-0.5">SIKAP / v1.0.0-PRO</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Terintegrasi dengan SI PRO © 2025</p>
                </div>
            </footer>
        </div>
    );
}
