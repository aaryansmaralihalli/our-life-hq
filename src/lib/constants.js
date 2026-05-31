// Shared option lists, the muscle→exercise map (§6.8), and helpers.

export const HOME_BASE = { name: "Chennai", lat: 13.0827, lng: 80.2707 };

export const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary (little/no exercise)" },
  { value: "light", label: "Lightly active (1–3 days/wk)" },
  { value: "moderate", label: "Moderately active (3–5 days/wk)" },
  { value: "very", label: "Very active (6–7 days/wk)" },
  { value: "extra", label: "Extra active (hard training/job)" },
];

export const GOALS = [
  { value: "lose", label: "Lose" },
  { value: "maintain", label: "Maintain" },
  { value: "gain", label: "Gain" },
];

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const AVATAR_COLORS = [
  "#c75b39",
  "#d9a441",
  "#6b7f6e",
  "#7c6f9c",
  "#b5557a",
  "#3f7d8c",
];

/* ---- Bucket list ---- */
export const BUCKET_CATEGORIES = [
  "Travel",
  "Food",
  "Adventure",
  "Experience",
  "Milestone",
  "Other",
];
export const BUCKET_STATUSES = ["Idea", "Planned", "In Progress", "Done"];

/* ---- Food ---- */
export const FOOD_STATUSES = ["Want to try", "Booked", "Conquered"];

/* ---- Travel ---- */
export const TRAVEL_STATUSES = ["Wishlist", "Planned", "Visited"];

/* ---- Gym (§6.8) ---- */
export const MUSCLES = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Cardio",
];

export const EXERCISES_BY_MUSCLE = {
  Chest: ["Bench Press", "Incline Dumbbell Press", "Chest Fly", "Push-Up", "Cable Crossover", "Dips"],
  Back: ["Deadlift", "Pull-Up", "Barbell Row", "Lat Pulldown", "Seated Cable Row", "Face Pull"],
  Shoulders: ["Overhead Press", "Lateral Raise", "Front Raise", "Arnold Press", "Rear Delt Fly", "Upright Row"],
  Biceps: ["Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl", "Cable Curl"],
  Triceps: ["Tricep Pushdown", "Skull Crusher", "Overhead Extension", "Close-Grip Bench", "Dips"],
  Quads: ["Back Squat", "Front Squat", "Leg Press", "Walking Lunge", "Leg Extension", "Bulgarian Split Squat"],
  Hamstrings: ["Romanian Deadlift", "Lying Leg Curl", "Good Morning", "Nordic Curl"],
  Glutes: ["Hip Thrust", "Glute Bridge", "Cable Kickback", "Romanian Deadlift"],
  Calves: ["Standing Calf Raise", "Seated Calf Raise"],
  Core: ["Plank", "Hanging Leg Raise", "Cable Crunch", "Russian Twist", "Ab Wheel"],
  Cardio: ["Treadmill", "Cycling", "Rowing", "Elliptical", "Stairmaster", "Jump Rope"],
};

export const CARDIO_MUSCLE = "Cardio";

// Which muscles does an exercise belong to? (for training-split donut)
export const MUSCLES_FOR_EXERCISE = (() => {
  const map = {};
  for (const [muscle, list] of Object.entries(EXERCISES_BY_MUSCLE)) {
    for (const ex of list) {
      (map[ex] ||= []).push(muscle);
    }
  }
  return map;
})();

export const todayISO = () => new Date().toISOString().slice(0, 10);
