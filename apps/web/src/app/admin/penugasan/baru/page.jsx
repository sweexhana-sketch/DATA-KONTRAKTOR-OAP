import { useState, useEffect, useCallback } from "react";
import { useSession } from "@auth/create/react";
import logoPBD from "@/assets/logo-papua-barat-daya.png";

// ── Availability badge component ────────────────────────────────────────────
function AvailabilityBadge({ availability }) {
  if (!availability) return null;
  const map = {
    tersedia: {
      bg: "bg-green-500/10 border-green-500/20", text: "text-green-400",
      dot: "bg-green-500", label: "Tersedia",
      desc: "Kontraktor ini bebas dari penugasan aktif"
    },
    akan_tersedia: {
      bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400",
      dot: "bg-amber-500 animate-pulse", label: "Akan Tersedia",
      desc: availability.pesan
    },
    tidak_tersedia: {
      bg: "bg-red-500/10 border-red-500/20", text: "text-red-400",
      dot: "bg-red-500", label: "Tidak Tersedia",
      desc: availability.pesan
    },
  };
  const s = map[availability.status];
  return (
    <div className={`mt-3 p-3 rounded-xl border ${s.bg} flex items-start gap-3`}>
      <span className={`flex-shrink-0 mt-1 w-2 h-2 rounded-full ${s.dot}`} />
      <div>
        <div className={`text-xs font-black uppercase tracking-wider ${s.text}`}>{s.label}</div>
        <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.desc}</div>
        {availability.collision && (
          <div className="mt-2 p-2 rounded-lg bg-black/30 border border-white/5 text-xs">
            <div className="text-slate-300 font-mono">
              📍 {availability.collision.wilayah} — {availability.collision.paket}
            </div>
            <div className="text-slate-500 mt-0.5">
              {new Date(availability.collision.tanggal_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} s/d{" "}
              {new Date(availability.collision.tanggal_selesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export default function PenugasanBaruPage() {
  const { data: session, status } = useSession();

  // Data reference
  const [wilayahList, setWilayahList]         = useState([]);
  const [contractorList, setContractorList]   = useState([]);
  const [loadingRef, setLoadingRef]           = useState(true);

  // Form state
  const [form, setForm] = useState({
    contractor_id: "",
    wilayah_id: "",
    nama_paket: "",
    tahun_anggaran: new Date().getFullYear(),
    tanggal_mulai: "",
    tanggal_selesai: "",
    catatan: "",
  });

  // Availability realtime
  const [availability, setAvailability]   = useState(null);
  const [checkingAvail, setCheckingAvail] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);

  // ── Pre-fill wilayah_id from URL query ─────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wid = params.get("wilayah_id");
    if (wid) setForm(p => ({ ...p, wilayah_id: wid }));
  }, []);

  // ── Redirect if not authenticated ──────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") window.location.href = "/account/signin";
  }, [status]);

  // ── Fetch reference data ───────────────────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/wilayah").then(r => r.json()),
      fetch("/api/contractors?status=approved").then(r => r.json()),
    ]).then(([wd, cd]) => {
      setWilayahList(wd.wilayah || []);
      // Include approved + ditunjuk (ditunjuk might become available)
      setContractorList(cd.contractors || []);
      setLoadingRef(false);
    });
  }, [status]);

  // ── Real-time Collision Check ─────────────────────────────────────────
  const checkAvailability = useCallback(async () => {
    const { contractor_id, tanggal_mulai, tanggal_selesai } = form;
    if (!contractor_id || !tanggal_mulai || !tanggal_selesai) {
      setAvailability(null);
      return;
    }
    if (new Date(tanggal_selesai) <= new Date(tanggal_mulai)) {
      setAvailability(null);
      return;
    }

    setCheckingAvail(true);
    setAvailability(null);

    try {
      // Check existing penugasan aktif for this contractor on chosen date range
      const res = await fetch(`/api/penugasan?contractor_id=${contractor_id}&status=aktif`);
      const { penugasan } = await res.json();

      const mulai = new Date(tanggal_mulai);
      const selesai = new Date(tanggal_selesai);

      const conflict = (penugasan || []).find(p => {
        const pMulai = new Date(p.tanggal_mulai);
        const pSelesai = new Date(p.tanggal_selesai);
        return pMulai <= selesai && pSelesai >= mulai;
      });

      if (conflict) {
        const sisa = Math.ceil((new Date(conflict.tanggal_selesai) - new Date()) / (1000 * 60 * 60 * 24));
        if (sisa <= 30 && sisa > 0) {
          setAvailability({
            status: "akan_tersedia",
            pesan: `Masih aktif di ${conflict.wilayah_nama}. Akan selesai dalam ±${sisa} hari (${new Date(conflict.tanggal_selesai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })})`,
            collision: conflict,
          });
        } else {
          setAvailability({
            status: "tidak_tersedia",
            pesan: `Sedang aktif mengerjakan paket "${conflict.nama_paket}" di ${conflict.wilayah_nama}. Penunjukan pada periode ini tidak diizinkan.`,
            collision: conflict,
          });
        }
      } else {
        setAvailability({ status: "tersedia" });
      }
    } catch {
      setAvailability(null);
    }
    setCheckingAvail(false);
  }, [form.contractor_id, form.tanggal_mulai, form.tanggal_selesai]);

  useEffect(() => {
    const t = setTimeout(checkAvailability, 400);
    return () => clearTimeout(t);
  }, [checkAvailability]);

  // ── Form helpers ──────────────────────────────────────────────────────
  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);

    if (!form.contractor_id || !form.wilayah_id || !form.nama_paket || !form.tanggal_mulai || !form.tanggal_selesai) {
      setResult({ ok: false, msg: "Mohon lengkapi semua bidang yang wajib diisi." });
      return;
    }
    if (availability?.status === "tidak_tersedia") {
      setResult({ ok: false, msg: "Tidak dapat menunjuk kontraktor yang sedang aktif di wilayah lain pada periode yang sama." });
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/penugasan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, assigned_by_email: session.user.email }),
    });
    const data = await res.json();

    if (res.ok) {
      setResult({ ok: true, msg: data.message });
      setTimeout(() => {
        const wid = form.wilayah_id;
        window.location.href = `/admin/wilayah/${wid}`;
      }, 1800);
    } else if (res.status === 409) {
      setResult({ ok: false, msg: data.message, collision: data.collision });
    } else {
      setResult({ ok: false, msg: data.error || "Terjadi kesalahan." });
    }
    setSubmitting(false);
  };

  if (loadingRef || status === "loading") {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center font-['Inter',sans-serif]">
        <div className="animate-pulse text-center">
          <img src={logoPBD.src || logoPBD} alt="" className="w-20 h-20 mx-auto mb-4 opacity-60" />
          <p className="text-amber-400 text-sm font-bold uppercase tracking-widest">Memuat...</p>
        </div>
      </div>
    );
  }

  const inputCls = "w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono";
  const selectCls = inputCls + " appearance-none [&>option]:bg-[#0f172a] [&>option]:text-white";
  const selectedContractor = contractorList.find(c => String(c.id) === String(form.contractor_id));
  const canSubmit = availability?.status !== "tidak_tersedia" && !submitting;

  return (
    <div className="min-h-screen bg-[#020617] relative font-['Inter',sans-serif] text-slate-300 pb-20">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-amber-600/5 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)]" style={{ backgroundSize: "48px 48px" }} />
      </div>

      {/* Header */}
      <header className="relative z-30 sticky top-0 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-20">
          <button onClick={() => window.history.back()} className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <img src={logoPBD.src || logoPBD} alt="" className="w-10 h-10 object-contain" />
          <div>
            <div className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">Penunjukan Kontraktor</div>
            <div className="text-base font-black text-white">Form Penugasan Baru</div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Info banner */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-xl p-5 mb-8 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <div className="text-sm font-bold text-blue-300">Collision Guard Aktif</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">
              Sistem akan secara otomatis memblokir penunjukan jika perusahaan yang dipilih <strong className="text-white">sedang aktif mengerjakan proyek di wilayah lain</strong> pada periode waktu yang sama.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-3xl border border-white/10 bg-[#0f172a]/60 backdrop-blur-2xl shadow-2xl p-8 sm:p-10 space-y-8">
            <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

            {/* ── Section 1: Pilih Wilayah & Kontraktor ── */}
            <div>
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-[10px] font-black">1</span>
                Pilih Wilayah & Perusahaan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Wilayah Penugasan <span className="text-amber-500">*</span></label>
                  <select value={form.wilayah_id} onChange={set("wilayah_id")} className={selectCls}>
                    <option value="">— Pilih Kabupaten/Kota —</option>
                    {wilayahList.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.tipe === "kota" ? "🏙️" : "🏔️"} {w.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Perusahaan Kontraktor <span className="text-amber-500">*</span></label>
                  <select value={form.contractor_id} onChange={set("contractor_id")} className={selectCls}>
                    <option value="">— Pilih Perusahaan —</option>
                    {contractorList.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name} ({c.full_name})</option>
                    ))}
                  </select>

                  {/* Contractor detail mini-card */}
                  {selectedContractor && (
                    <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/5 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[10px]">
                          {selectedContractor.company_name[0]}
                        </div>
                        <span className="font-bold text-white">{selectedContractor.company_name}</span>
                        <span className="ml-auto text-[10px] text-slate-500 font-mono">{selectedContractor.company_type}</span>
                      </div>
                      <div className="text-slate-400">Direktur: {selectedContractor.full_name}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section 2: Detail Paket ── */}
            <div>
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-[10px] font-black">2</span>
                Detail Paket Pekerjaan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Paket Pekerjaan <span className="text-amber-500">*</span></label>
                  <input value={form.nama_paket} onChange={set("nama_paket")} placeholder="Contoh: Pembangunan Jembatan Sungai Klasow" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tahun Anggaran <span className="text-amber-500">*</span></label>
                  <select value={form.tahun_anggaran} onChange={set("tahun_anggaran")} className={selectCls}>
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div />
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tanggal Mulai <span className="text-amber-500">*</span></label>
                  <input type="date" value={form.tanggal_mulai} onChange={set("tanggal_mulai")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tanggal Selesai <span className="text-amber-500">*</span></label>
                  <input type="date" value={form.tanggal_selesai} onChange={set("tanggal_selesai")} className={inputCls} />
                </div>
              </div>

              {/* Collision Availability Indicator */}
              {form.contractor_id && form.tanggal_mulai && form.tanggal_selesai && (
                <div className="mt-4">
                  {checkingAvail ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Memeriksa ketersediaan kontraktor...
                    </div>
                  ) : (
                    <AvailabilityBadge availability={availability} />
                  )}
                </div>
              )}
            </div>

            {/* ── Section 3: Catatan ── */}
            <div>
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-[10px] font-black">3</span>
                Catatan (Opsional)
              </h3>
              <textarea value={form.catatan} onChange={set("catatan")} rows={3}
                placeholder="Catatan tambahan tentang paket pekerjaan ini..."
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono resize-none" />
            </div>
          </div>

          {/* Result alert */}
          {result && (
            <div className={`mt-6 rounded-2xl p-5 flex items-start gap-4 text-sm font-medium border ${result.ok ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={result.ok ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"} />
              </svg>
              <div>
                <p>{result.msg}</p>
                {result.collision && (
                  <div className="mt-2 p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-300">
                    📍 <strong>{result.collision.wilayah}</strong> — {result.collision.paket}<br />
                    {new Date(result.collision.tanggal_mulai).toLocaleDateString("id-ID")} s/d {new Date(result.collision.tanggal_selesai).toLocaleDateString("id-ID")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => window.history.back()} className="px-6 h-12 rounded-xl border border-white/10 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              Batal
            </button>
            <button type="submit" disabled={!canSubmit}
              className="flex items-center gap-3 px-8 h-12 rounded-xl text-sm font-bold text-black transition-all active:scale-[0.98] disabled:opacity-50 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]">
              {submitting ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Memproses...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Simpan Penugasan</>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
