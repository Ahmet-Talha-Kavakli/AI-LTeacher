-- Seed initial achievements (trophies shown in user profile)
insert into public.achievements (code, title, description, icon, xp_reward) values
  ('first_lesson',     'İlk Adım',          'İlk dersini tamamladın!',                    'star.fill',       20),
  ('streak_3',         '3 Gün Üst Üste',    '3 günlük seri yakaladın.',                   'flame.fill',      30),
  ('streak_7',         '1 Hafta!',          '7 günlük seri — alışkanlık oluşuyor.',       'flame.fill',      75),
  ('streak_30',        'Ay Boyunca',         '30 günlük seri — efsanesin.',                'crown.fill',     250),
  ('streak_100',       '100 Gün Şampiyonu', '100 günlük seri — efsanevisin.',             'trophy.fill',    750),
  ('first_voice',      'İlk Sohbet',         'AI öğretmenle ilk sesli sohbet.',            'mic.fill',        50),
  ('vocab_100',        '100 Kelime',         '100 kelime öğrendin.',                       'book.fill',       50),
  ('vocab_500',        '500 Kelime',         '500 kelime — etkileyici!',                   'books.vertical.fill', 200),
  ('level_a2',         'A2 Seviyesi',        'A2 seviyesine yükseldin.',                   'arrow.up.circle.fill', 100),
  ('level_b1',         'B1 Seviyesi',        'B1 seviyesine yükseldin.',                   'arrow.up.circle.fill', 200),
  ('level_b2',         'B2 Seviyesi',        'B2 seviyesine yükseldin.',                   'arrow.up.circle.fill', 400),
  ('perfect_lesson',   'Kusursuz',          'Bir dersi %100 doğru tamamladın.',           'checkmark.seal.fill', 25),
  ('night_owl',        'Gece Kuşu',          'Gece yarısından sonra ders çalıştın.',       'moon.stars.fill', 15),
  ('early_bird',       'Erken Kalkan',       'Sabah 6''dan önce ders çalıştın.',           'sunrise.fill',    15),
  ('top_100',          'İlk 100',            'Global lider tablosunda ilk 100''e girdin.', 'medal.fill',     500),
  ('top_10',           'İlk 10',             'Global lider tablosunda ilk 10''a girdin.',  'medal.fill',    2000),
  ('first_place',      'Birinci!',           'Global lider tablosunda 1. oldun.',          'crown.fill',    5000)
on conflict (code) do nothing;
