import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/Auth";
import { Card, Button, Input } from "../components/ui";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setError(error.message);
  };

  return (
    <div className="grain relative flex min-h-screen items-center justify-center p-6">
      <div className="aurora">
        <div className="aurora-3" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="w-full max-w-sm"
      >
        <Card className="p-8 text-center">
          <motion.div
            className="mb-1 text-5xl"
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            🌅
          </motion.div>
          <h1 className="font-display text-3xl font-bold">Our Life HQ</h1>
          <p className="mb-6 font-display italic text-ink-soft">sign in to your shared journal</p>
          <form onSubmit={submit} className="space-y-3 text-left">
            <Input
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
