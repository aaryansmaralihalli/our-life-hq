// ============================================================
// The science — implemented verbatim from the spec (§6).
// All inputs metric: kg, cm, km. log10 = base-10 logarithm.
// ============================================================

const log10 = (x) => Math.log10(x);

/* ---- 6.1 BMI + categories ---- */
export function bmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

// standard: "icmr" (Asian-Indian, default) or "who"
export function bmiCategory(value, standard = "icmr") {
  if (value == null) return { label: "—", tone: "neutral" };
  if (standard === "who") {
    if (value < 18.5) return { label: "Underweight", tone: "low" };
    if (value < 25) return { label: "Normal", tone: "good" };
    if (value < 30) return { label: "Overweight", tone: "warn" };
    return { label: "Obese", tone: "high" };
  }
  // ICMR 2022 (Asian-Indian)
  if (value < 18.5) return { label: "Underweight", tone: "low" };
  if (value < 23) return { label: "Normal", tone: "good" };
  if (value < 25) return { label: "Overweight", tone: "warn" };
  return { label: "Obese", tone: "high" };
}

/* ---- 6.2 Estimated 1-rep max ---- */
export function epley1RM(weight, reps) {
  if (!weight || !reps) return null;
  return weight * (1 + reps / 30);
}
export function brzycki1RM(weight, reps) {
  if (!weight || !reps || reps >= 37) return null;
  return (weight * 36) / (37 - reps);
}
// Above ~12 reps the estimate is low-confidence.
export const isLowConfidence1RM = (reps) => reps > 12;

/* ---- 6.3 BMR (Mifflin–St Jeor) ---- */
export function bmr({ weightKg, heightCm, age, gender }) {
  if (!weightKg || !heightCm || age == null) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "female" ? base - 161 : base + 5;
}

/* ---- 6.4 TDEE ---- */
export const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};
export function tdee(bmrValue, activityLevel) {
  if (bmrValue == null) return null;
  const f = ACTIVITY_FACTORS[activityLevel] ?? 1.2;
  return bmrValue * f;
}

/* ---- 6.5 Body fat % — US Navy method ---- */
export function navyBodyFat({ gender, heightCm, neck, waist, hip }) {
  if (!heightCm || !neck || !waist) return null;
  if (gender === "female") {
    if (!hip) return null;
    return (
      495 /
        (1.29579 -
          0.35004 * log10(waist + hip - neck) +
          0.221 * log10(heightCm)) -
      450
    );
  }
  return (
    495 /
      (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(heightCm)) -
    450
  );
}

/* ---- 6.6 Training volume ---- */
export function volume(sets, reps, weight) {
  return (Number(sets) || 0) * (Number(reps) || 0) * (Number(weight) || 0);
}

/* ---- 6.7 Haversine great-circle distance (km) ---- */
export function haversineKm(a, b) {
  if (!a || !b) return 0;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/* ---- helpers ---- */
export function ageFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d)) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export const round = (n, dp = 1) =>
  n == null ? null : Math.round(n * 10 ** dp) / 10 ** dp;
