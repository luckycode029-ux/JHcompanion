import { NavLink } from "react-router";
import { Home, Search, Bookmark } from "lucide-react";
import styles from "./bottom-nav.module.css";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/bookmarks", icon: Bookmark, label: "Saved" },
];

export function BottomNav() {
  return (
    <nav className={styles.bottomNav}>
      <span className={styles.watermark}>made by Lucky</span>
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            [styles.navItem, isActive ? styles.navItemActive : ""].join(" ")
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
