export type PlanDef = { number: number; passes: number; validity: number };

// Fallback defaults used only if DB has no plans yet.
export const PLANS: PlanDef[] = [
  { number: 1, passes: 3, validity: 30 },
  { number: 2, passes: 6, validity: 60 },
  { number: 3, passes: 10, validity: 90 },
  { number: 4, passes: 13, validity: 120 },
  { number: 5, passes: 16, validity: 150 },
  { number: 6, passes: 21, validity: 180 },
  { number: 7, passes: 25, validity: 210 },
  { number: 8, passes: 28, validity: 240 },
  { number: 9, passes: 32, validity: 270 },
  { number: 10, passes: 35, validity: 300 },
  { number: 11, passes: 39, validity: 330 },
  { number: 12, passes: 48, validity: 360 },
];

export const TOPUPS: PlanDef[] = [
  { number: 1, passes: 1, validity: 30 },
  { number: 2, passes: 2, validity: 30 },
  { number: 3, passes: 3, validity: 30 },
  { number: 4, passes: 4, validity: 60 },
  { number: 5, passes: 5, validity: 60 },
  { number: 6, passes: 6, validity: 60 },
  { number: 7, passes: 7, validity: 90 },
  { number: 8, passes: 8, validity: 90 },
  { number: 9, passes: 9, validity: 90 },
  { number: 10, passes: 10, validity: 90 },
];

export const SLOT_HOURS = Array.from({ length: 14 }, (_, i) => 7 + i); // 7..20

export function formatSlot(hour: number): string {
  const to12 = (h: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh} ${period}`;
  };
  return `${to12(hour)} - ${to12(hour + 1)}`;
}

export type PlanRow = {
  id: string;
  kind: "plan" | "topup";
  plan_number: number;
  label: string | null;
  passes: number;
  validity_days: number;
  is_active: boolean;
};
