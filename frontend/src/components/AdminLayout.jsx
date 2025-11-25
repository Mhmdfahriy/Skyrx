import SidebarAdmin from "./SidebarAdmin";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <SidebarAdmin />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}