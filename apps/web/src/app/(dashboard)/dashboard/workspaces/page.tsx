"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import EditWorkspaceModal from "@/components/EditWorkspaceModal";

interface WorkspaceMember {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER" | "OWNER";
}

interface Workspace {
  id: string;
  name: string;
  ownerId?: string; // Backwards compatibility
  ownerUserId?: string;
  _count?: {
    members: number;
    links: number;
  };
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actions State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null,
  );
  const [showEditModal, setShowEditModal] = useState(false);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/workspaces");
      if (data && Array.isArray(data.items)) setWorkspaces(data.items);
      else if (Array.isArray(data)) setWorkspaces(data);
      else if (data && data.data && Array.isArray(data.data))
        setWorkspaces(data.data);
    } catch (err) {
      console.error("Failed to load workspaces", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      await fetchApi("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: newWorkspaceName }),
      });
      window.dispatchEvent(new Event("notifications-updated"));
      setNewWorkspaceName("");
      setShowCreateModal(false);
      loadWorkspaces();
    } catch (err: any) {
      setError(err.message || "Error creating workspace");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (ws: Workspace) => {
    setEditingWorkspace(ws);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (wsId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this workspace? All associated links and data will be permanently removed.",
      )
    )
      return;

    try {
      await fetchApi(`/workspaces/${wsId}`, { method: "DELETE" });
      loadWorkspaces();
    } catch (err: any) {
      console.error("Failed to delete workspace", err);
      alert(err.message || "Error deleting workspace");
    }
    setOpenMenuId(null);
  };

  return (
    <>
      <div className="max-w-[1400px] mx-auto font-sans animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Workspaces
            </h2>
            <p className="text-gray-500 font-medium mt-1">
              Manage your teams and collaboration environments.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Workspace
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 hover:border-indigo-200 transition-all group relative"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === ws.id ? null : ws.id);
                      }}
                      className={`p-2 rounded-xl transition-all ${openMenuId === ws.id ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}
                    >
                      <span className="material-symbols-outlined text-[24px]">
                        more_horiz
                      </span>
                    </button>

                    {openMenuId === ws.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-12 w-44 bg-white rounded-2xl shadow-2xl border border-gray-100 p-1.5 z-20 animate-in zoom-in-95 duration-150 origin-top-right">
                          <button
                            onClick={() => handleEdit(ws)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                            Edit Details
                          </button>
                          <div className="h-px bg-gray-50 my-1 mx-2" />
                          <button
                            onClick={() => handleDelete(ws.id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-black text-gray-900 truncate pr-6 mb-1">
                  {ws.name}
                </h3>
                <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-[0.1em]">
                  Free Workspace
                </p>

                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Members
                    </span>
                    <span className="text-2xl font-black text-gray-900">
                      {ws._count?.members || 1}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Links
                    </span>
                    <span className="text-2xl font-black text-gray-900">
                      {ws._count?.links || 0}
                    </span>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <Link
                    href={`/dashboard/links?workspace=${ws.id}`}
                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 group/btn bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                  >
                    View Links
                    <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </Link>
                  <div className="flex -space-x-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 ring-1 ring-gray-100"
                      >
                        U{i}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {workspaces.length === 0 && !loading && (
              <div className="col-span-full py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl text-gray-300">
                    group_work
                  </span>
                </div>
                <h3 className="text-2xl font-black text-gray-900">
                  No workspaces yet
                </h3>
                <p className="text-gray-500 max-w-xs mt-2 font-medium">
                  Workspaces allow you to organize your links and collaborate
                  with your team.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  Create your first workspace
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Workspace Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-gray-200 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                  Create Workspace
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    close
                  </span>
                </button>
              </div>

              <form onSubmit={handleCreateWorkspace} className="p-7 space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100">
                    <span className="material-symbols-outlined text-[20px]">
                      error
                    </span>
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[0.7rem] font-black text-gray-400 uppercase tracking-widest block px-1">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marketing Team, Personal Projects"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-gray-900"
                    autoFocus
                  />
                </div>

                <div className="pt-6 flex gap-3 border-t border-gray-100 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 h-12 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newWorkspaceName.trim()}
                    className="flex-1 h-12 px-4 bg-indigo-600 border border-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 hover:border-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    {creating ? "Creating..." : "Create Workspace"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <EditWorkspaceModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingWorkspace(null);
          }}
          workspace={editingWorkspace}
          onSuccess={loadWorkspaces}
        />
      </div>
    </>
  );
}
