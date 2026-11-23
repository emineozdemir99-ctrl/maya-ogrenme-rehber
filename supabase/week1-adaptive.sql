-- MAYA 1. HAFTA: otomatik soru üretimi için takip kaydı
-- SQL Editor'de yalnızca bir kez çalıştırılabilir; gerçek soru içermez.
BEGIN;
INSERT INTO public.maya_activities
(week_id, activity_no, title, difficulty, problem, hints, answer_key)
VALUES
(1, 1, 'Uyarlanabilir öğrenme oturumu', 'orta',
 'Maya MAT.6.1.6 kapsamında her öğrenciye özgün problem üretir.',
 '[]'::jsonb, '{}'::jsonb)
ON CONFLICT (week_id, activity_no) DO NOTHING;
COMMIT;
