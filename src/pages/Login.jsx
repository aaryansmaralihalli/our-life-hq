import { useState } from "react";
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
    <div className="grain flex min-h-screen items-center justify-center p-6">
      <Card className="animate-pop w-full max-w-sm p-8 text-center">
        <div className="mb-1 text-4xl">🌅</div>
        <h1 className="font-display text-3xl font-bold">Our Life HQ</h1>
        <p className="mb-6 font-display italic text-ink-soft">
          sign in to your shared journal
        </p>
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
    </div>
  );
}
