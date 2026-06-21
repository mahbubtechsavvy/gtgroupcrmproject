-- Migration 036: Stored Daily Currency Rates
-- Purpose: Auditable local currency conversion for GT Overview and finance reports.

CREATE TABLE IF NOT EXISTS public.currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_currency TEXT NOT NULL,
  usd_rate NUMERIC NOT NULL,
  krw_rate NUMERIC NOT NULL,
  rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source_provider TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_currency, rate_date)
);

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "currency_rates_select_authenticated" ON public.currency_rates;
CREATE POLICY "currency_rates_select_authenticated"
ON public.currency_rates
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "currency_rates_manage_super_admin" ON public.currency_rates;
CREATE POLICY "currency_rates_manage_super_admin"
ON public.currency_rates
FOR ALL
TO authenticated
USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('ceo','coo','it_manager'))
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('ceo','coo','it_manager'));

INSERT INTO public.currency_rates (source_currency, usd_rate, krw_rate, rate_date, source_provider)
VALUES
  ('BDT', 0.0082, 11.2, CURRENT_DATE, 'seed'),
  ('KRW', 0.00073, 1, CURRENT_DATE, 'seed'),
  ('LKR', 0.0033, 4.5, CURRENT_DATE, 'seed'),
  ('VND', 0.000039, 0.053, CURRENT_DATE, 'seed'),
  ('USD', 1, 1365, CURRENT_DATE, 'seed')
ON CONFLICT (source_currency, rate_date) DO NOTHING;
