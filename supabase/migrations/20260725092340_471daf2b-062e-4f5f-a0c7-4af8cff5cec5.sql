
-- MEMBERS
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  age INT NOT NULL,
  mobile TEXT NOT NULL,
  member_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO anon, authenticated;
GRANT ALL ON public.members TO service_role;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage members" ON public.members FOR ALL USING (true) WITH CHECK (true);

-- GAMES
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  max_players INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.games TO anon, authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage games" ON public.games FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.games (name, max_players) VALUES
  ('Pool', 2),
  ('Table Tennis', 4),
  ('Air Hockey', 2),
  ('Carrom', 4),
  ('Dart', 4);

-- PASSES (each row = a plan or topup purchase)
CREATE TABLE public.passes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('plan','topup')),
  plan_number INT NOT NULL,
  total_passes INT NOT NULL,
  remaining_passes INT NOT NULL,
  validity_days INT NOT NULL,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX passes_member_idx ON public.passes(member_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.passes TO anon, authenticated;
GRANT ALL ON public.passes TO service_role;
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage passes" ON public.passes FOR ALL USING (true) WITH CHECK (true);

-- BOOKINGS
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  pass_id UUID REFERENCES public.passes(id) ON DELETE SET NULL,
  slot_date DATE NOT NULL,
  slot_hour INT NOT NULL CHECK (slot_hour BETWEEN 7 AND 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, slot_date, slot_hour)
);
CREATE INDEX bookings_date_idx ON public.bookings(slot_date);
CREATE INDEX bookings_member_idx ON public.bookings(member_id);
CREATE INDEX bookings_game_slot_idx ON public.bookings(game_id, slot_date, slot_hour);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO anon, authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
