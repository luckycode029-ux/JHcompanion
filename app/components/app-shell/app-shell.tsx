import { Outlet } from "react-router";
import { Sidebar } from "~/components/sidebar/sidebar";
import { BottomNav } from "~/components/bottom-nav/bottom-nav";
import styles from "./app-shell.module.css";

export function AppShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
