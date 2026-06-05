import Link from "next/link";
import { Header } from "@/app/(dashboard)/Header";
import { UserProfile } from "@/app/(dashboard)/UserProfile";
import { SidebarNav } from "@/app/(dashboard)/SidebarNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar (Adapted from AI Studio layout structure) */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col justify-between shrink-0 h-full">
        <div>
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 gap-2">
            <div className="text-indigo-600">
              <span className="material-symbols-outlined font-bold">link</span>
            </div>
            <span className="font-bold text-xl text-indigo-600 tracking-tight">
              LinkPulse
            </span>
          </div>

          {/* Navigation Links */}
          <SidebarNav />
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
        <div className="flex-1 p-8 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
