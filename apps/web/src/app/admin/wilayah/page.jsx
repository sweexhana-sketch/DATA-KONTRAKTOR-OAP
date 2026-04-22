import { useState, useEffect } from "react";
import { useSession } from "@auth/create/react";
import logoPBD from "@/assets/logo-papua-barat-daya.png";

const WILAYAH_COLORS = {
  KOTA_SOR:   { from: "from-amber-500/20",  to: "to-orange-500/10",  border: "border-amber-500/30",  accent: "text-amber-400",  icon: "🏙️" },
  KAB_SORSEL: { from: "from-cyan-500/20",   to: "to-blue-500/10",    border: "border-cyan-500/30",   accent: "text-cyan-400",   icon: "🏔️" },
  KAB_RA:     { from: "from-teal-500/20",   to: "to-emerald-500/10", border: "border-teal-500/30",   accent: "text-teal-400",   icon: "🌊" },
  KAB_MAY:    { from: "from-violet-500/20", to: "to-purple-500/10",  border: "border-violet-500/30", accent: "text-violet-400", icon: "⛰️" },
  KAB_TAM:    { from: "from-rose-500/20",   to: "to-pink-500/10",    border: "border-rose-500/30",   accent: "text-rose-400",   icon: "🌿" },
  KAB_MNK:    { from: "from-indigo-500/20", to: "to-blue-500/10",    border: "border-indigo-500/30", accent: "text-indigo-400", icon: "🏞️" },
};

