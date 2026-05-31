import { createContext, useContext, useEffect, useState } from "react";
import { supabase, SUPABASE_READY } from "../lib/supabase";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!SUPABASE_READY); // local mode is instantly ready

  useEffect(() => {
    if (!SUPABASE_READY) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const value = {
    cloud: SUPABASE_READY,
    ready,
    // In local mode there is no auth, so we consider the user "in".
    authed: SUPABASE_READY ? Boolean(session) : true,
    email: session?.user?.email ?? null,
    signIn,
    signOut,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
