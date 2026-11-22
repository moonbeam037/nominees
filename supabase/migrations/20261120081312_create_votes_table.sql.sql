/*
# Create votes table for "Беседа лучших" awards

1. New Tables
- `votes`
  - `id` (uuid, primary key)
  - `award_id` (text, not null) — ключ номинации из справочника (например "mvp_year")
  - `first_place` (text, not null) — имя участника, занявшего 1 место
  - `second_place` (text, not null) — имя участника, занявшего 2 место
  - `third_place` (text, not null) — имя участника, занявшего 3 место
  - `voter_token` (text, not null) — анонимный токен голосующего (для защиты от двойного голосования, генерируется в браузере)
  - `created_at` (timestamptz, default now())
  - Уникальный индекс (award_id, voter_token) чтобы один голосующий не мог дважды проголосовать по одной номинации

2. Security
- Enable RLS on `votes`.
- Grant SELECT, INSERT to `anon` + `authenticated` — голосование анонимное, без авторизации.
- SELECT открыт всем (чтобы показывать результаты/подсчёт), INSERT открыт anon (клиент с anon-ключом пишет голоса).
- UPDATE и DELETE не предоставляются — голоса неизменяемы.
- Политики: SELECT USING (true) — данные публичные (результаты видны всем), INSERT WITH CHECK (true) — любой может проголосовать.
  Это обоснованно: приложение полностью анонимное, без авторизации, и данные намеренно публичные.
*/

CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id text NOT NULL,
  first_place text NOT NULL,
  second_place text NOT NULL,
  third_place text NOT NULL,
  voter_token text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON votes TO anon, authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS votes_award_voter_unique
  ON votes (award_id, voter_token);

DROP POLICY IF EXISTS "anon_select_votes" ON votes;
CREATE POLICY "anon_select_votes" ON votes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_votes" ON votes;
CREATE POLICY "anon_insert_votes" ON votes FOR INSERT
  TO anon, authenticated WITH CHECK (true);