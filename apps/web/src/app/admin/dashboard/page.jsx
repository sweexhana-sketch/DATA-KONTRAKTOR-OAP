import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Shield,
  LayoutDashboard,
  UserCog,
  Send,
  ClipboardList,
  Search,
  Eye,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: user, loading: userLoading } = useUser();
  const [stats, setStats] = useState(null);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'data-masuk'
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin";
    }
  }, [user, userLoading]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.id) {
        try {
          const res = await fetch(`/api/user/role?email=${encodeURIComponent(user.email)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.role !== "admin") {
              window.location.href = "/";
            }
            setUserRole(data.role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
    };
    fetchUserRole();
  }, [user]);

  useEffect(() => {
    if (userRole !== "admin") return;

    const fetchData = async () => {
      try {
        const [statsRes, contractorsRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/contractors"),
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
        if (contractorsRes.ok) {
          const data = await contractorsRes.json();
          setContractors(data.contractors || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole]);

  const filteredContractors = contractors.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.full_name || "").toLowerCase().includes(q) ||
      (c.company_name || "").toLowerCase().includes(q) ||
      (c.nik || "").toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    const map = {
      pending: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", label: "Pending" },
      approved: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Approved" },
      ditunjuk: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Ditunjuk → SI PRO" },
      rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Ditolak" },
    };
    const s = map[status] || map.pending;
    return (
      <span className={`px-2 py-1 ${s.bg} ${s.text} text-xs rounded border ${s.border} font-medium`}>
        {s.label}
      </span>
    );
  };

  if (userLoading || loading || !userRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="text-[#8A8FA6]">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E4E9F2] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => (window.location.href = "/")}
              className="w-8 h-8 bg-white border border-[#E4E9F2] rounded-full flex items-center justify-center hover:bg-[#F7F9FC]"
            >
              <ArrowLeft className="w-4 h-4 text-[#6F7689]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#2A2E45]">
                Dashboard Admin
              </h1>
              <p className="text-sm text-[#8A8FA6]">
                Dinas PUPR Papua Barat Daya
              </p>
            </div>
          </div>
          {/* Nav links */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab("overview")}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${
                activeTab === "overview"
                  ? "bg-[#EDF3FF] text-[#1570FF]"
                  : "text-[#6F7689] hover:bg-[#F7F9FC]"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("data-masuk")}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${
                activeTab === "data-masuk"
                  ? "bg-[#EDF3FF] text-[#1570FF]"
                  : "text-[#6F7689] hover:bg-[#F7F9FC]"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Data Masuk
              {contractors.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full font-bold">
                  {contractors.length}
                </span>
              )}
            </button>
            <button
              onClick={() => (window.location.href = "/admin/contractors")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#6F7689] hover:bg-[#F7F9FC]"
            >
              <Send className="w-4 h-4" />
              Screening
            </button>
            <button
              onClick={() => (window.location.href = "/admin/users")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#6F7689] hover:bg-[#F7F9FC]"
            >
              <UserCog className="w-4 h-4" />
              Pengguna
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">

        {/* ═══════ TAB: OVERVIEW ═══════ */}
        {activeTab === "overview" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white border border-[#E4E9F2] rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-[#2A2E45] mb-1">
                  {stats?.stats?.total || 0}
                </div>
                <div className="text-sm text-[#8A8FA6]">Total Kontraktor</div>
              </div>

              <div className="bg-white border border-[#E4E9F2] rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#2A2E45] mb-1">
                  {stats?.stats?.pending || 0}
                </div>
                <div className="text-sm text-[#8A8FA6]">Pending</div>
              </div>

              <div className="bg-white border border-[#E4E9F2] rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#2A2E45] mb-1">
                  {stats?.stats?.approved || 0}
                </div>
                <div className="text-sm text-[#8A8FA6]">Approved</div>
              </div>

              <div className="bg-white border border-blue-200 rounded-xl p-5 bg-blue-50/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Send className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  {stats?.stats?.ditunjuk || 0}
                </div>
                <div className="text-sm text-blue-600 font-medium">Ditunjuk → SI PRO</div>
              </div>

              <div className="bg-white border border-[#E4E9F2] rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#2A2E45] mb-1">
                  {stats?.stats?.rejected || 0}
                </div>
                <div className="text-sm text-[#8A8FA6]">Ditolak</div>
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white border border-[#E4E9F2] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#2A2E45]">
                  Pendaftaran Terbaru
                </h2>
                <button
                  onClick={() => setActiveTab("data-masuk")}
                  className="text-sm text-[#1570FF] hover:text-[#0F5FE6] font-semibold"
                >
                  Lihat Semua →
                </button>
              </div>

              {contractors.length > 0 ? (
                <div className="space-y-3">
                  {contractors.slice(0, 5).map((contractor) => (
                    <div
                      key={contractor.id}
                      className="flex items-center justify-between p-4 bg-[#FAFBFD] rounded-lg border border-[#E4E9F2] hover:bg-[#F0F4FF] cursor-pointer transition-colors"
                      onClick={() =>
                        (window.location.href = `/admin/contractors/${contractor.id}`)
                      }
                    >
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-[#2A2E45] mb-1">
                          {contractor.full_name}
                        </h3>
                        <p className="text-xs text-[#8A8FA6]">
                          {contractor.company_name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right mr-3">
                          <p className="text-xs text-[#8A8FA6]">
                            {new Date(contractor.created_at).toLocaleDateString("id-ID", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        </div>
                        {getStatusBadge(contractor.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#8A8FA6]">
                  Belum ada pendaftaran kontraktor
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <button
                onClick={() => (window.location.href = "/admin/contractors?status=pending")}
                className="bg-white border border-[#E4E9F2] rounded-xl p-6 hover:bg-[#FAFBFD] text-left transition-colors group"
              >
                <Clock className="w-8 h-8 text-yellow-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-[#2A2E45] mb-2">
                  Verifikasi Kontraktor
                </h3>
                <p className="text-sm text-[#8A8FA6]">
                  Tinjau {stats?.stats?.pending || 0} kontraktor yang menunggu verifikasi
                </p>
              </button>

              <button
                onClick={() => (window.location.href = "/admin/contractors")}
                className="bg-white border border-blue-200 rounded-xl p-6 hover:bg-blue-50/30 text-left transition-colors group"
              >
                <Send className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-[#2A2E45] mb-2">
                  Screening → SI PRO
                </h3>
                <p className="text-sm text-[#8A8FA6]">
                  Pilih kontraktor yang akan disinkronkan ke SI PRO
                </p>
              </button>

              <button
                onClick={() => (window.location.href = "/admin/users")}
                className="bg-white border border-[#E4E9F2] rounded-xl p-6 hover:bg-[#FAFBFD] text-left transition-colors group"
              >
                <Shield className="w-8 h-8 text-indigo-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-[#2A2E45] mb-2">
                  Kelola Akun Pengguna
                </h3>
                <p className="text-sm text-[#8A8FA6]">
                  Lihat semua akun terdaftar dan atur role
                </p>
              </button>
            </div>
          </>
        )}

        {/* ═══════ TAB: DATA MASUK ═══════ */}
        {activeTab === "data-masuk" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#2A2E45]">Data Kontraktor Masuk</h2>
                <p className="text-sm text-[#8A8FA6]">Semua data yang telah diinput oleh pengguna melalui form pendataan</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#8A8FA6] font-medium">{filteredContractors.length} data</span>
                <button
                  onClick={() => (window.location.href = "/admin/contractors")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Screening
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white border border-[#E4E9F2] rounded-xl p-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8FA6]" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan NIK, nama, atau perusahaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 border border-[#E4E9F2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                />
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white border border-[#E4E9F2] rounded-xl overflow-hidden">
              {filteredContractors.length === 0 ? (
                <div className="p-12 text-center text-[#8A8FA6]">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-[#D1D5DB]" />
                  <p className="font-medium">Belum ada data kontraktor</p>
                  <p className="text-xs mt-1">Data akan muncul setelah pengguna menginput melalui form pendataan</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F7F9FC] border-b border-[#E4E9F2]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">No</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">NIK</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">Nama Direktur</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">Perusahaan</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">Jenis</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">Telepon</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">Tanggal Input</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[#6F7689]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E9F2]">
                      {filteredContractors.map((c, i) => (
                        <tr key={c.id} className="hover:bg-[#FAFBFD] transition-colors">
                          <td className="px-4 py-3 text-sm text-[#8A8FA6] text-center">{i + 1}</td>
                          <td className="px-4 py-3 text-sm text-[#2A2E45] font-mono">{c.nik || "-"}</td>
                          <td className="px-4 py-3 text-sm text-[#2A2E45] font-medium">{c.full_name}</td>
                          <td className="px-4 py-3 text-sm text-[#2A2E45] font-semibold">{c.company_name}</td>
                          <td className="px-4 py-3">
                            {c.company_type && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {c.company_type}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#2A2E45]">{c.phone || "-"}</td>
                          <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                          <td className="px-4 py-3 text-sm text-[#8A8FA6]">
                            {c.created_at
                              ? new Date(c.created_at).toLocaleDateString("id-ID", {
                                  day: "numeric", month: "short", year: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => (window.location.href = `/admin/contractors/${c.id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EDF3FF] text-[#1570FF] rounded text-xs font-semibold hover:bg-[#DBEAFE]"
                            >
                              <Eye className="w-3 h-3" />
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
