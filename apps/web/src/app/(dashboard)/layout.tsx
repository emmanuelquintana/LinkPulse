import Link from "next/link";
import { Header } from "@/app/(dashboard)/Header";
import { UserProfile } from "@/app/(dashboard)/UserProfile";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar (Adapted from AI Studio layout structure) */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col justify-between shrink-0 h-full">
        <div>
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 gap-2">
            <div className="text-indigo-600">
              <span className="material-symbols-outlined font-bold">link</span>
            </div>
            <span className="font-bold text-xl text-indigo-600 tracking-tight">LinkPulse</span>
          </div>
          
          {/* Navigation Links */}
          <div className="px-4 mt-2">
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
            <nav className="space-y-1">
              <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors">
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                Dashboard
              </Link>
              <Link href="/dashboard/workspaces" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <span className="material-symbols-outlined text-[20px]">group_work</span>
                Workspaces
              </Link>
              <Link href="/dashboard/links" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <span className="material-symbols-outlined text-[20px]">link</span>
                Links
              </Link>
              <Link href="/dashboard/campaigns" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <span className="material-symbols-outlined text-[20px]">campaign</span>
                Campaigns
              </Link>
              <Link href="/dashboard/api" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <span className="material-symbols-outlined text-[20px]">api</span>
                API & Webhooks
              </Link>
              <Link href="/dashboard/billing" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <span className="material-symbols-outlined text-[20px]">payments</span>
                Billing
              </Link>
            </nav>
          </div>
        </div>

        <UserProfile />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header 
          title="Dashboard" 
          actions={
            <Link 
              href="/dashboard/links/create"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-block"
            >
              + Create Link
            </Link>
          } 
        />
        <div className="flex-1 p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
