'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Spinner } from '../../../components/Spinner'
import { useAuth } from '../../../context/AuthContext'
import { adminApi } from '../../../lib/adminApi'
import type { UserSummary } from '../../../types'
import { UserTabBar, type Message, type UserTab } from '../../../components/admin/ui'
import { ConfirmRoleModal, ConfirmDeleteModal, ConfirmRestoreModal, PermanentDeleteModal } from '../../../components/admin/modals'

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [userPage, setUserPage] = useState(1)
  const [userTotalPages, setUserTotalPages] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  const [userSearchInput, setUserSearchInput] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [roleModal, setRoleModal] = useState<{ open: boolean; user: UserSummary | null }>({ open: false, user: null })
  const [roleLoading, setRoleLoading] = useState(false)

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: UserSummary | null }>({ open: false, user: null })
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [userTab, setUserTab] = useState<UserTab>('all')
  const [deletedUsers, setDeletedUsers] = useState<UserSummary[]>([])
  const [deletedUserPage, setDeletedUserPage] = useState(1)
  const [deletedUserTotalPages, setDeletedUserTotalPages] = useState(1)
  const [deletedUserSearch, setDeletedUserSearch] = useState('')
  const [deletedUserSearchInput, setDeletedUserSearchInput] = useState('')
  const deletedSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [restoreModal, setRestoreModal] = useState<{ open: boolean; user: UserSummary | null }>({ open: false, user: null })
  const [restoreLoading, setRestoreLoading] = useState(false)

  const [permUserModal, setPermUserModal] = useState<{ open: boolean; user: UserSummary | null }>({ open: false, user: null })
  const [permUserLoading, setPermUserLoading] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<Message>(null)

  const fetchUsers = useCallback(async (search: string, page: number) => {
    const { data } = await adminApi.getUsers(search || undefined, page)
    if (data) {
      setUsers(data.users)
      setUserTotalPages(data.totalPages)
    }
  }, [])

  const fetchDeletedUsers = useCallback(async (search: string, page: number) => {
    const { data } = await adminApi.getDeletedUsers(search || undefined, page)
    if (data) {
      setDeletedUsers(data.users)
      setDeletedUserTotalPages(data.totalPages)
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchUsers(userSearch, userPage), fetchDeletedUsers(deletedUserSearch, deletedUserPage)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users')
    } finally {
      setLoading(false)
    }
  }, [fetchUsers, fetchDeletedUsers, userSearch, userPage, deletedUserSearch, deletedUserPage])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    void fetchUsers(userSearch, userPage)
  }, [userSearch, userPage, fetchUsers])

  useEffect(() => {
    void fetchDeletedUsers(deletedUserSearch, deletedUserPage)
  }, [deletedUserSearch, deletedUserPage, fetchDeletedUsers])

  function handleUserSearchInput(value: string) {
    setUserSearchInput(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setUserSearch(value)
      setUserPage(1)
    }, 400)
  }

  function handleDeletedUserSearchInput(value: string) {
    setDeletedUserSearchInput(value)
    if (deletedSearchTimerRef.current) clearTimeout(deletedSearchTimerRef.current)
    deletedSearchTimerRef.current = setTimeout(() => {
      setDeletedUserSearch(value)
      setDeletedUserPage(1)
    }, 400)
  }

  async function handleRoleChange() {
    if (!roleModal.user || roleLoading) return
    setRoleLoading(true)
    setMessage(null)
    try {
      const newRole = roleModal.user.role === 'ADMIN' ? 'USER' : 'ADMIN'
      await adminApi.updateUserRole(roleModal.user.id, newRole)
      setMessage({ type: 'success', text: `User role updated to ${newRole}` })
      setRoleModal({ open: false, user: null })
      await fetchUsers(userSearch, userPage)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' })
    } finally {
      setRoleLoading(false)
    }
  }

  async function handleDeleteUser() {
    if (!deleteModal.user || deleteLoading) return
    setDeleteLoading(true)
    setMessage(null)
    try {
      await adminApi.deleteUser(deleteModal.user.id)
      setMessage({ type: 'success', text: 'User deleted successfully' })
      setDeleteModal({ open: false, user: null })
      await fetchUsers(userSearch, userPage)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleRestoreUser() {
    if (!restoreModal.user || restoreLoading) return
    setRestoreLoading(true)
    setMessage(null)
    try {
      await adminApi.restoreUser(restoreModal.user.id)
      setMessage({ type: 'success', text: 'User restored successfully' })
      setRestoreModal({ open: false, user: null })
      await fetchDeletedUsers(deletedUserSearch, deletedUserPage)
      await fetchUsers(userSearch, userPage)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Restore failed' })
    } finally {
      setRestoreLoading(false)
    }
  }

  async function handlePermanentDeleteUser() {
    if (!permUserModal.user || permUserLoading) return
    setPermUserLoading(true)
    setMessage(null)
    try {
      await adminApi.permanentDeleteUser(permUserModal.user.id, `${permUserModal.user.firstName} ${permUserModal.user.lastName}`)
      setMessage({ type: 'success', text: 'User permanently deleted' })
      setPermUserModal({ open: false, user: null })
      await fetchDeletedUsers(deletedUserSearch, deletedUserPage)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    } finally {
      setPermUserLoading(false)
    }
  }

  const activeSearchInput = userTab === 'deleted' ? deletedUserSearchInput : userSearchInput

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-paper-dim">Users</h1>
          <p className="mt-2 text-paper-dim/55">Manage user accounts, roles, and deleted users.</p>
        </div>
        <UserTabBar active={userTab} onChange={setUserTab} />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="text"
          value={activeSearchInput}
          onChange={(e) => (userTab === 'deleted' ? handleDeletedUserSearchInput(e.target.value) : handleUserSearchInput(e.target.value))}
          placeholder="Search by name or email…"
          className="w-56 rounded-lg border border-paper-dim bg-white px-3 py-1.5 text-xs text-ink placeholder:text-ink/35 outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/30"
        />
      </div>

      {message && (
        <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${message.type === 'success' ? 'border-teal/30 bg-teal/10 text-teal' : 'border-red-300 bg-red-50 text-red-700'}`}>{message.text}</div>
      )}

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void loadAll()} className="shrink-0 font-semibold underline underline-offset-2">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 py-16 text-paper-dim/55">
          <Spinner size={24} />
          <span className="text-sm">Loading users…</span>
        </div>
      ) : (
        <section className="relative rounded-2xl border border-paper-dim bg-paper px-6.5 py-6">
          <span className="absolute -top-2.5 right-8 h-5 w-5 rounded-full bg-ink" aria-hidden="true" />
          {userTab === 'deleted' ? (
            deletedUsers.length === 0 ? (
              <p className="text-sm text-ink/45">No deleted users found.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-paper-dim text-xs text-ink/45">
                        <th className="pb-2 pr-4 font-semibold">Name</th>
                        <th className="pb-2 pr-4 font-semibold">Email</th>
                        <th className="pb-2 pr-4 font-semibold">Role</th>
                        <th className="pb-2 pr-4 font-semibold">Provider</th>
                        <th className="pb-2 font-semibold">Joined</th>
                        <th className="pb-2 pl-4 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deletedUsers.map((u) => (
                        <tr key={u.id} className="border-b border-paper-dim/50 last:border-0">
                          <td className="py-2.5 pr-4 font-semibold text-ink">{u.firstName} {u.lastName}</td>
                          <td className="py-2.5 pr-4 text-ink/60">{u.email}</td>
                          <td className="py-2.5 pr-4">
                            <span className="inline-block rounded-full bg-ink-soft px-2.5 py-0.5 text-xs font-semibold text-ink/70">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-ink/50">{u.provider}</td>
                          <td className="py-2.5 text-ink/45">{new Date(u.createdAt).toLocaleDateString()}</td>
                          {u.role === 'ADMIN' ? (
                            <td className="py-2.5 pl-4 text-right text-xs text-ink/30">Cannot restore admin</td>
                          ) : (
                            <td className="py-2.5 pl-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setRestoreModal({ open: true, user: u })}
                                  className="rounded-lg border border-teal/40 px-3 py-1 text-xs font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Restore
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPermUserModal({ open: true, user: u })}
                                  className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Delete permanently
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {deletedUserTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={deletedUserPage <= 1}
                      onClick={() => setDeletedUserPage((p) => p - 1)}
                      className="rounded-lg border border-paper-dim px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-paper-dim/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs text-ink/45">Page {deletedUserPage} of {deletedUserTotalPages}</span>
                    <button
                      type="button"
                      disabled={deletedUserPage >= deletedUserTotalPages}
                      onClick={() => setDeletedUserPage((p) => p + 1)}
                      className="rounded-lg border border-paper-dim px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-paper-dim/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )
          ) : (
            users.length === 0 ? (
              <p className="text-sm text-ink/45">No users found.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-paper-dim text-xs text-ink/45">
                        <th className="pb-2 pr-4 font-semibold">Name</th>
                        <th className="pb-2 pr-4 font-semibold">Email</th>
                        <th className="pb-2 pr-4 font-semibold">Role</th>
                        <th className="pb-2 pr-4 font-semibold">Provider</th>
                        <th className="pb-2 font-semibold">Joined</th>
                        <th className="pb-2 pl-4 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const isSelf = u.id === currentUser?.id
                        return (
                          <tr key={u.id} className="border-b border-paper-dim/50 last:border-0">
                            <td className="py-2.5 pr-4 font-semibold text-ink">{u.firstName} {u.lastName}</td>
                            <td className="py-2.5 pr-4 text-ink/60">{u.email}</td>
                            <td className="py-2.5 pr-4">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-amber/20 text-amber-deep' : 'bg-ink-soft text-ink/70'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-ink/50">{u.provider}</td>
                            <td className="py-2.5 text-ink/45">{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td className="py-2.5 pl-4 text-right">
                              {isSelf ? (
                                <span className="text-xs text-ink/30">You</span>
                              ) : u.role === 'ADMIN' ? (
                                <button
                                  type="button"
                                  onClick={() => setRoleModal({ open: true, user: u })}
                                  className="rounded-lg border border-paper-dim px-3 py-1 text-xs font-semibold text-ink transition hover:bg-paper-dim/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Remove Admin
                                </button>
                              ) : (
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setRoleModal({ open: true, user: u })}
                                    className="rounded-lg border border-paper-dim px-3 py-1 text-xs font-semibold text-ink transition hover:bg-paper-dim/10 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Make Admin
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteModal({ open: true, user: u })}
                                    className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {userTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={userPage <= 1}
                      onClick={() => setUserPage((p) => p - 1)}
                      className="rounded-lg border border-paper-dim px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-paper-dim/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs text-ink/45">Page {userPage} of {userTotalPages}</span>
                    <button
                      type="button"
                      disabled={userPage >= userTotalPages}
                      onClick={() => setUserPage((p) => p + 1)}
                      className="rounded-lg border border-paper-dim px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-paper-dim/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )
          )}
        </section>
      )}

      <ConfirmRoleModal open={roleModal.open} user={roleModal.user} onConfirm={handleRoleChange} onCancel={() => setRoleModal({ open: false, user: null })} loading={roleLoading} />
      <ConfirmDeleteModal open={deleteModal.open} user={deleteModal.user} onConfirm={handleDeleteUser} onCancel={() => setDeleteModal({ open: false, user: null })} loading={deleteLoading} />
      <ConfirmRestoreModal open={restoreModal.open} user={restoreModal.user} onConfirm={handleRestoreUser} onCancel={() => setRestoreModal({ open: false, user: null })} loading={restoreLoading} />
      <PermanentDeleteModal
        open={permUserModal.open}
        title="Permanently delete user"
        subject={permUserModal.user ? `${permUserModal.user.firstName} ${permUserModal.user.lastName}` : ''}
        confirmName={permUserModal.user ? `${permUserModal.user.firstName} ${permUserModal.user.lastName}` : ''}
        loading={permUserLoading}
        onConfirm={handlePermanentDeleteUser}
        onCancel={() => setPermUserModal({ open: false, user: null })}
      />
    </div>
  )
}