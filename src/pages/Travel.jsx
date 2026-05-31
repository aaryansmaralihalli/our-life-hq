import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { Plus, Pencil, Trash2, Search, MapPin } from "lucide-react";
import { useData } from "../context/AppData";
import {
  Card,
  Button,
  Field,
  Input,
  Textarea,
  Select,
  Modal,
  Badge,
  Empty,
  PageHeader,
  Chip,
  confirmDelete,
} from "../components/ui";
import { TRAVEL_STATUSES, HOME_BASE } from "../lib/constants";
import { haversineKm, round } from "../lib/formulas";

const tone = { Wishlist: "neutral", Planned: "low", Visited: "good" };
const pinColor = { Wishlist: "#8a7d72", Planned: "#c75b39", Visited: "#6b7f6e" };

function makeIcon(status) {
  const color = pinColor[status];
  const inner = status === "Visited" ? "✓" : status === "Wishlist" ? "" : "";
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4);display:grid;place-items:center;border:2px solid #fff;">
      <span style="transform:rotate(45deg);color:#fff;font-size:13px;font-weight:700;">${inner}</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 24],
  });
}
const homeIcon = L.divIcon({
  className: "",
  html: `<div style="font-size:24px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))">🏠</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function FlyTo({ target }) {
  const map = useMap();
  if (target) map.flyTo([target.lat, target.lng], 6, { duration: 1.2 });
  return null;
}

const blank = () => ({
  name: "",
  country: "",
  region: "",
  status: "Wishlist",
  lat: "",
  lng: "",
  visited_on: "",
  trip_days: "",
  budget: "",
  who: "Both",
  notes: "",
});

export default function Travel() {
  const { destinations, whoOptions, add, update, remove } = useData();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank());
  const [flyTarget, setFlyTarget] = useState(null);
  const [geoBusy, setGeoBusy] = useState(false);

  // Route through home + everything that's visited or planned.
  const routePoints = useMemo(() => {
    const pts = destinations
      .filter((d) => d.status !== "Wishlist" && d.lat != null && d.lng != null)
      .sort((a, b) => (a.visited_on || "9999").localeCompare(b.visited_on || "9999"));
    return [HOME_BASE, ...pts];
  }, [destinations]);

  const segments = useMemo(() => {
    const segs = [];
    for (let i = 1; i < routePoints.length; i++) {
      const a = routePoints[i - 1];
      const b = routePoints[i];
      segs.push({
        a,
        b,
        km: haversineKm(a, b),
        mid: { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 },
      });
    }
    return segs;
  }, [routePoints]);

  const visitedKm = round(
    segments
      .filter((s) => destinations.find((d) => d.name === s.b.name)?.status === "Visited")
      .reduce((sum, s) => sum + s.km, 0),
    0
  );
  const totalRouteKm = round(segments.reduce((sum, s) => sum + s.km, 0), 0);

  const openNew = () => {
    setForm(blank());
    setEditing({});
  };
  const openEdit = (row) => {
    setForm({
      ...blank(),
      ...row,
      lat: row.lat ?? "",
      lng: row.lng ?? "",
      visited_on: row.visited_on || "",
      trip_days: row.trip_days ?? "",
      budget: row.budget ?? "",
      photos: row.photos || [],
    });
    setEditing(row);
  };

  const setStatus = async (row, status, ev) => {
    if (status === "Visited" && ev) burstConfetti(ev.clientX ?? window.innerWidth / 2, ev.clientY ?? 200);
    const patch = { status };
    if (status === "Visited" && !row.visited_on) patch.visited_on = new Date().toISOString().slice(0, 10);
    await update("destinations", row.id, patch);
  };

  const geocode = async () => {
    if (!form.name) return;
    setGeoBusy(true);
    try {
      const q = encodeURIComponent([form.name, form.region, form.country].filter(Boolean).join(", "));
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`);
      const json = await res.json();
      if (json[0]) {
        setForm((f) => ({ ...f, lat: Number(json[0].lat).toFixed(4), lng: Number(json[0].lon).toFixed(4) }));
      } else {
        alert("Couldn't find that place — try adding country/region.");
      }
    } catch {
      alert("Geocoding failed (network?). You can enter lat/lng manually.");
    } finally {
      setGeoBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      visited_on: form.visited_on || null,
      trip_days: form.trip_days ? Number(form.trip_days) : null,
      budget: form.budget ? Number(form.budget) : null,
    };
    if (editing.id) await update("destinations", editing.id, payload);
    else await add("destinations", payload);
    setEditing(null);
  };

  const del = async (row) => {
    if (confirmDelete(`"${row.name}"`)) await remove("destinations", row.id);
  };

  return (
    <div>
      <PageHeader
        title="Travel"
        subtitle={`from ${HOME_BASE.name} · ${visitedKm} km explored · ${totalRouteKm} km on the full route`}
        action={
          <Button onClick={openNew}>
            <Plus size={18} /> Add place
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden p-0">
          <MapContainer center={[20, 60]} zoom={3} style={{ height: 460, width: "100%" }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <Marker position={[HOME_BASE.lat, HOME_BASE.lng]} icon={homeIcon}>
              <Tooltip>{HOME_BASE.name} (home)</Tooltip>
            </Marker>
            {destinations
              .filter((d) => d.lat != null && d.lng != null)
              .map((d) => (
                <Marker key={d.id} position={[d.lat, d.lng]} icon={makeIcon(d.status)}>
                  <Tooltip>
                    <b>{d.name}</b> — {d.status}
                    <br />
                    {round(haversineKm(HOME_BASE, d), 0)} km from {HOME_BASE.name}
                  </Tooltip>
                </Marker>
              ))}
            <Polyline
              positions={routePoints.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: "#c75b39", weight: 2, dashArray: "6 6", opacity: 0.7 }}
            />
            {segments.map((s, i) => (
              <Marker
                key={i}
                position={[s.mid.lat, s.mid.lng]}
                icon={L.divIcon({
                  className: "",
                  html: `<div style="background:#fff;border:1px solid #c75b39;color:#c75b39;font-size:10px;font-weight:700;padding:1px 5px;border-radius:99px;white-space:nowrap;">${round(s.km, 0)} km</div>`,
                  iconSize: [0, 0],
                })}
              />
            ))}
            <FlyTo target={flyTarget} />
          </MapContainer>
        </Card>

        <motion.div layout className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
          {destinations.length === 0 && <Empty emoji="✈️">No destinations yet — add your first.</Empty>}
          <AnimatePresence mode="popLayout">
            {destinations.map((d) => {
              const visited = d.status === "Visited";
              const photos = d.photos || [];
              return (
                <motion.div
                  layout
                  key={d.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 200, damping: 24 }}
                  whileHover={{ y: -2 }}
                  className="group"
                >
                  <Card className="p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        className="min-w-0 text-left"
                        onClick={() => d.lat != null && setFlyTarget({ lat: d.lat, lng: d.lng, t: Date.now() })}
                      >
                        <div className={`truncate font-semibold ${visited ? "text-ink-soft line-through" : ""}`}>
                          <MapPin size={13} className="mr-1 inline text-coral" />
                          {d.name}
                        </div>
                        <div className="text-xs text-ink-soft">
                          {d.country}
                          {d.lat != null && <> · {round(haversineKm(HOME_BASE, d), 0)} km away</>}
                          {d.trip_days ? ` · ${d.trip_days}d` : ""}
                          {d.budget ? ` · ₹${d.budget}` : ""}
                          {photos.length > 0 && (
                            <span className="inline-flex items-center gap-0.5"> · <ImageIcon size={11} /> {photos.length}</span>
                          )}
                        </div>
                      </button>
                      <StatusPicker value={d.status} options={TRAVEL_STATUSES} tones={tone} onChange={(s) => setStatus(d, s)} />
                    </div>
                    {photos.length > 0 && <PhotoStrip photos={photos} className="mt-2" />}
                    <div className="mt-2 flex justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => openEdit(d)} className="text-ink-soft hover:text-coral">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => del(d)} className="text-ink-soft hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit destination" : "New destination"} wide>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </Field>
            <Field label="Region">
              <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select options={TRAVEL_STATUSES} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
            </Field>
          </div>

          <div className="flex items-end gap-2">
            <Field label="Latitude">
              <Input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="auto" />
            </Field>
            <Field label="Longitude">
              <Input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="auto" />
            </Field>
            <Button type="button" variant="soft" onClick={geocode} disabled={geoBusy} className="mb-0.5">
              <Search size={16} /> {geoBusy ? "…" : "Find"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Visited on">
              <Input type="date" value={form.visited_on} onChange={(e) => setForm({ ...form, visited_on: e.target.value })} />
            </Field>
            <Field label="Who">
              <Select options={whoOptions} value={form.who} onChange={(e) => setForm({ ...form, who: e.target.value })} />
            </Field>
            <Field label="Trip length (days)">
              <Input type="number" value={form.trip_days} onChange={(e) => setForm({ ...form, trip_days: e.target.value })} />
            </Field>
            <Field label="Budget (₹)">
              <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Field label="📷 Trip photos">
            <PhotoUploader photos={form.photos} folder="travel" onChange={(photos) => setForm({ ...form, photos })} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
