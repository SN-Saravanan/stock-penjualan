import ModalPortal from "../../components/ui/ModalPortal";
import {
  KeyRound,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast, toastPromise } from "../../utils/toast";

import api from "../../services/api";

import useAuth from "../../hooks/useAuth";

import { formatDateTime } from "../../utils/formatters";

const initialUserForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "karyawan",
  status: "active",
};

function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [userModal, setUserModal] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);

  const [userForm, setUserForm] = useState(initialUserForm);

  const [resetUser, setResetUser] = useState(null);

  const [resetForm, setResetForm] = useState({
    new_password: "",
    confirm_password: "",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // ==========================================================
  // FETCH USERS
  // ==========================================================

  const fetchUsers = useCallback(async (showToast = false) => {
    try {
      const response = await api.get("/users");

      setUsers(response.data.data || []);

      if (showToast) {
        toast.success("Data user diperbarui");
      }
    } catch (error) {
      console.error("Fetch users error:", error);

      toast.error(error.response?.data?.message || "Gagal mengambil data user");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Abaikan respons request jika komponen sudah dibersihkan.
    let ignore = false;

    api
      .get("/users")
      .then((response) => {
        if (!ignore) {
          setUsers(response.data.data || []);
        }
      })
      .catch((error) => {
        if (ignore) return;

        console.error("Fetch users error:", error);
        toast.error(
          error.response?.data?.message || "Gagal mengambil data user",
        );
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name?.toLowerCase().includes(keyword) ||
        item.email?.toLowerCase().includes(keyword);

      const matchesRole = !roleFilter || item.role === roleFilter;

      const matchesStatus = !statusFilter || item.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary = useMemo(() => {
    return {
      total: users.length,

      admin: users.filter((item) => item.role === "admin").length,

      employee: users.filter((item) => item.role === "karyawan").length,

      active: users.filter((item) => item.status === "active").length,
    };
  }, [users]);

  // ==========================================================
  // CREATE / EDIT
  // ==========================================================

  const openCreate = () => {
    setSelectedUser(null);

    setUserForm(initialUserForm);

    setUserModal("create");
  };

  const openEdit = (item) => {
    setSelectedUser(item);

    setUserForm({
      name: item.name || "",

      email: item.email || "",

      password: "",

      confirmPassword: "",

      role: item.role,

      status: item.status,
    });

    setUserModal("edit");
  };

  const handleUserChange = (event) => {
    const { name, value } = event.target;

    setUserForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveUser = async (event) => {
    event.preventDefault();

    if (!userForm.name.trim() || !userForm.email.trim()) {
      toast.error("Nama dan email wajib diisi");

      return;
    }

    if (userModal === "create") {
      if (!userForm.password || !userForm.confirmPassword) {
        toast.error("Password wajib diisi");

        return;
      }

      if (userForm.password.length < 8) {
        toast.error("Password minimal 8 karakter");

        return;
      }

      if (userForm.password !== userForm.confirmPassword) {
        toast.error("Konfirmasi password tidak sama");

        return;
      }
    }

    try {
      setSubmitting(true);

      if (userModal === "create") {
        await toastPromise(api.post("/users", userForm), {
          loading: "Menyimpan user...",
          success: "User berhasil ditambahkan",
          error: (err) => err.response?.data?.message || "Gagal menyimpan user",
        });
      } else {
        await toastPromise(
          api.put(`/users/${selectedUser.id}`, {
            name: userForm.name,

            email: userForm.email,

            role: userForm.role,

            status: userForm.status,
          }),
          {
            loading: "Menyimpan perubahan...",
            success: "User berhasil diperbarui",
            error: (err) =>
              err.response?.data?.message || "Gagal menyimpan user",
          },
        );
      }

      setUserModal(null);
      setSelectedUser(null);
      setUserForm(initialUserForm);

      await fetchUsers();
    } catch (error) {
      console.error("Save user error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // STATUS
  // ==========================================================

  const toggleStatus = async (item) => {
    if (Number(item.id) === Number(currentUser?.id)) {
      toast.error("Akun yang sedang digunakan tidak dapat dinonaktifkan");

      return;
    }

    const newStatus = item.status === "active" ? "inactive" : "active";

    try {
      await api.patch(`/users/${item.id}/status`, {
        status: newStatus,
      });

      toast.success(
        newStatus === "active"
          ? "User berhasil diaktifkan"
          : "User berhasil dinonaktifkan",
      );

      await fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Gagal mengubah status user",
      );
    }
  };

  // ==========================================================
  // RESET PASSWORD
  // ==========================================================

  const submitResetPassword = async (event) => {
    event.preventDefault();

    if (resetForm.new_password.length < 8) {
      toast.error("Password minimal 8 karakter");

      return;
    }

    if (resetForm.new_password !== resetForm.confirm_password) {
      toast.error("Konfirmasi password tidak sama");

      return;
    }

    try {
      setSubmitting(true);

      await toastPromise(
        api.patch(`/users/${resetUser.id}/reset-password`, resetForm),
        {
          loading: "Mereset password...",
          success: "Password berhasil direset",
          error: (err) =>
            err.response?.data?.message || "Gagal mereset password",
        },
      );

      setResetUser(null);

      setResetForm({
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      console.error("Reset password error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setSubmitting(true);

      await toastPromise(api.delete(`/users/${deleteTarget.id}`), {
        loading: "Menghapus user...",
        success: "User berhasil dihapus",
        error: (err) => err.response?.data?.message || "Gagal menghapus user",
      });

      setDeleteTarget(null);

      await fetchUsers();
    } catch (error) {
      console.error("Delete user error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchUsers(true);
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
  };

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* SUMMARY */}
      {/* ==================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UserSummaryCard
          title="Total User"
          value={summary.total}
          icon={<Users size={22} />}
          className="bg-blue-100 text-blue-600"
        />

        <UserSummaryCard
          title="Admin"
          value={summary.admin}
          icon={<ShieldCheck size={22} />}
          className="bg-violet-100 text-violet-600"
        />

        <UserSummaryCard
          title="Karyawan"
          value={summary.employee}
          icon={<UserCheck size={22} />}
          className="bg-emerald-100 text-emerald-600"
        />

        <UserSummaryCard
          title="User Aktif"
          value={summary.active}
          icon={<UserCheck size={22} />}
          className="bg-amber-100 text-amber-600"
        />
      </section>

      {/* ==================================================== */}
      {/* FILTER */}
      {/* ==================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama atau email..."
                className="h-11 w-full rounded-xl border border-slate-300 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm"
            >
              <option value="">Semua Role</option>

              <option value="admin">Admin</option>

              <option value="karyawan">Karyawan</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm"
            >
              <option value="">Semua Status</option>

              <option value="active">Aktif</option>

              <option value="inactive">Nonaktif</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600"
            >
              Reset
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-200"
            >
              <UserPlus size={18} />
              Tambah User
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* TABLE */}
      {/* ==================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h3 className="font-bold text-slate-950">Daftar User</h3>

          <p className="mt-1 text-sm text-slate-500">
            {filteredUsers.length} user ditemukan.
          </p>
        </div>

        {loading ? (
          <UserSkeleton />
        ) : filteredUsers.length === 0 ? (
          <EmptyUsers />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="px-6 py-4">User</th>

                  <th className="px-6 py-4">Email</th>

                  <th className="px-6 py-4">Role</th>

                  <th className="px-6 py-4">Status</th>

                  <th className="px-6 py-4 text-center">Transaksi</th>

                  <th className="px-6 py-4">Dibuat</th>

                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((item) => {
                  const isSelf = Number(item.id) === Number(currentUser?.id);

                  return (
                    <tr key={item.id} className="text-sm">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                            {item.name?.charAt(0)?.toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.name}

                              {isSelf && (
                                <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                                  Akun Anda
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600">{item.email}</td>

                      <td className="px-6 py-4">
                        <RoleBadge role={item.role} />
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="px-6 py-4 text-center font-semibold">
                        {item.sales_count}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                        {formatDateTime(item.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <ActionButton
                            title="Edit"
                            className="bg-amber-50 text-amber-600"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil size={16} />
                          </ActionButton>

                          <ActionButton
                            title={
                              item.status === "active"
                                ? "Nonaktifkan"
                                : "Aktifkan"
                            }
                            disabled={isSelf}
                            className={
                              item.status === "active"
                                ? "bg-red-50 text-red-500"
                                : "bg-emerald-50 text-emerald-600"
                            }
                            onClick={() => toggleStatus(item)}
                          >
                            {item.status === "active" ? (
                              <UserX size={16} />
                            ) : (
                              <UserCheck size={16} />
                            )}
                          </ActionButton>

                          <ActionButton
                            title="Reset Password"
                            className="bg-blue-50 text-blue-600"
                            onClick={() => {
                              setResetUser(item);

                              setResetForm({
                                new_password: "",
                                confirm_password: "",
                              });
                            }}
                          >
                            <KeyRound size={16} />
                          </ActionButton>

                          <ActionButton
                            title="Hapus"
                            disabled={isSelf}
                            className="bg-red-50 text-red-600"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 size={16} />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {userModal && (
        <UserModal
          mode={userModal}
          form={userForm}
          currentUserId={currentUser?.id}
          selectedUser={selectedUser}
          submitting={submitting}
          onChange={handleUserChange}
          onClose={() => {
            if (!submitting) setUserModal(null);
          }}
          onSubmit={saveUser}
        />
      )}

      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          form={resetForm}
          submitting={submitting}
          onChange={(event) =>
            setResetForm((previous) => ({
              ...previous,

              [event.target.name]: event.target.value,
            }))
          }
          onClose={() => {
            if (!submitting) setResetUser(null);
          }}
          onSubmit={submitResetPassword}
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          submitting={submitting}
          onClose={() => {
            if (!submitting) setDeleteTarget(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

// ============================================================
// USER MODAL
// ============================================================

function UserModal({
  mode,
  form,
  selectedUser,
  currentUserId,
  submitting,
  onChange,
  onClose,
  onSubmit,
}) {
  const isCreate = mode === "create";

  const isSelf = Number(selectedUser?.id) === Number(currentUserId);

  return (
    <ModalWrapper onClose={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <ModalHeader
          title={isCreate ? "Tambah User" : "Edit User"}
          subtitle={
            isCreate
              ? "Buat akun Admin atau Karyawan."
              : "Perbarui informasi user."
          }
          onClose={onClose}
        />

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <FormField label="Nama Lengkap">
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              className="form-input"
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              className="form-input"
            />
          </FormField>

          {isCreate && (
            <>
              <FormField label="Password">
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  className="form-input"
                />
              </FormField>

              <FormField label="Konfirmasi Password">
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={onChange}
                  className="form-input"
                />
              </FormField>
            </>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Role">
              <select
                name="role"
                value={form.role}
                onChange={onChange}
                disabled={isSelf}
                className="form-input disabled:bg-slate-100"
              >
                <option value="karyawan">Karyawan</option>

                <option value="admin">Admin</option>
              </select>
            </FormField>

            <FormField label="Status">
              <select
                name="status"
                value={form.status}
                onChange={onChange}
                disabled={isSelf}
                className="form-input disabled:bg-slate-100"
              >
                <option value="active">Aktif</option>

                <option value="inactive">Nonaktif</option>
              </select>
            </FormField>
          </div>

          {isSelf && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
              Role dan status akun yang sedang digunakan tidak dapat diubah
              untuk mencegah Anda kehilangan akses Admin.
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting
                ? "Menyimpan..."
                : isCreate
                  ? "Tambah User"
                  : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
}

// ============================================================
// RESET PASSWORD
// ============================================================

function ResetPasswordModal({
  user,
  form,
  submitting,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <ModalWrapper onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <ModalHeader
          title="Reset Password"
          subtitle={user.name}
          onClose={onClose}
        />

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <FormField label="Password Baru">
            <input
              type="password"
              name="new_password"
              value={form.new_password}
              onChange={onChange}
              className="form-input"
            />
          </FormField>

          <FormField label="Konfirmasi Password">
            <input
              type="password"
              name="confirm_password"
              value={form.confirm_password}
              onChange={onChange}
              className="form-input"
            />
          </FormField>

          <p className="text-xs text-slate-400">Password minimal 8 karakter.</p>

          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Memproses..." : "Reset Password"}
          </button>
        </form>
      </div>
    </ModalWrapper>
  );
}

// ============================================================
// DELETE MODAL
// ============================================================

function DeleteUserModal({ user, submitting, onClose, onConfirm }) {
  return (
    <ModalWrapper onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <Trash2 size={25} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-900">Hapus User?</h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          User <strong>{user.name}</strong> akan dihapus permanen.
        </p>

        <p className="mt-2 text-xs text-slate-400">
          Jika user sudah memiliki transaksi, sistem akan menolak penghapusan
          dan menyarankan menonaktifkan akun.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold text-slate-600"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 rounded-xl bg-red-600 py-3 font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

function UserSummaryCard({ title, value, icon, className }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${className}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm text-slate-500">{title}</p>

        <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        role === "admin"
          ? "bg-violet-100 text-violet-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      {role === "admin" ? "Admin" : "Karyawan"}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        status === "active"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {status === "active" ? "Aktif" : "Nonaktif"}
    </span>
  );
}

function ActionButton({ children, title, className, onClick, disabled }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
    >
      {children}
    </button>
  );
}

function ModalWrapper({ children, onClose }) {
  return (
    <ModalPortal onClose={onClose}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        />

        <div className="modal-wrapper relative z-10 flex w-full justify-center">
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
      <div>
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>

        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
      >
        <X size={21} />
      </button>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function EmptyUsers() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center">
      <Users size={40} className="text-slate-300" />

      <p className="mt-4 text-sm text-slate-400">User tidak ditemukan.</p>
    </div>
  );
}

function UserSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-6">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-16 rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

export default AdminUsers;
