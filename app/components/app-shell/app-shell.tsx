import { Outlet } from "react-router";
import { Sidebar } from "~/components/sidebar/sidebar";
import { BottomNav } from "~/components/bottom-nav/bottom-nav";
import { AdminProvider } from "~/utils/admin-context";
import styles from "./app-shell.module.css";

export function AppShell({ isAdmin }: { isAdmin: boolean }) {
  return (
    <AdminProvider isAdmin={isAdmin}>
      <div className={styles.shell}>
        <Sidebar />
        <main className={styles.main}>
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </AdminProvider>
  );
}
