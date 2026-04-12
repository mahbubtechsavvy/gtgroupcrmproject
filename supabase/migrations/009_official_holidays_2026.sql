-- ================================================================
-- GT GROUP CRM — 2026 OFFICIAL HOLIDAYS SEED
-- Coverage: Bangladesh, South Korea, Vietnam, Sri Lanka
-- ================================================================
INSERT INTO office_holidays (country, holiday_date, name, is_government)
VALUES -- Bangladesh
  (
    'Bangladesh',
    '2026-02-21',
    'Language Martyrs Day',
    true
  ),
  (
    'Bangladesh',
    '2026-03-17',
    'Sheikh Mujibur Rahman Birthday',
    true
  ),
  (
    'Bangladesh',
    '2026-03-26',
    'Independence Day',
    true
  ),
  (
    'Bangladesh',
    '2026-04-14',
    'Pahela Baishakh (Bengali New Year)',
    true
  ),
  ('Bangladesh', '2026-05-01', 'May Day', true),
  ('Bangladesh', '2026-12-16', 'Victory Day', true),
  -- South Korea
  (
    'South Korea',
    '2026-01-01',
    'New Year Day',
    true
  ),
  (
    'South Korea',
    '2026-02-16',
    'Seollal (Lunar New Year)',
    true
  ),
  (
    'South Korea',
    '2026-02-17',
    'Seollal (Lunar New Year)',
    true
  ),
  (
    'South Korea',
    '2026-02-18',
    'Seollal (Lunar New Year)',
    true
  ),
  (
    'South Korea',
    '2026-03-01',
    'Independence Movement Day',
    true
  ),
  (
    'South Korea',
    '2026-05-05',
    'Children Day',
    true
  ),
  (
    'South Korea',
    '2026-05-24',
    'Buddha Birthday',
    true
  ),
  (
    'South Korea',
    '2026-06-06',
    'Memorial Day',
    true
  ),
  (
    'South Korea',
    '2026-08-15',
    'Liberation Day',
    true
  ),
  ('South Korea', '2026-09-24', 'Chuseok', true),
  ('South Korea', '2026-09-25', 'Chuseok', true),
  ('South Korea', '2026-09-26', 'Chuseok', true),
  (
    'South Korea',
    '2026-10-03',
    'National Foundation Day',
    true
  ),
  ('South Korea', '2026-10-09', 'Hangeul Day', true),
  (
    'South Korea',
    '2026-12-25',
    'Christmas Day',
    true
  ),
  -- Vietnam
  ('Vietnam', '2026-01-01', 'New Year Day', true),
  (
    'Vietnam',
    '2026-02-17',
    'Tet Holiday (Lunar New Year)',
    true
  ),
  (
    'Vietnam',
    '2026-04-30',
    'Reunification Day',
    true
  ),
  ('Vietnam', '2026-05-01', 'Labour Day', true),
  ('Vietnam', '2026-09-02', 'National Day', true),
  -- Sri Lanka
  (
    'Sri Lanka',
    '2026-01-14',
    'Tamil Thai Pongal Day',
    true
  ),
  (
    'Sri Lanka',
    '2026-02-04',
    'Independence Day',
    true
  ),
  (
    'Sri Lanka',
    '2026-04-13',
    'Sinhala & Tamil New Year Day',
    true
  ),
  (
    'Sri Lanka',
    '2026-04-14',
    'Sinhala & Tamil New Year Day',
    true
  ),
  ('Sri Lanka', '2026-05-01', 'May Day', true),
  (
    'Sri Lanka',
    '2026-05-22',
    'Vesak Poya Day',
    true
  ),
  ('Sri Lanka', '2026-12-25', 'Christmas Day', true) ON CONFLICT DO NOTHING;