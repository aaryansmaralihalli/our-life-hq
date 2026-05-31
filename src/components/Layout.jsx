import { NavLink, Outlet } from "react-router-dom";
import {
  Home,
  Target,
  UtensilsCrossed,
  Plane,
  Dumbbell,
  HeartPulse,
  User,
  LogOut,
  Cloud,
  HardDrive,
} from "lucide-react";
import { useAuth } from "../context/Auth";

const NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/bucket", label: "Bucket List", icon: Target },
  { to: "/food", label: "Food", icon: UtensilsCrossed },
  { to: "/travel", label: "Travel", icon: Plane },
  { to: "/gym", label: "Gym", icon: Dumbbell },
  { to: "/health", label: "Health", icon: HeartPulse },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Layout() {
  const { cloud, email, signOut } = useAuth();

  return (
    <div className="grain min-h-screen sm:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-black/5 bg-white/40 px-4 py-6 backdrop-blur sm:flex">
        <div className="mb-8 px-2">
          <div className="font-display text-2xl font-bold leading-tight">
            🌅 Our Life HQ
          </div>
          <div className="text-xs text-ink-soft">our shared adventure log</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold transition ${
                  isActive
                    ? "bg-coral text-white shadow"
                    : "text-ink-soft hover:bg-white/70 hover:text-ink"
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 space-y-2 px-2 text-xs text-ink-soft">
          <div className="flex items-center gap-1.5">
            {cloud ? (
              <>
                <Cloud size={14} className="text-sage" /> synced & shared
              </>
            ) : (
              <>
                <HardDrive size={14} className="text-gold" /> local mode
              </>
            )}
          </div>
          {cloud && (
            <>
              <div className="truncate">{email}</div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 font-semibold text-coral hover:underline"
              >
                <LogOut size={14} /> sign out
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 pb-24 sm:pb-0">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-5 py-4 sm:hidden">
          <div className="font-display text-xl font-bold">🌅 Our Life HQ</div>
          {cloud && (
            <button onClick={signOut} className="text-ink-soft">
              <LogOut size={20} />
            </button>
          )}
        </div>

        <main className="mx-auto max-w-5xl px-5 py-4 sm:py-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-black/5 bg-cream/95 px-1 py-1.5 backdrop-blur sm:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition ${
                isActive ? "text-coral" : "text-ink-soft"
              }`
            }
          >
            <Icon size={20} />
            {label.split(" ")[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