export default function AdminWilayahPage() {
  const { data: session, status } = useSession();
  const [wilayahList, setWilayahList] = useState([]);
  const [adminList, setAdminList]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm]             = useState({ admin_email: "", wilayah_id: "" });
  const [formMsg, setFormMsg]       = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { window.location.href = "/account/signin"; return; }
    if (status === "authenticated") fetchAll();
  }, [status]);

  const fetchAll = async () => {
    setLoading(true);
    const [wRes, aRes] = await Promise.all([
      fetch("/api/wilayah"),
      fetch("/api/admin/assign-wilayah"),
    ]);
    if (wRes.ok) { const d = await wRes.json(); setWilayahList(d.wilayah || []); }
    if (aRes.ok) { const d = await aRes.json(); setAdminList(d.admins || []); }
    setLoading(false);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.admin_email || !form.wilayah_id) { setFormMsg({ ok: false, msg: "Isi semua field" }); return; }
    setSubmitting(true); setFormMsg(null);
    const res = await fetch("/api/admin/assign-wilayah", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, assigned_by_email: session.user.email }),
    });
    const data = await res.json();
    if (res.ok) {
      setFormMsg({ ok: true, msg: data.message });
      setForm({ admin_email: "", wilayah_id: "" });
      fetchAll();
    } else {
      setFormMsg({ ok: false, msg: data.error });
    }
    setSubmitting(false);
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center font-['Inter',sans-serif]">
        <div className="animate-pulse text-center">
          <img src={logoPBD.src || logoPBD} alt="" className="w-20 h-20 mx-auto mb-4 opacity-60" />
          <p className="text-amber-400 text-sm font-bold uppercase tracking-widest">Memuat Data Wilayah...</p>
        </div>
      </div>
    );
  }

  const totalAktif = wilayahList.reduce((s, w) => s + parseInt(w.kontraktor_aktif || 0), 0);
  const wilayahDenganAdmin = adminList.length;

  return (
    <div className="min-h-screen bg-[#020617] relative font-['Inter',sans-serif] text-slate-300 pb-20">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute -bottom-60 right-0 w-[600px] h-[600px] rounded-full bg-amber-600/5 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)]" style={{ backgroundSize: "48px 48px" }} />
      </div>

      {/* Header */}
      <header className="relative z-30 sticky top-0 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <button onClick={() => window.location.href = "/admin/dashboard"} className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <img src={logoPBD.src || logoPBD} alt="" className="w-10 h-10 object-contain" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Admin Provinsi</div>
              <div className="text-base font-black text-white">Peta Wilayah Papua Barat Daya</div>
            </div>
          </div>
          <button
            onClick={() => setShowAssign(v => !v)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tugaskan Admin Wilayah
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Wilayah", value: 6, icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7", color: "amber" },
            { label: "Admin Ditugaskan", value: wilayahDenganAdmin, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "cyan" },
            { label: "Penugasan Aktif", value: totalAktif, icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "green" },
            { label: "Wilayah Tanpa Admin", value: 6 - wilayahDenganAdmin, icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "rose" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/10 p-5 bg-[#0f172a]/60 backdrop-blur-xl">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-${s.color}-500/10 border border-${s.color}-500/20`}>
                <svg className={`w-5 h-5 text-${s.color}-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={s.icon} />
                </svg>
              </div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Form Assign Admin (collapsible) */}
        {showAssign && (
          <div className="mb-10 rounded-2xl border border-amber-500/20 bg-[#0f172a]/80 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Tugaskan Admin Wilayah</h3>
            </div>
            <form onSubmit={handleAssign} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Admin yang Akan Ditugaskan</label>
                <input
                  type="email" value={form.admin_email} onChange={e => setForm(p => ({ ...p, admin_email: e.target.value }))}
                  placeholder="email@admin.dinas.go.id"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Wilayah Tugasan</label>
                <select value={form.wilayah_id} onChange={e => setForm(p => ({ ...p, wilayah_id: e.target.value }))}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all appearance-none [&>option]:bg-[#0f172a]">
                  <option value="">— Pilih Wilayah —</option>
                  {wilayahList.map(w => (
                    <option key={w.id} value={w.id}>{w.tipe === 'kota' ? '🏙️' : '🏔️'} {w.nama}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={submitting} className="h-12 px-8 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-60 whitespace-nowrap transition-all">
                {submitting ? "Memproses..." : "Tugaskan"}
              </button>
            </form>
            {formMsg && (
              <div className={`mt-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${formMsg.ok ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                {formMsg.msg}
              </div>
            )}
          </div>
        )}

        {/* Grid 6 Wilayah */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {wilayahList.map(w => {
            const color = WILAYAH_COLORS[w.kode] || WILAYAH_COLORS["KAB_SORSEL"];
            const admin = adminList.find(a => String(a.wilayah_id) === String(w.id));
            const aktif = parseInt(w.kontraktor_aktif || 0);

            return (
              <div key={w.id} className={`rounded-3xl border ${color.border} bg-gradient-to-br ${color.from} ${color.to} backdrop-blur-xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-2xl`}
                onClick={() => window.location.href = `/admin/wilayah/${w.id}`}>
                {/* Glow blob */}
                <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${color.from} blur-2xl opacity-50`} />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${color.accent} bg-black/30 px-2 py-0.5 rounded-full`}>
                        {w.tipe}
                      </span>
                      <h3 className="text-xl font-black text-white mt-2 leading-tight">{w.nama}</h3>
                    </div>
                    <span className="text-3xl">{color.icon}</span>
                  </div>

                  {/* Admin badge */}
                  <div className="mb-4 p-3 rounded-xl bg-black/30 border border-white/10">
                    {admin ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${color.from} border ${color.border} flex items-center justify-center font-bold text-sm ${color.accent}`}>
                          {(admin.name || admin.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{admin.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{admin.email}</div>
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                          <span className="flex h-1.5 w-1.5 rounded-full bg-green-500" />
                          <span className="text-[10px] text-green-400 font-bold">Aktif</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <span className="text-xs text-slate-400 italic">Belum ada admin ditugaskan</span>
                      </div>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`flex h-2 w-2 rounded-full ${aktif > 0 ? "bg-green-500" : "bg-slate-600"}`} />
                      <span className="text-xs font-bold text-white">{aktif}</span>
                      <span className="text-xs text-slate-400">kontraktor aktif</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${color.accent} group-hover:underline`}>
                      Buka Detail
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabel Semua Admin Wilayah */}
        {adminList.length > 0 && (
          <div className="mt-12 rounded-3xl border border-white/10 bg-[#0f172a]/60 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Direktori Admin Wilayah</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-slate-400 bg-black/30 border-b border-white/5">
                    {["Admin", "Email", "Wilayah", "Jenis", "Ditugaskan"].map(h => (
                      <th key={h} className="py-3 px-5 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adminList.map(a => {
                    const color = WILAYAH_COLORS[a.kode] || WILAYAH_COLORS["KAB_SORSEL"];
                    return (
                      <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${color.from} border ${color.border} flex items-center justify-center font-bold text-xs ${color.accent}`}>
                              {(a.name || a.email)[0].toUpperCase()}
                            </div>
                            <span className="font-bold text-white">{a.name || "—"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-slate-400 font-mono text-xs">{a.email}</td>
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${color.border} ${color.accent} bg-black/30`}>{a.wilayah_nama}</span>
                        </td>
                        <td className="py-4 px-5 capitalize text-xs text-slate-400">{a.tipe}</td>
                        <td className="py-4 px-5 text-xs text-slate-500 font-mono">
                          {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <footer className="relative z-10 mt-12 border-t border-white/10 bg-black/40 backdrop-blur-xl py-5">
        <div className="max-w-7xl mx-auto px-4 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          SIKAP — Sistem Multi-Wilayah Papua Barat Daya © 2025
        </div>
      </footer>
    </div>
  );
}
