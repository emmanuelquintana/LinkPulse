"use client";

import React, { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { localizeApiError } from "@/lib/api-errors";
import { useTranslation } from "@/i18n/I18nProvider";
import { sileo } from "sileo";
import { useConfirm } from "@/components/ConfirmProvider";

type PermissionKey =
  | "canManageLinks"
  | "canManageEmails"
  | "canViewAnalytics"
  | "canManageMembers"
  | "canManageBilling";

interface MemberProfile {
  id?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

interface Member {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  canManageLinks: boolean;
  canManageEmails: boolean;
  canViewAnalytics: boolean;
  canManageMembers: boolean;
  canManageBilling: boolean;
  user?: MemberProfile;
}

interface Invitation {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  status: string;
  createdAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string | null;
  onChanged?: () => void;
}

const PERMISSION_KEYS: PermissionKey[] = [
  "canManageLinks",
  "canManageEmails",
  "canViewAnalytics",
  "canManageMembers",
  "canManageBilling",
];

type PermissionSet = Record<PermissionKey, boolean>;

// Debe coincidir con defaultPermissionsForRole() del backend.
const DEFAULT_PERMISSIONS_BY_ROLE: Record<"ADMIN" | "MEMBER", PermissionSet> = {
  ADMIN: {
    canManageLinks: true,
    canManageEmails: true,
    canViewAnalytics: true,
    canManageMembers: true,
    canManageBilling: true,
  },
  MEMBER: {
    canManageLinks: true,
    canManageEmails: false,
    canViewAnalytics: true,
    canManageMembers: false,
    canManageBilling: false,
  },
};

export default function WorkspaceMembersModal({
  isOpen,
  onClose,
  workspaceId,
  onChanged,
}: Props) {
  const t = useTranslation();
  const confirm = useConfirm();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [invitePermissions, setInvitePermissions] = useState<PermissionSet>(
    DEFAULT_PERMISSIONS_BY_ROLE.MEMBER,
  );
  const [inviting, setInviting] = useState(false);

  // Al cambiar el rol, reinicia los permisos a los defaults de ese rol.
  const handleInviteRoleChange = (role: "ADMIN" | "MEMBER") => {
    setInviteRole(role);
    setInvitePermissions({ ...DEFAULT_PERMISSIONS_BY_ROLE[role] });
  };

  const roleDescription = (role: "ADMIN" | "MEMBER") =>
    role === "ADMIN" ? t.workspaces.roleAdminDesc : t.workspaces.roleMemberDesc;

  const permissionLabels: Record<PermissionKey, string> = {
    canManageLinks: t.workspaces.permLinks,
    canManageEmails: t.workspaces.permEmails,
    canViewAnalytics: t.workspaces.permAnalytics,
    canManageMembers: t.workspaces.permMembers,
    canManageBilling: t.workspaces.permBilling,
  };

  const roleLabel = (role: Member["role"]) =>
    role === "OWNER"
      ? t.workspaces.roleOwner
      : role === "ADMIN"
        ? t.workspaces.roleAdmin
        : t.workspaces.roleMember;

  const loadMembers = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetchApi(`/workspaces/${workspaceId}`);
      const data = res?.data ?? res;
      setMembers(Array.isArray(data?.members) ? data.members : []);
      setInvitations(Array.isArray(data?.invitations) ? data.invitations : []);
    } catch (err) {
      sileo.error({
        title: t.workspaces.memberError,
        description: localizeApiError(err, t),
      });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, t]);

  useEffect(() => {
    if (isOpen && workspaceId) {
      loadMembers();
      setInviteEmail("");
      setInviteRole("MEMBER");
      setInvitePermissions({ ...DEFAULT_PERMISSIONS_BY_ROLE.MEMBER });
    }
  }, [isOpen, workspaceId, loadMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetchApi(`/workspaces/${workspaceId}/members`, {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          permissions: invitePermissions,
        }),
      });
      const status = (res?.data ?? res)?.status;
      if (status === "invited") {
        sileo.success({
          title: t.workspaces.invitationSent,
          description: t.workspaces.invitationSentText,
        });
      } else {
        sileo.success({ title: t.workspaces.memberAdded });
      }
      setInviteEmail("");
      setInviteRole("MEMBER");
      setInvitePermissions({ ...DEFAULT_PERMISSIONS_BY_ROLE.MEMBER });
      await loadMembers();
      onChanged?.();
    } catch (err) {
      sileo.error({
        title: t.workspaces.memberError,
        description: localizeApiError(err, t),
      });
    } finally {
      setInviting(false);
    }
  };

  const updateLocalMember = (id: string, patch: Partial<Member>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  };

  const handleSaveMember = async (member: Member) => {
    if (!workspaceId) return;
    setSavingId(member.id);
    try {
      const permissions = PERMISSION_KEYS.reduce<Record<string, boolean>>(
        (acc, key) => {
          acc[key] = member[key];
          return acc;
        },
        {},
      );
      await fetchApi(`/workspaces/${workspaceId}/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: member.role, permissions }),
      });
      sileo.success({ title: t.workspaces.memberUpdated });
      onChanged?.();
    } catch (err) {
      sileo.error({
        title: t.workspaces.memberError,
        description: localizeApiError(err, t),
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleRemoveMember = async (member: Member) => {
    if (!workspaceId) return;
    const ok = await confirm({
      title: t.workspaces.removeMember,
      description: t.workspaces.removeMemberConfirm,
      confirmLabel: t.workspaces.removeMember,
      variant: "danger",
    });
    if (!ok) return;
    try {
      await fetchApi(`/workspaces/${workspaceId}/members/${member.id}`, {
        method: "DELETE",
      });
      sileo.success({ title: t.workspaces.memberRemoved });
      await loadMembers();
      onChanged?.();
    } catch (err) {
      sileo.error({
        title: t.workspaces.memberError,
        description: localizeApiError(err, t),
      });
    }
  };

  const handleRevokeInvitation = async (inv: Invitation) => {
    if (!workspaceId) return;
    const ok = await confirm({
      title: t.workspaces.revoke,
      description: t.workspaces.revokeConfirm,
      confirmLabel: t.workspaces.revoke,
      variant: "danger",
    });
    if (!ok) return;
    try {
      await fetchApi(`/workspaces/${workspaceId}/invitations/${inv.id}`, {
        method: "DELETE",
      });
      sileo.success({ title: t.workspaces.invitationRevoked });
      await loadMembers();
      onChanged?.();
    } catch (err) {
      sileo.error({
        title: t.workspaces.memberError,
        description: localizeApiError(err, t),
      });
    }
  };

  if (!isOpen) return null;

  const displayName = (m: Member) => {
    const name = [m.user?.firstName, m.user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return name || m.user?.email || m.userId;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-gray-200 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">
            {t.workspaces.membersTitle}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* Invite form */}
          <form
            onSubmit={handleInvite}
            className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4"
          >
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {t.workspaces.inviteMember}
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder={t.workspaces.memberEmailPlaceholder}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <select
                value={inviteRole}
                onChange={(e) =>
                  handleInviteRoleChange(e.target.value as "ADMIN" | "MEMBER")
                }
                className="h-11 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="MEMBER">{t.workspaces.roleMember}</option>
                <option value="ADMIN">{t.workspaces.roleAdmin}</option>
              </select>
            </div>

            {/* Qué significa el rol seleccionado */}
            <div className="flex items-start gap-2 text-xs font-medium text-gray-500 bg-white border border-gray-100 rounded-xl px-3 py-2.5">
              <span className="material-symbols-outlined text-[16px] text-indigo-400 mt-px">
                info
              </span>
              <span>{roleDescription(inviteRole)}</span>
            </div>

            {/* Permisos personalizables antes de invitar */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                {t.workspaces.customizePermissions}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PERMISSION_KEYS.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-white border border-gray-100 rounded-lg px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={invitePermissions[key]}
                      onChange={(e) =>
                        setInvitePermissions((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded accent-indigo-600"
                    />
                    {permissionLabels[key]}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="h-11 w-full px-6 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
            >
              {inviting ? t.workspaces.inviting : t.workspaces.invite}
            </button>
          </form>

          {/* Members list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-gray-50 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((m) => {
                const isOwner = m.role === "OWNER";
                return (
                  <div
                    key={m.id}
                    className="border border-gray-100 rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black overflow-hidden shrink-0">
                          {m.user?.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.user.avatarUrl}
                              alt={displayName(m)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            displayName(m).charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 truncate">
                            {displayName(m)}
                          </p>
                          <p className="text-xs font-medium text-gray-400 truncate">
                            {m.user?.email}
                          </p>
                        </div>
                      </div>
                      {isOwner ? (
                        <span className="text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-indigo-600 text-white shrink-0">
                          {roleLabel(m.role)}
                        </span>
                      ) : (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            updateLocalMember(m.id, {
                              role: e.target.value as "ADMIN" | "MEMBER",
                            })
                          }
                          className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="MEMBER">{t.workspaces.roleMember}</option>
                          <option value="ADMIN">{t.workspaces.roleAdmin}</option>
                        </select>
                      )}
                    </div>

                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      {t.workspaces.permissions}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PERMISSION_KEYS.map((key) => (
                        <label
                          key={key}
                          className={`flex items-center gap-2 text-xs font-bold rounded-lg px-3 py-2 transition-colors ${
                            isOwner
                              ? "text-gray-300 bg-gray-50 cursor-not-allowed"
                              : "text-gray-600 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={isOwner}
                            checked={isOwner ? true : m[key]}
                            onChange={(e) =>
                              updateLocalMember(m.id, { [key]: e.target.checked })
                            }
                            className="h-4 w-4 rounded accent-indigo-600"
                          />
                          {permissionLabels[key]}
                        </label>
                      ))}
                    </div>

                    {!isOwner && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleSaveMember(m)}
                          disabled={savingId === m.id}
                          className="h-9 px-5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                          {savingId === m.id
                            ? t.common.saving
                            : t.workspaces.saveMember}
                        </button>
                        <button
                          onClick={() => handleRemoveMember(m)}
                          className="h-9 px-5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
                        >
                          {t.workspaces.removeMember}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {members.filter((m) => m.role !== "OWNER").length === 0 && (
                <p className="text-center text-sm font-medium text-gray-400 py-6">
                  {t.workspaces.noMembers}
                </p>
              )}
            </div>
          )}

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {t.workspaces.pendingInvitations}
              </p>
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 border border-dashed border-amber-200 bg-amber-50/50 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">
                        mail
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {inv.email}
                      </p>
                      <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">
                        {t.workspaces.pending} ·{" "}
                        {inv.role === "ADMIN"
                          ? t.workspaces.roleAdmin
                          : t.workspaces.roleMember}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeInvitation(inv)}
                    className="h-9 px-4 bg-white border border-amber-200 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100 transition-all shrink-0"
                  >
                    {t.workspaces.revoke}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
