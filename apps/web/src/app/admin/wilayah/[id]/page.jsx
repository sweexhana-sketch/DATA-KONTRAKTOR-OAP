import { useState, useEffect } from "react";
import { useSession } from "@auth/create/react";
import logoPBD from "@/assets/logo-papua-barat-daya.png";
import { useParams } from "react-router";

const STATUS_MAP = {
  aktif:      { label: "Aktif",      dot: "bg-green-500",  text: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
  selesai:    { label: "Selesai",    dot: "bg-blue-500",   text: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  dibatalkan: { label: "Dibatalkan", dot: "bg-slate-500",  text: "text-slate-400",  bg: "bg-slate-500/10 border-slate-500/20" },
};

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—";
}

export default function AdminWilayahDetailPage() {
  const { data: session, status } = useSession();
  const { id } = useParams();

  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("aktif");
  const [updatingId, setUpdatingId] = useState(null);
  const [msg, setMsg]               = useState(null);
  const [search, setSearch]         = useState("");

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/wilayah/${id}/stats`);
    if (res.ok) { const d = await res.json(); setData(d); }
    setLoading(false);
  };

  useEffect(() => {
    if (status === "unauthenticated") { window.location.href = "/account/signin"; return; }
    if (status === "authenticated" && id) fetchData();
  }, [status, id]);

  const handleUpdateStatus = async (penugasanId, newStatus) => {
    if (!confirm(`Tandai penugasan ini sebagai "${newStatus}"?`)) return;
    setUpdatingId(penugasanId); setMsg(null);
    const res = await fetch(`/api/penugasan/${penugasanId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, updated_by_email: session.user.email }),
    });
    const d = await res.json();
    if (res.ok) { setMsg({ ok: true, text: d.message }); fetchData(); }
    else { setMsg({ ok: false, text: d.error }); }
    setUpdatingId(null);
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center font-['Inter',sans-serif]">
        <div className="animate-pulse text-center">
          <img src={logoPBD.src || logoPBD} alt="" className="w-20 h-20 mx-auto mb-4 opacity-60" />
          <p className="text-amber-400 text-sm font-bold uppercase tracking-widest">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const penugasan = (data.penugasan || []).filter(p => {
    const matchTab = activeTab === "semua" || p.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch = !q || (p.company_name || "").toLowerCase().includes(q) || (p.nama_paket || "").toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const { wilayah, stats, admins } = data;

  return (
    <div className="min-h-screen bg-[#020617] relative font-['Inter',sans-serif] text-slate-300 pb-20">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)]" style={{ backgroundSize: "48px 48px" }} />
      </div>

      {/* Header */}
      <header className="relative z-30 sticky top-0 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <button onClick={() => window.location.href = "/admin/wilayah"} className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <div className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">{wilayah?.tipe}</div>
              <div className="text-base font-black text-white">{wilayah?.nama}</div>
            </div>
          </div>
          <button
            onClick={() => window.location.href = `/admin/penugasan/baru?wilayah_id=${id}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tunjuk Kontraktor
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Penugasan", value: stats.total,     color: "amber" },
            { label: "Aktif",           value: stats.aktif,     color: "green" },
            { label: "Selesai",         value: stats.selesai,   color: "blue"  },
            { label: "Dibatalkan",      value: stats.dibatalkan,color: "slate" },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border border-${s.color}-500/20 bg-[#0f172a]/60 backdrop-blur-xl p-5`}>
              <div className={`text-2xl font-black text-${s.color}-400`}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Admin info card */}
        {admins.length > 0 && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-[#0f172a]/60 backdrop-blur-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg">
              {(admins[0].name || admins[0].email)[0].toUpperCase()}
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-0.5">Admin Wilayah</div>
              <div className="text-sm font-bold text-white">{admins[0].name}</div>
              <div className="text-xs text-slate-400 font-mono">{admins[0].email}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400 font-bold uppercase tracking-wider">Aktif Bertugas</span>
            </div>
          </div>
        )}

        {/* Notification */}
        {msg && (
          <div className={`mb-6 rounded-xl p-4 flex items-center gap-3 text-sm font-medium border ${msg.ok ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["aktif", "selesai", "dibatalkan", "semua"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-500 hover:text-white border border-white/10"}`}>
              {tab === "semua" ? "Semua" : STATUS_MAP[tab]?.label}
              <span className="ml-2 text-[10px] opacity-60">
                {tab === "semua" ? data.penugasan?.length : data.penugasan?.filter(p => p.status === tab).length}
              </span>
            </button>
          ))}

          {/* Search */}
          <div className="relative ml-auto">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari perusahaan / paket..."
              className="pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-all w-60" />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-3xl border border-white/10 bg-[#0f172a]/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          {penugasan.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <p className="text-sm font-bold">Belum ada penugasan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-slate-400 bg-black/40 border-b border-white/5 text-left">
                    {["No", "Perusahaan", "Direktur", "Nama Paket", "Periode", "Status", "Aksi"].map(h => (
                      <th key={h} className="py-4 px-5 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {penugasan.map((p, i) => {
                    const s = STATUS_MAP[p.status] || STATUS_MAP.aktif;
                    return (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-5 text-slate-600 font-mono text-xs">{(i + 1).toString().padStart(2, "0")}</td>
                        <td className="py-4 px-5">
                          <div className="font-bold text-white">{p.company_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.company_type}</div>
                        </td>
                        <td className="py-4 px-5 text-slate-300 text-xs">{p.full_name}</td>
                        <td className="py-4 px-5">
                          <div className="font-semibold text-white text-xs">{p.nama_paket}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">TA {p.tahun_anggaran}</div>
                        </td>
                        <td className="py-4 px-5 text-xs text-slate-400">
                          <div>{fmtDate(p.tanggal_mulai)}</div>
                          <div className="text-slate-600">s/d {fmtDate(p.tanggal_selesai)}</div>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          {p.status === "aktif" && (
                            <div className="flex gap-2">
                              <button onClick={() => handleUpdateStatus(p.id, "selesai")} disabled={updatingId === p.id}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-black bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 transition-all disabled:opacity-50">
                                ✓ Selesai
                              </button>
                              <button onClick={() => handleUpdateStatus(p.id, "dibatalkan")} disabled={updatingId === p.id}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-300 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50">
                                Batalkan
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
