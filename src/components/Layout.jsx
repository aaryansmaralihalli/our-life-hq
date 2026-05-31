import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Cloud, HardDrive } from "lucide-react";
import { useAuth } from "../context/Auth";
import Dock from "./Dock";
import { pageTransition } from "./motion";

export default function Layout() {
  const { cloud, email, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="grain relative min-h-screen">
      {/* animated background */}
      <div className="aurora">
        <div className="aurora-3" />
      </div>

      {/* floating status / sign-out chip, top-right */}
      <div className="fixed right-4 top-4 z-40 flex items-center gap-2 text-xs">
        <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-ink-soft">
          {cloud ? (
            <>
              <Cloud size={13} className="text-sage" />
              <span className="hidden sm:inline">{email}</span>
              <span className="sm:hidden">synced</span>
            </>
          ) : (
            <>
              <HardDrive size={13} className="text-gold" /> local
            </>
          )}
        </span>
        {cloud && (
          <button
            onClick={signOut}
            className="glass grid h-8 w-8 place-items-center rounded-full text-ink-soft transition hover:text-coral"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>

      {/* page content with route transitions */}
      <main className="mx-auto max-w-5xl px-5 pb-32 pt-16 sm:pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <Dock />
    </div>
  );
}
