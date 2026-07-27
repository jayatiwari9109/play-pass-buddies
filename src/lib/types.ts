export type Member = {
  id: string;
  full_name: string;
  age: number;
  mobile: string;
  member_id: string;
  created_at: string;
};

export type Game = {
  id: string;
  name: string;
  max_players: number;
  created_at: string;
};

export type Pass = {
  id: string;
  member_id: string;
  kind: string;
  plan_number: number;
  total_passes: number;
  remaining_passes: number;
  validity_days: number;
  activated_at: string;
  expires_at: string;
  created_at: string;
};

export type Booking = {
  id: string;
  member_id: string;
  game_id: string;
  pass_id: string | null;
  slot_date: string;
  slot_hour: number;
  created_at: string;
};

export function isPassActive(p: Pass): boolean {
  return new Date(p.expires_at) > new Date() && p.remaining_passes > 0;
}
