import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import logoPBD from "@/assets/logo-papua-barat-daya.png";

const ADMIN_MENUS = [
  {
    href: "/admin/dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    label: "Dashboard Admin",
    desc: "Statistik, data masuk, dan pengelolaan kontraktor",
    accent: "amber",
    badge: null,
  },
  {
    href: "/admin/wilayah",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    label: "Peta Wilayah",
    desc: "Kelola penugasan kontraktor per kabupaten/kota",
    accent: "cyan",
    badge: "Baru",
  },
  {
    href: "/admin/contractors",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    label: "Daftar Kontraktor",
    desc: "Verifikasi dan screening data kontraktor OAP",
    accent: "teal",
    badge: null,
  },
  {
    href: "/admin/users",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    label: "Kelola Pengguna",
    desc: "Manajemen akun dan role pengguna sistem",
    accent: "violet",
    badge: null,
  },
];

const USER_MENUS = [
  {
    href: "/dashboard",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    label: "Input Data Perusahaan",
    desc: "Lengkapi profil dan dokumen perusahaan Anda",
    accent: "amber",
    badge: null,
  },
  {
    href: "/contractor/profile",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    label: "Status Pendaftaran",
    desc: "Pantau status verifikasi data perusahaan Anda",
    accent: "green",
    badge: null,
  },
];

const ACCENT = {
  amber:  { border: "border-amber-500/30",  bg: "bg-amber-500/10",  text: "text-amber-400",  glow: "shadow-[0_0_20px_rgba(245,158,11,0.1)]" },
  cyan:   { border: "border-cyan-500/30",   bg: "bg-cyan-500/10",   text: "text-cyan-400",   glow: "shadow-[0_0_20px_rgba(6,182,212,0.1)]" },
  teal:   { border: "border-teal-500/30",   bg: "bg-teal-500/10",   text: "text-teal-400",   glow: "shadow-[0_0_20px_rgba(20,184,166,0.1)]" },
  violet: { border: "border-violet-500/30", bg: "bg-violet-500/10", text: "text-violet-400", glow: "shadow-[0_0_20px_rgba(139,92,246,0.1)]" },
  green:  { border: "border-green-500/30",  bg: "bg-green-500/10",  text: "text-green-400",  glow: "shadow-[0_0_20px_rgba(34,197,94,0.1)]" },
};

export default function HomePage() {
  const { data: user, loading: userLoading } = useUser();
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) window.location.href = "/account/signin";
  }, [user, userLoading]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.id) {
        try {
          const res = await fetch(`/api/user/role?email=${encodeURIComponent(user.email)}`);
          if (res.ok) {
            const data = await res.json();
            setUserRole(data.role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        } finally {
          setRoleLoading(false);
        }
      }
    };
    fetchUserRole();
  }, [user]);

  const isAdmin = userRole && ['admin', 'admin_provinsi', 'admin_wilayah'].includes(userRole);
  const menus = isAdmin ? ADMIN_MENUS : USER_MENUS;

  const roleLabel = {
    admin: "Administrator",
    admin_provinsi: "Admin Provinsi",
    admin_wilayah: "Admin Wilayah",
    user: "Kontraktor OAP",
  }[userRole] || "Pengguna";

  if (userLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center font-['Inter',sans-serif]">
        <div className="text-center animate-pulse">
          <img src={logoPBD.src || logoPBD} alt="Logo" className="w-20 h-20 mx-auto mb-5 opacity-70 drop-shadow-2xl" />
          <p className="text-amber-400 font-bold tracking-widest uppercase text-xs">Memverifikasi Sesi...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden font-['Inter',sans-serif] text-slate-300">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full bg-blue-900/15 blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-amber-600/8 blur-3xl" />
        <div className="absolute -bottom-60 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-teal-900/10 blur-3xl animate-pulse" style={{ animationDuration: "12s" }} />
        <div className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)]" style={{ backgroundSize: "48px 48px" }} />
      </div>

      {/* Header */}
      <header className="relative z-30 sticky top-0 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <img src={logoPBD.src || logoPBD} alt="Logo PBD" className="w-11 h-11 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Dinas PUPR</div>
              <div className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Provinsi Papua Barat Daya</div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase">Terintegrasi SI PRO</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-bold text-white">{user.name || user.email}</div>
              <div className="text-xs text-amber-400 font-semibold">{roleLabel}</div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-black bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              {(user.name || user.email || "U")[0].toUpperCase()}
            </div>
            <button onClick={() => window.location.href = "/account/logout"}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-400 transition border-l border-white/10 pl-4 py-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Banner */}
        <div className="rounded-3xl mb-12 p-8 sm:p-12 border border-white/10 relative overflow-hidden bg-[#0f172a]/60 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-64 opacity-[0.04] pointer-events-none flex items-center justify-center">
            <img src={logoPBD.src || logoPBD} alt="" className="w-56 h-56 object-contain" />
          </div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-5">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">{roleLabel} — Akun Aktif</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Selamat Datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">{user.name?.split(" ")[0] || "Pengguna"}</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
              {isAdmin
                ? "Gunakan menu di bawah untuk mengelola data kontraktor, memverifikasi dokumen, dan mengatur penugasan per wilayah di Provinsi Papua Barat Daya."
                : "Lengkapi data perusahaan Anda agar dapat diverifikasi oleh Admin Dinas PUPR dan terintegrasi dengan ekosistem SI PRO."
              }
            </p>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {menus.map((menu) => {
            const a = ACCENT[menu.accent];
            return (
              <button
                key={menu.href}
                onClick={() => window.location.href = menu.href}
                className={`relative group text-left rounded-3xl border ${a.border} bg-[#0f172a]/60 backdrop-blur-xl p-7 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 ${a.glow} overflow-hidden`}
              >
                {/* Glow blob */}
                <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full ${a.bg} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />

                <div className="relative z-10">
                  {/* Badge */}
                  {menu.badge && (
                    <span className={`absolute top-0 right-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${a.bg} ${a.text} border ${a.border}`}>
                      {menu.badge}
                    </span>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl ${a.bg} border ${a.border} flex items-center justify-center mb-5 ${a.text} group-hover:scale-110 transition-transform`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={menu.icon} />
                    </svg>
                  </div>

                  <h3 className="text-base font-black text-white mb-2 group-hover:text-amber-100 transition-colors">{menu.label}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{menu.desc}</p>

                  <div className={`mt-5 flex items-center gap-1.5 text-xs font-bold ${a.text} opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0`}>
                    Buka
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info box */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-[#0f172a]/40 backdrop-blur-xl p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-blue-300 mb-1">Informasi Penting</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isAdmin
                ? "Sebagai admin, Anda dapat melihat, memverifikasi, dan mengelola semua data kontraktor yang terdaftar. Gunakan menu Peta Wilayah untuk mengelola penugasan kontraktor per kabupaten/kota."
                : "Pastikan data yang Anda masukkan sesuai dengan dokumen resmi. Data akan diverifikasi oleh admin PUPR Provinsi Papua Barat Daya sebelum terintegrasi ke SI PRO."
              }
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-8 border-t border-white/10 bg-black/40 backdrop-blur-xl py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoPBD.src || logoPBD} alt="" className="w-8 h-8 object-contain opacity-40 grayscale" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Dinas PUPR Provinsi Papua Barat Daya</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">SIKAP / SI PRO © 2025</p>
        </div>
      </footer>
    </div>
  );
}
