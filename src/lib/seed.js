// Sample data so the app looks alive on day one (spec §5).
// Loaded automatically once in local mode; loadable via a button otherwise.

export const SEED_PROFILES = [
  {
    name: "You",
    dob: "1998-04-12",
    gender: "male",
    height_cm: 178,
    weight_kg: 82,
    body_fat: null,
    neck: 38,
    waist: 86,
    hip: null,
    activity_level: "moderate",
    goal: "lose",
    color: "#c75b39",
  },
  {
    name: "Partner",
    dob: "1999-09-23",
    gender: "female",
    height_cm: 164,
    weight_kg: 61,
    body_fat: null,
    neck: 31,
    waist: 72,
    hip: 96,
    activity_level: "light",
    goal: "maintain",
    color: "#b5557a",
  },
];

export const SEED_BUCKET = [
  { dream: "See the Northern Lights", category: "Travel", who: "Both", status: "Planned", target_date: "2026-12-01", done_date: null, excitement: 3, notes: "Reykjavik in winter." },
  { dream: "Run a half marathon", category: "Milestone", who: "You", status: "In Progress", target_date: "2026-10-15", done_date: null, excitement: 2, notes: "Training underway." },
  { dream: "Take a Thai cooking class", category: "Experience", who: "Both", status: "Idea", target_date: null, done_date: null, excitement: 2, notes: "" },
  { dream: "Scuba dive in the Andamans", category: "Adventure", who: "Both", status: "Planned", target_date: "2026-08-20", done_date: null, excitement: 3, notes: "Havelock Island." },
  { dream: "Watch sunrise at Nandi Hills", category: "Adventure", who: "Both", status: "Done", target_date: null, done_date: "2026-02-14", excitement: 3, notes: "Early drive, totally worth it." },
];

export const SEED_FOOD = [
  { place: "Murugan Idli Shop", cuisine: "South Indian", city: "Chennai", status: "Conquered", visited_on: "2026-01-10", rating: 5, cost_for_two: 400, who: "Both", notes: "Best podi idli." },
  { place: "Avartana", cuisine: "South Indian (fine)", city: "Chennai", status: "Conquered", visited_on: "2026-03-02", rating: 5, cost_for_two: 6000, who: "Both", notes: "Tasting menu, stunning." },
  { place: "Writer's Cafe", cuisine: "Continental", city: "Chennai", status: "Conquered", visited_on: "2026-02-20", rating: 4, cost_for_two: 1500, who: "Both", notes: "" },
  { place: "Jay Fai", cuisine: "Thai", city: "Bangkok", status: "Want to try", visited_on: null, rating: null, cost_for_two: null, who: "Both", notes: "Michelin street food." },
  { place: "Sukiyabashi Jiro", cuisine: "Japanese", city: "Tokyo", status: "Want to try", visited_on: null, rating: null, cost_for_two: null, who: "Both", notes: "Dream sushi." },
  { place: "L'Antica Pizzeria da Michele", cuisine: "Italian", city: "Naples", status: "Booked", visited_on: null, rating: null, cost_for_two: 2000, who: "Both", notes: "" },
];

export const SEED_DESTINATIONS = [
  { name: "Chennai", country: "India", region: "Tamil Nadu", status: "Visited", lat: 13.0827, lng: 80.2707, visited_on: "2025-01-01", trip_days: null, budget: null, who: "Both", notes: "Home base." },
  { name: "Munnar", country: "India", region: "Kerala", status: "Visited", lat: 10.0889, lng: 77.0595, visited_on: "2025-12-22", trip_days: 4, budget: 25000, who: "Both", notes: "Tea hills." },
  { name: "Andaman Islands", country: "India", region: "Andaman", status: "Planned", lat: 11.6234, lng: 92.7265, visited_on: null, trip_days: 6, budget: 80000, who: "Both", notes: "Scuba!" },
  { name: "Reykjavik", country: "Iceland", region: "Capital", status: "Wishlist", lat: 64.1466, lng: -21.9426, visited_on: null, trip_days: 7, budget: 250000, who: "Both", notes: "Northern lights." },
  { name: "Kyoto", country: "Japan", region: "Kansai", status: "Wishlist", lat: 35.0116, lng: 135.7681, visited_on: null, trip_days: 5, budget: 200000, who: "Both", notes: "Temples + sushi." },
  { name: "Bali", country: "Indonesia", region: "Bali", status: "Planned", lat: -8.4095, lng: 115.1889, visited_on: null, trip_days: 8, budget: 150000, who: "Both", notes: "" },
  { name: "Santorini", country: "Greece", region: "Cyclades", status: "Wishlist", lat: 36.3932, lng: 25.4615, visited_on: null, trip_days: 5, budget: 220000, who: "Both", notes: "" },
];

// Gym: a few weeks of the big three, weights rising, for both people.
function buildGymSeed(who, base) {
  const out = [];
  const weeks = 5;
  const lifts = [
    { exercise: "Bench Press", muscles: ["Chest"], start: base.bench, step: 2.5, reps: 5, sets: 3 },
    { exercise: "Back Squat", muscles: ["Quads"], start: base.squat, step: 5, reps: 5, sets: 3 },
    { exercise: "Deadlift", muscles: ["Back"], start: base.dead, step: 5, reps: 3, sets: 3 },
  ];
  for (let w = 0; w < weeks; w++) {
    const d = new Date();
    d.setDate(d.getDate() - (weeks - 1 - w) * 7);
    const date = d.toISOString().slice(0, 10);
    for (const l of lifts) {
      out.push({
        date,
        who,
        session: "Strength",
        muscles: l.muscles,
        exercise: l.exercise,
        sets: l.sets,
        reps: l.reps,
        weight: l.start + l.step * w,
        rpe: 8,
        duration: 60,
        distance: null,
      });
    }
  }
  return out;
}

export const SEED_GYM = (names) => [
  ...buildGymSeed(names[0], { bench: 60, squat: 90, dead: 110 }),
  ...buildGymSeed(names[1], { bench: 30, squat: 45, dead: 60 }),
];

// Health: weigh-ins trending down for both.
function buildHealthSeed(who, start, drop) {
  const out = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i) * 14);
    out.push({
      date: d.toISOString().slice(0, 10),
      who,
      weight: +(start - drop * i).toFixed(1),
      body_fat: null,
      waist: null,
      neck: null,
      hip: null,
      resting_hr: 62,
      notes: "",
    });
  }
  return out;
}

export const SEED_HEALTH = (names) => [
  ...buildHealthSeed(names[0], 86, 1),
  ...buildHealthSeed(names[1], 64, 0.7),
];
