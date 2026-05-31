// Generic data repository. Every entity is a flat collection of rows with
// snake_case fields that map 1:1 to Supabase columns AND to localStorage.
// Switches backend automatically based on SUPABASE_READY.

import { supabase, SUPABASE_READY } from "./supabase";

const LS_PREFIX = "ourlifehq:";

export const TABLES = [
  "profiles",
  "bucket_items",
  "food_spots",
  "destinations",
  "gym_entries",
  "health_entries",
];

const uuid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

/* ---------- localStorage backend ---------- */
function lsGet(table) {
  try {
    return JSON.parse(localStorage.getItem(LS_PREFIX + table)) || [];
  } catch {
    return [];
  }
}
function lsSet(table, rows) {
  localStorage.setItem(LS_PREFIX + table, JSON.stringify(rows));
}

/* ---------- public API ---------- */
export async function listAll(table) {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  }
  return lsGet(table);
}

export async function insertRow(table, row) {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from(table)
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const rows = lsGet(table);
  const newRow = { id: uuid(), created_at: new Date().toISOString(), ...row };
  rows.push(newRow);
  lsSet(table, rows);
  return newRow;
}

export async function insertMany(table, list) {
  const out = [];
  for (const r of list) out.push(await insertRow(table, r));
  return out;
}

export async function updateRow(table, id, patch) {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from(table)
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const rows = lsGet(table);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], ...patch };
    lsSet(table, rows);
    return rows[idx];
  }
  return null;
}

export async function deleteRow(table, id) {
  if (SUPABASE_READY) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
    return;
  }
  lsSet(
    table,
    lsGet(table).filter((r) => r.id !== id)
  );
}

/* ---------- backup / restore ---------- */
export async function exportAll() {
  const dump = {};
  for (const t of TABLES) dump[t] = await listAll(t);
  return dump;
}

export async function importAll(dump) {
  for (const t of TABLES) {
    if (!dump[t]) continue;
    if (SUPABASE_READY) {
      await supabase.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (dump[t].length) await supabase.from(t).insert(dump[t]);
    } else {
      lsSet(t, dump[t]);
    }
  }
}

export async function clearTable(table) {
  if (SUPABASE_READY) {
    await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  } else {
    lsSet(table, []);
  }
}
