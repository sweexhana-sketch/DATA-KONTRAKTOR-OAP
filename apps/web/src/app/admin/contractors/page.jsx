import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import {
  ArrowLeft,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export default function AdminContractorsPage() {
  const { data: user, loading: userLoading } = useUser();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
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
    const fetchContractors = async () => {
      if (userRole !== "admin") return;

      try {
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (searchQuery) params.append("search", searchQuery);

        const res = await fetch(`/api/contractors?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setContractors(data.contractors);
        }
      } catch (error) {
        console.error("Error fetching contractors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, [userRole, statusFilter, searchQuery]);

  const getStatusBadge = (status) => {
    const styles = {
      pending: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
        icon: Clock,
        label: "Pending",
      },
      approved: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        icon: CheckCircle,
        label: "Approved",
      },
      rejected: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: XCircle,
        label: "Rejected",
      },
    };

    const style = styles[status] || styles.pending;
    const Icon = style.icon;

    return (
      <div
        className={`inline-flex items-center space-x-1 px-2 py-1 rounded border ${style.bg} ${style.border}`}
      >
        <Icon className={`w-3 h-3 ${style.text}`} />
        <span className={`text-xs font-medium ${style.text}`}>
          {style.label}
        </span>
      </div>
    );
  };

  if (userLoading || !userRole) {
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
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <button
            onClick={() => (window.location.href = "/")}
            className="w-8 h-8 bg-white border border-[#E4E9F2] rounded-full flex items-center justify-center hover:bg-[#F7F9FC]"
          >
            <ArrowLeft className="w-4 h-4 text-[#6F7689]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#2A2E45]">
              Daftar Kontraktor
            </h1>
            <p className="text-sm text-[#8A8FA6]">
              Dinas PUPR Papua Barat Daya
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white border border-[#E4E9F2] rounded p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8FA6]" />
              <input
                type="text"
                placeholder="Cari NIK, nama, atau perusahaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8FA6]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 pl-10 pr-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu Verifikasi</option>
                <option value="approved">Terverifikasi</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contractors List */}
        <div className="bg-white border border-[#E4E9F2] rounded">
          {loading ? (
            <div className="p-8 text-center text-[#8A8FA6]">Memuat...</div>
          ) : contractors.length === 0 ? (
            <div className="p-8 text-center text-[#8A8FA6]">
              Tidak ada data kontraktor
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F7F9FC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">
                      NIK
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">
                      Nama Lengkap
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">
                      Perusahaan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">
                      Telepon
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6F7689]">
                      Tanggal Daftar
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#6F7689]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E9F2]">
                  {contractors.map((contractor) => (
                    <tr key={contractor.id} className="hover:bg-[#FAFBFD]">
                      <td className="px-4 py-3 text-sm text-[#2A2E45]">
                        {contractor.nik}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#2A2E45] font-medium">
                        {contractor.full_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#2A2E45]">
                        {contractor.company_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#2A2E45]">
                        {contractor.phone}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(contractor.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#8A8FA6]">
                        {new Date(contractor.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            (window.location.href = `/admin/contractors/${contractor.id}`)
                          }
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-[#EDF3FF] text-[#1570FF] rounded text-xs font-semibold hover:bg-[#DBEAFE]"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Lihat</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
