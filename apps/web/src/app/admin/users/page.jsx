import { useState, useEffect, useCallback } from "react";
import useUser from "@/utils/useUser";
import {
    ArrowLeft,
    Search,
    Filter,
    Users,
    Shield,
    UserCheck,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronRight,
} from "lucide-react";

export default function AdminUsersPage() {
    const { data: user, loading: userLoading } = useUser();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);

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

    const fetchUsers = useCallback(async () => {
        if (userRole !== "admin") return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (roleFilter !== "all") params.append("role", roleFilter);
            const res = await fetch(`/api/admin/users?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    }, [userRole, searchQuery, roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleRoleChange = async (targetUser, newRole) => {
        setActionLoading(targetUser.id);
        try {
            const res = await fetch(`/api/admin/users/${targetUser.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            const data = await res.json();
            if (res.ok) {
                setUsers((prev) =>
                    prev.map((u) =>
                        u.id === targetUser.id ? { ...u, role: data.user.role } : u
                    )
                );
                showToast(`Role ${data.user.email} berhasil diubah ke "${newRole}"`);
            } else {
                showToast(data.error || "Gagal mengubah role", "error");
            }
        } catch (error) {
            showToast("Terjadi kesalahan", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const getSubmissionBadge = (submissionStatus) => {
        if (!submissionStatus) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                    <AlertCircle className="w-3 h-3" />
                    Belum Input
                </span>
            );
        }
        const map = {
            pending: {
                bg: "bg-yellow-50",
                text: "text-yellow-700",
                border: "border-yellow-200",
                icon: <Clock className="w-3 h-3" />,
                label: "Menunggu",
            },
            approved: {
                bg: "bg-green-50",
                text: "text-green-700",
                border: "border-green-200",
                icon: <CheckCircle className="w-3 h-3" />,
                label: "Terverifikasi",
            },
            rejected: {
                bg: "bg-red-50",
                text: "text-red-700",
                border: "border-red-200",
                icon: <XCircle className="w-3 h-3" />,
                label: "Ditolak",
            },
        };
        const s = map[submissionStatus] || map.pending;
        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}
            >
                {s.icon}
                {s.label}
            </span>
        );
    };

    const getRoleBadge = (role) => {
        if (role === "admin") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white">
                    <Shield className="w-3 h-3" />
                    Admin
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#EDF3FF] text-[#1570FF] border border-[#BFDBFE]">
                <UserCheck className="w-3 h-3" />
                {role === "kontraktor" ? "Kontraktor" : "User"}
            </span>
        );
    };

    if (userLoading || !userRole) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
                <div className="text-[#8A8FA6]">Memuat...</div>
            </div>
        );
    }

    const currentUserId = user?.id;

    return (
        <div className="min-h-screen bg-[#F7F9FC]">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-sm font-medium transition-all ${toast.type === "error"
                            ? "bg-red-600 text-white"
                            : "bg-green-600 text-white"
                        }`}
                >
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-[#E4E9F2] px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => (window.location.href = "/admin/dashboard")}
                            className="w-8 h-8 bg-white border border-[#E4E9F2] rounded-full flex items-center justify-center hover:bg-[#F7F9FC]"
                        >
                            <ArrowLeft className="w-4 h-4 text-[#6F7689]" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-[#2A2E45]">
                                Kelola Akun Pengguna
                            </h1>
                            <p className="text-sm text-[#8A8FA6]">
                                Dinas PUPR Papua Barat Daya
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#8A8FA6]">
                        <Users className="w-4 h-4" />
                        <span>{users.length} pengguna</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-6">
                {/* Filters */}
                <div className="bg-white border border-[#E4E9F2] rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8FA6]" />
                            <input
                                type="text"
                                placeholder="Cari nama atau email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-3 border border-[#E4E9F2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8FA6]" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full h-10 pl-10 pr-3 border border-[#E4E9F2] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF] bg-white"
                            >
                                <option value="all">Semua Role</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                                <option value="kontraktor">Kontraktor</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white border border-[#E4E9F2] rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-[#8A8FA6]">Memuat data...</div>
                    ) : users.length === 0 ? (
                        <div className="p-12 text-center text-[#8A8FA6]">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>Tidak ada pengguna ditemukan</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#F7F9FC] border-b border-[#E4E9F2]">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-[#6F7689] uppercase tracking-wider">
                                            Pengguna
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-[#6F7689] uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-[#6F7689] uppercase tracking-wider">
                                            Data Kontraktor
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-[#6F7689] uppercase tracking-wider">
                                            Status Input
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-[#6F7689] uppercase tracking-wider">
                                            Terdaftar
                                        </th>
                                        <th className="px-5 py-3 text-center text-xs font-semibold text-[#6F7689] uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E4E9F2]">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-[#FAFBFD] transition-colors">
                                            {/* Pengguna */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1570FF] to-[#6941C6] flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                        {(u.name || u.email || "?")[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-[#2A2E45]">
                                                            {u.name || "(Tanpa Nama)"}
                                                        </p>
                                                        <p className="text-xs text-[#8A8FA6]">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="px-5 py-4">{getRoleBadge(u.role)}</td>

                                            {/* Data Kontraktor */}
                                            <td className="px-5 py-4">
                                                {u.contractor_id ? (
                                                    <div>
                                                        <p className="text-sm font-medium text-[#2A2E45]">
                                                            {u.contractor_name}
                                                        </p>
                                                        <p className="text-xs text-[#8A8FA6]">
                                                            {u.company_name}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-[#8A8FA6] italic">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status Input */}
                                            <td className="px-5 py-4">
                                                {getSubmissionBadge(u.submission_status)}
                                            </td>

                                            {/* Terdaftar */}
                                            <td className="px-5 py-4 text-sm text-[#8A8FA6]">
                                                {new Date(u.created_at).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>

                                            {/* Aksi */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* View contractor detail if exists */}
                                                    {u.contractor_id && (
                                                        <button
                                                            onClick={() =>
                                                                (window.location.href = `/admin/contractors/${u.contractor_id}`)
                                                            }
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#EDF3FF] text-[#1570FF] rounded-lg text-xs font-semibold hover:bg-[#DBEAFE] transition-colors"
                                                        >
                                                            Lihat Data
                                                            <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    )}

                                                    {/* Role toggle — disabled for own account */}
                                                    {u.id !== currentUserId && (
                                                        <select
                                                            value={u.role}
                                                            disabled={actionLoading === u.id}
                                                            onChange={(e) =>
                                                                handleRoleChange(u, e.target.value)
                                                            }
                                                            className="px-2 py-1.5 border border-[#E4E9F2] rounded-lg text-xs text-[#2A2E45] bg-white focus:outline-none focus:ring-2 focus:ring-[#1570FF] disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <option value="user">User</option>
                                                            <option value="kontraktor">Kontraktor</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    )}

                                                    {u.id === currentUserId && (
                                                        <span className="text-xs text-[#8A8FA6] italic">
                                                            Akun Anda
                                                        </span>
                                                    )}
                                                </div>
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
