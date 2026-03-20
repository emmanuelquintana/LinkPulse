"use client";

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';

interface Workspace {
  id: string;
  name: string;
}

interface EditWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  onSuccess: () => void;
}

export default function EditWorkspaceModal({ isOpen, onClose, workspace, onSuccess }: EditWorkspaceModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
    }
  }, [workspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await fetchApi(`/workspaces/${workspace.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error updating workspace');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-gray-200 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Edit Workspace</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-1 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 block">Workspace Name</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Marketing Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-medium"
              autoFocus
            />
          </div>

          <div className="pt-6 flex gap-3 border-t border-gray-100 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 h-11 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !name.trim() || name === workspace?.name}
              className="flex-1 h-11 px-4 bg-indigo-600 border border-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 hover:border-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
