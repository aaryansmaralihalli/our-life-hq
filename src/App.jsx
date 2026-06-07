import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/Auth";
import { DataProvider, useData } from "./context/AppData";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BucketList from "./pages/BucketList";
import Food from "./pages/Food";
import Travel from "./pages/Travel";
import Gym from "./pages/Gym";
import Health from "./pages/Health";
import Profile from "./pages/Profile";
// /world pulls in three.js + skinview3d — lazy-load so the dashboard stays light
const World = lazy(() => import("./pages/World"));

function Splash({ text = "Loading…" }) {
  return (
    <div className="grain flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-2 animate-pulse text-4xl">🌅</div>
        <p className="font-display italic text-ink-soft">{text}</p>
      </div>
    </div>
  );
}

function Gate() {
  const { ready, authed } = useAuth();
  if (!ready) return <Splash />;
  if (!authed) return <Login />;
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}

function Shell() {
  const { loading } = useData();
  if (loading) return <Splash text="Gathering your adventures…" />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route
          path="world"
          element={
            <Suspense fallback={<Splash text="Entering our world…" />}>
              <World />
            </Suspense>
          }
        />
        <Route path="bucket" element={<BucketList />} />
        <Route path="food" element={<Food />} />
        <Route path="travel" element={<Travel />} />
        <Route path="gym" element={<Gym />} />
        <Route path="health" element={<Health />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  );
}
