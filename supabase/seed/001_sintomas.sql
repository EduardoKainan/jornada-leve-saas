-- Seed: Symptom catalog (controlled list)
insert into symptom_catalog (code, label_pt, sort_order) values
  ('nausea', 'Náusea', 1),
  ('fatigue', 'Cansaço/fadiga', 2),
  ('headache', 'Dor de cabeça', 3),
  ('dizziness', 'Tontura', 4),
  ('diarrhea', 'Diarreia', 5),
  ('constipation', 'Prisão de ventre', 6),
  ('vomiting', 'Vômito', 7),
  ('insomnia', 'Insônia', 8),
  ('anxiety', 'Ansiedade', 9),
  ('mood_swings', 'Mudança de humor', 10),
  ('hair_loss', 'Queda de cabelo', 11),
  ('muscle_pain', 'Dor muscular', 12),
  ('skin_rash', 'Erupção na pele', 13),
  ('bloating', 'Inchaço abdominal', 14),
  ('heartburn', 'Azia/queimação', 15),
  ('palpitations', 'Palpitações', 16),
  ('cold_feeling', 'Sensação de frio', 17),
  ('increased_thirst', 'Sede aumentada', 18),
  ('loss_appetite', 'Perda de apetite', 19),
  ('increased_appetite', 'Aumento de apetite', 20)
on conflict (code) do nothing;
