-- =====================================================================
-- 20260811000008_cognition_seed.sql
-- Seed des trois tables de la couche Cognition (Brief N, 2026-08-11).
--
-- Les tables `routines`, `events` et `yggdrasil_manifest` ont ete creees
-- par la migration 20260811000007_cognition.sql. Elles sont videes au
-- boot, et Supabase repond 406 sur les `maybeSingle()` en cascade.
-- Cette migration les remplit pour l'organisation de demonstration
-- 00000000-0000-0000-0000-000000000001 — celle que le code TypeScript
-- utilise comme `COGNITION_ORG_ID` (cf. src/lib/cognition/queries.ts).
--
-- Le contenu raconte une histoire vraie : un coach qui pilote une routine
-- matinale, tient une routine d'hygiene, prepare ses calls, score ses
-- conversations, et publie un manifeste qui ouvre la SovereignGate.
-- Pas de lorem ipsum ; des objets metier que la demo peut presenter.
-- =====================================================================

-- Idempotence : on nettoie avant d'inserer. La migration peut etre
-- reexecutee sans dupliquer les lignes.
delete from cognition.routines where org_id = '00000000-0000-0000-0000-000000000001';
delete from cognition.events where org_id = '00000000-0000-0000-0000-000000000001';
delete from cognition.yggdrasil_manifest where org_id = '00000000-0000-0000-0000-000000000001';

-- ─── Routines ─────────────────────────────────────────────────────────
insert into cognition.routines
  (id, org_id, name, cadence, time_of_day, prompt_template, skills_invoked, is_active)
values
  ('11111111-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Morning Routine', 'daily', '08:00:00',
   'Walk the last 24h, update the second brain, surface the one thing.',
   '["pipeline-review","morning-brief"]'::jsonb, true),

  ('11111111-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'Pipeline Hygiene', 'daily', '08:45:00',
   'Find stale opportunities and assign next actions.',
   '["pipeline-review"]'::jsonb, true),

  ('11111111-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'Call Prep', 'daily', null,
   'Prepare the next prospect brief.',
   '["call-prep","client-onepager"]'::jsonb, true),

  ('11111111-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   'Post-Disc Followup', 'daily', null,
   'Draft the next follow-up from call context.',
   '["post-disc-followup","outreach"]'::jsonb, true),

  ('11111111-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000001',
   'Rep Scoring', 'weekly', null,
   'Score recent sales conversations.',
   '["sales-rep-analyzer"]'::jsonb, true),

  ('11111111-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000001',
   'Weekly Pipeline Review', 'weekly', null,
   'Review conversion and stalled deals.',
   '["pipeline-review","win-loss-analysis"]'::jsonb, true),

  ('11111111-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000001',
   'Monthly Intelligence Report', 'monthly', null,
   'Extract recurring patterns from the month.',
   '["win-loss-analysis","monthly-intelligence"]'::jsonb, false);

-- ─── Events ───────────────────────────────────────────────────────────
insert into cognition.events
  (id, org_id, event_type, member, payload, created_at)
values
  -- Roue matinale des trois derniers jours
  ('22222222-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'routine_run', 'morning',
   '{"routine_id":"11111111-0000-0000-0000-000000000001","duration_ms":4200}'::jsonb,
   '2026-08-11T08:00:04Z'),
  ('22222222-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'routine_run', 'morning',
   '{"routine_id":"11111111-0000-0000-0000-000000000001","duration_ms":4001}'::jsonb,
   '2026-08-10T08:00:03Z'),
  ('22222222-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'routine_run', 'morning',
   '{"routine_id":"11111111-0000-0000-0000-000000000001","duration_ms":3998}'::jsonb,
   '2026-08-09T08:00:02Z'),

  -- Hygiene de pipeline qui nettoie 3 deals stale
  ('22222222-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   'routine_run', 'hygiene',
   '{"routine_id":"11111111-0000-0000-0000-000000000002","stale_deals":3}'::jsonb,
   '2026-08-11T08:45:02Z'),

  -- Skills invoques
  ('22222222-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000001',
   'skill_invoked', 'pipeline-review',
   '{"mode":"morning"}'::jsonb,
   '2026-08-11T08:00:11Z'),
  ('22222222-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000001',
   'skill_invoked', 'call-prep',
   '{"prospect":"Itay"}'::jsonb,
   '2026-08-11T11:55:30Z'),
  ('22222222-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000001',
   'skill_invoked', 'sales-rep-analyzer',
   '{"conversations":7}'::jsonb,
   '2026-08-09T15:00:00Z'),

  -- SovereignGate ouverte apres publication du manifeste
  ('22222222-0000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000001',
   'gate_armed', null,
   '{"floor":0.62,"score":0.84}'::jsonb,
   '2026-08-10T22:14:11Z'),
  ('22222222-0000-0000-0000-000000000009',
   '00000000-0000-0000-0000-000000000001',
   'manifest_published', null,
   '{"graph_version":"1.4.0","source_scope":"cognition"}'::jsonb,
   '2026-08-10T22:14:00Z'),

  -- Win/loss analyse + pause de la routine mensuelle
  ('22222222-0000-0000-0000-00000000000a',
   '00000000-0000-0000-0000-000000000001',
   'win_loss_analysis', null,
   '{"deals_analyzed":4,"won":1,"lost":1}'::jsonb,
   '2026-08-10T18:00:08Z'),
  ('22222222-0000-0000-0000-00000000000b',
   '00000000-0000-0000-0000-000000000001',
   'routine_paused', 'monthly-intelligence',
   '{"reason":"awaiting new source corpus"}'::jsonb,
   '2026-08-09T09:12:00Z');

-- ─── Yggdrasil manifest ───────────────────────────────────────────────
insert into cognition.yggdrasil_manifest
  (id, org_id, graph_version, source_scope, knowledge_sovereignty_score, next_review_at)
values
  ('33333333-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   1, 'cognition · sales · people', 0.84, '2026-09-10T00:00:00Z'),
  ('33333333-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   2, 'cognition · sales · people · support', 0.81, '2026-08-10T00:00:00Z'),
  ('33333333-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   3, 'cognition · sales', 0.76, '2026-07-10T00:00:00Z'),
  ('33333333-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   4, 'cognition', 0.62, '2026-06-10T00:00:00Z');

-- ─── Notification PostgREST ───────────────────────────────────────────
-- Sans cette ligne, PostgREST garde son cache de schema et continue de
-- rendre 406 sur les tables qu'il vient de (re)peupler. Piege deja paye
-- ce matin, imparable.
notify pgrst, 'reload schema';
