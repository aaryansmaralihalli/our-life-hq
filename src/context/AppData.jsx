import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  listAll,
  insertRow,
  insertMany,
  updateRow,
  deleteRow,
  clearTable,
  TABLES,
} from "../lib/db";
import { SUPABASE_READY } from "../lib/supabase";
import {
  SEED_PROFILES,
  SEED_BUCKET,
  SEED_FOOD,
  SEED_DESTINATIONS,
  SEED_GYM,
  SEED_HEALTH,
} from "../lib/seed";

const DataCtx = createContext(null);
export const useData = () => useContext(DataCtx);

const empty = {
  profiles: [],
  bucket_items: [],
  food_spots: [],
  destinations: [],
  gym_entries: [],
  health_entries: [],
};

export function DataProvider({ children }) {
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = {};
    for (const t of TABLES) next[t] = await listAll(t);
    setData(next);
    return next;
  }, []);

  useEffect(() => {
    (async () => {
      let current = await refresh();

      // Ensure two profiles exist (needed for "who" tagging everywhere).
      if (current.profiles.length < 2) {
        const toAdd = SEED_PROFILES.slice(current.profiles.length, 2);
        for (const p of toAdd) await insertRow("profiles", p);
        current = await refresh();
      }

      // Auto-seed sample content the first time, local mode only.
      if (!SUPABASE_READY && !localStorage.getItem("ourlifehq:seeded")) {
        const names = current.profiles.map((p) => p.name);
        await insertMany("bucket_items", SEED_BUCKET);
        await insertMany("food_spots", SEED_FOOD);
        await insertMany("destinations", SEED_DESTINATIONS);
        await insertMany("gym_entries", SEED_GYM(names));
        await insertMany("health_entries", SEED_HEALTH(names));
        localStorage.setItem("ourlifehq:seeded", "1");
        await refresh();
      }
      setLoading(false);
    })();
  }, [refresh]);

  // CRUD helpers that keep local state in sync
  const add = useCallback(async (table, row) => {
    const created = await insertRow(table, row);
    setData((d) => ({ ...d, [table]: [...d[table], created] }));
    return created;
  }, []);

  const update = useCallback(async (table, id, patch) => {
    const updated = await updateRow(table, id, patch);
    setData((d) => ({
      ...d,
      [table]: d[table].map((r) => (r.id === id ? { ...r, ...(updated || patch) } : r)),
    }));
    return updated;
  }, []);

  const remove = useCallback(async (table, id) => {
    await deleteRow(table, id);
    setData((d) => ({ ...d, [table]: d[table].filter((r) => r.id !== id) }));
  }, []);

  const loadSamples = useCallback(async () => {
    const names = data.profiles.map((p) => p.name);
    await insertMany("bucket_items", SEED_BUCKET);
    await insertMany("food_spots", SEED_FOOD);
    await insertMany("destinations", SEED_DESTINATIONS);
    await insertMany("gym_entries", SEED_GYM(names));
    await insertMany("health_entries", SEED_HEALTH(names));
    await refresh();
  }, [data.profiles, refresh]);

  const resetTable = useCallback(
    async (table) => {
      await clearTable(table);
      await refresh();
    },
    [refresh]
  );

  // Derived: people + "who" options
  const people = data.profiles;
  const whoOptions = ["Both", ...people.map((p) => p.name)];
  const personByName = (name) => people.find((p) => p.name === name) || null;

  const value = {
    ...data,
    loading,
    refresh,
    add,
    update,
    remove,
    loadSamples,
    resetTable,
    people,
    whoOptions,
    personByName,
  };

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}
