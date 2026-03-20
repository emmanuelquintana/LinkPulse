"use client";

import { useState } from "react";
import { Link as LinkIcon, X, Calendar, ChevronDown } from "lucide-react";

export default function CreateLinkModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [tags, setTags] = useState("");
  const [passwordProtection, setPasswordProtection] = useState(false);
  const [privateStats, setPrivateStats] = useState(true);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
      >
        <LinkIcon className="mr-2 h-4 w-4" /> Create New Link
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] bg-white shadow-2xl duration-200 sm:rounded-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col space-y-1 p-6 border-b border-slate-100 relative">
          <button onClick={() => setIsOpen(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-900">Create New Link</h2>
          <p className="text-sm text-slate-500">Shorten your URL and track its performance.</p>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-semibold text-slate-900">
              Destination URL <span className="text-red-500">*</span>
            </label>
            <input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/very-long-url-that-needs-shortening"
              className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <label htmlFor="alias" className="text-sm font-semibold text-slate-900">
                Custom Alias (Optional)
              </label>
              <div className="flex items-center">
                <span className="flex items-center h-11 px-3 border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm rounded-l-lg shrink-0">lp.co/</span>
                <input
                  id="alias"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="my-campaign"
                  className="flex h-11 w-full rounded-r-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 text-slate-900"
                />
              </div>
            </div>
            <div className="space-y-2 relative">
              <label className="text-sm font-semibold text-slate-900">
                Campaign
              </label>
              <div className="relative">
                <select className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 appearance-none">
                  <option>Select a campaign</option>
                  <option>Q3 Launch</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-semibold text-slate-900">
              Tags
            </label>
            <input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add tags separated by comma (e.g., promo, email, facebook)"
              className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 text-slate-900"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="expiration" className="text-sm font-semibold text-slate-900">
              Expiration Date (Optional)
            </label>
            <div className="relative">
              <input
                id="expiration"
                type="text"
                placeholder="mm/dd/yyyy"
                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 text-slate-900"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                   <h4 className="text-sm font-semibold text-slate-900">Password Protection</h4>
                   <p className="text-xs text-slate-500">Require a password to access the destination URL.</p>
                </div>
                <button 
                  onClick={() => setPasswordProtection(!passwordProtection)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${passwordProtection ? 'bg-primary' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${passwordProtection ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
             </div>
             
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                   <h4 className="text-sm font-semibold text-slate-900">Private Stats</h4>
                   <p className="text-xs text-slate-500">Hide click analytics from public view.</p>
                </div>
                <button 
                  onClick={() => setPrivateStats(!privateStats)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${privateStats ? 'bg-primary' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privateStats ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button 
             onClick={() => setIsOpen(false)}
             className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none"
           >
            Cancel
          </button>
          <button className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none">
            <LinkIcon className="mr-2 h-4 w-4" /> Create Link
          </button>
        </div>
      </div>
    </>
  );
}
