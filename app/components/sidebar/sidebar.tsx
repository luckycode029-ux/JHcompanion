import { NavLink } from "react-router";
import { Home, Bookmark, Search, BookOpen, Sun, Moon } from "lucide-react";
import { useColorScheme } from "@dazl/color-scheme/react";
import styles from "./sidebar.module.css";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
];

export function Sidebar() {
  const { setColorScheme, resolvedScheme } = useColorScheme();
  const toggle = () => setColorScheme(resolvedScheme === "dark" ? "light" : "dark");

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <BookOpen size={22} className={styles.brandIcon} />
        <div>
          <div className={styles.brandName}>Hamdard</div>
          <div className={styles.brandSub}>BTech Companion</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ""].join(" ")
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className={styles.themeBtn} onClick={toggle} aria-label="Toggle theme">
        {resolvedScheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        <span>{resolvedScheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
      </button>

      <div className={styles.watermark}>made by Lucky</div>
    </aside>
  );
}
