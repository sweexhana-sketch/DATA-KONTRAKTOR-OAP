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
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: user, loading: userLoading } = useUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin";
    }
  }, [user, userLoading]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.id) {
        try {
          const res = await fetch("/api/user/role");
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
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userRole === "admin") {
      fetchStats();
    }
  }, [userRole]);

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => (window.location.href = "/admin/dashboard")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-[#EDF3FF] text-[#1570FF]"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => (window.location.href = "/admin/users")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#6F7689] hover:bg-[#F7F9FC]"
            >
              <UserCog className="w-4 h-4" />
              Pengguna
            </button>
            <button
              onClick={() => (window.location.href = "/admin/contractors")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#6F7689] hover:bg-[#F7F9FC]"
            >
              <Users className="w-4 h-4" />
              Kontraktor
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-[#E4E9F2] rounded p-6">
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

          <div className="bg-white border border-[#E4E9F2] rounded p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#2A2E45] mb-1">
              {stats?.stats?.approved || 0}
            </div>
            <div className="text-sm text-[#8A8FA6]">Terverifikasi</div>
          </div>

          <div className="bg-white border border-[#E4E9F2] rounded p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#2A2E45] mb-1">
              {stats?.stats?.pending || 0}
            </div>
            <div className="text-sm text-[#8A8FA6]">Menunggu Verifikasi</div>
          </div>

          <div className="bg-white border border-[#E4E9F2] rounded p-6">
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

          <div className="bg-white border border-[#E4E9F2] rounded p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#2A2E45] mb-1">
              {stats?.stats?.totalUsers || 0}
            </div>
            <div className="text-sm text-[#8A8FA6]">Total Pengguna</div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white border border-[#E4E9F2] rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#2A2E45]">
              Pendaftaran Terbaru
            </h2>
            <button
              onClick={() => (window.location.href = "/admin/contractors")}
              className="text-sm text-[#1570FF] hover:text-[#0F5FE6] font-semibold"
            >
              Lihat Semua →
            </button>
          </div>

          {stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSubmissions.map((contractor) => (
                <div
                  key={contractor.id}
                  className="flex items-center justify-between p-4 bg-[#FAFBFD] rounded border border-[#E4E9F2] hover:bg-[#F7F9FC] cursor-pointer transition-colors"
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
                    <div className="text-right mr-4">
                      <p className="text-xs text-[#8A8FA6]">
                        {new Date(contractor.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    {contractor.status === "pending" && (
                      <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200">
                        Pending
                      </span>
                    )}
                    {contractor.status === "approved" && (
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200">
                        Approved
                      </span>
                    )}
                    {contractor.status === "rejected" && (
                      <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#8A8FA6]">
              Belum ada pendaftaran
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <button
            onClick={() =>
              (window.location.href = "/admin/contractors?status=pending")
            }
            className="bg-white border border-[#E4E9F2] rounded p-6 hover:bg-[#FAFBFD] text-left transition-colors"
          >
            <Clock className="w-8 h-8 text-yellow-600 mb-3" />
            <h3 className="text-lg font-semibold text-[#2A2E45] mb-2">
              Verifikasi Kontraktor
            </h3>
            <p className="text-sm text-[#8A8FA6]">
              Tinjau dan verifikasi {stats?.stats?.pending || 0} kontraktor yang
              menunggu
            </p>
          </button>

          <button
            onClick={() => (window.location.href = "/admin/contractors")}
            className="bg-white border border-[#E4E9F2] rounded p-6 hover:bg-[#FAFBFD] text-left transition-colors"
          >
            <Users className="w-8 h-8 text-[#1570FF] mb-3" />
            <h3 className="text-lg font-semibold text-[#2A2E45] mb-2">
              Kelola Kontraktor
            </h3>
            <p className="text-sm text-[#8A8FA6]">
              Lihat dan kelola semua data kontraktor terdaftar
            </p>
          </button>

          <button
            onClick={() => (window.location.href = "/admin/users")}
            className="bg-white border border-[#E4E9F2] rounded p-6 hover:bg-[#FAFBFD] text-left transition-colors"
          >
            <Shield className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="text-lg font-semibold text-[#2A2E45] mb-2">
              Kelola Akun Pengguna
            </h3>
            <p className="text-sm text-[#8A8FA6]">
              Lihat semua akun terdaftar, status input, dan atur role
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
