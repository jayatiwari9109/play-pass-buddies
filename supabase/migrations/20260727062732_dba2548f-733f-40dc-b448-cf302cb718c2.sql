CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('plan','topup')),
  plan_number INTEGER NOT NULL,
  label TEXT,
  passes INTEGER NOT NULL,
  validity_days INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kind, plan_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage plans" ON public.plans FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.plans (kind, plan_number, passes, validity_days) VALUES
('plan',1,3,30),('plan',2,6,60),('plan',3,10,90),('plan',4,13,120),
('plan',5,16,150),('plan',6,21,180),('plan',7,25,210),('plan',8,28,240),
('plan',9,32,270),('plan',10,35,300),('plan',11,39,330),('plan',12,48,360),
('topup',1,1,30),('topup',2,2,30),('topup',3,3,30),('topup',4,4,60),
('topup',5,5,60),('topup',6,6,60),('topup',7,7,90),('topup',8,8,90),
('topup',9,9,90),('topup',10,10,90);