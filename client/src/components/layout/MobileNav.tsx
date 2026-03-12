import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Users, MessageCircle, Grid3x3 } from "lucide-react";
import { cx } from "../../utils/helpers";

const A = "#7c6ff7";

const links = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/friends", icon: Users, label: "Friends" },
  { to: "/messages", icon: MessageCircle, label: "Messages" },
  { to: "/groups", icon: Grid3x3, label: "Groups" },
];

export default function MobileNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 h-16 flex lg:hidden border-t border-[var(--nx-border)]"
      style={{
        background: "var(--nx-navbar)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
          style={({ isActive }) => ({
            color: isActive ? A : "var(--nx-muted)",
          })}
        >
          {({ isActive }) => (
            <>
              <span
                className={cx(
                  "w-10 h-8 flex items-center justify-center rounded-xl transition-all",
                  isActive ? "bg-[rgba(124,111,247,0.12)]" : "",
                )}
              >
                <Icon size={20} />
              </span>
              <span className="text-[10px] font-semibold">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
