import { supabase } from "./supabase";

const TOKEN_KEY = "bl_voter_token";

export function getVoterToken(): string | null {
  return new URLSearchParams(window.location.search).get("token");
}

export type VoteRecord = {
  award_id: string;
  first_place: string;
  second_place: string;
  third_place: string;
};

export type RankedResult = {
  participant: string;
  points: number;
  firsts: number;
  seconds: number;
  thirds: number;
};

export type VoterState = {
  name: string;
  voted_awards: string[];
};

// Проверка персональной ссылки при входе на сайт (вернет null, если ссылка левая)
export async function fetchVoterState(): Promise<VoterState | null> {
  const token = getVoterToken();
  if (!token) return null;

  const { data, error } = await supabase.rpc("get_voter_state", {
    p_token: token,
  });

  if (error || !data) return null;
  return data as VoterState;
}

export async function submitVote(
  awardId: string,
  first: string,
  second: string,
  third: string
): Promise<{ error?: string }> {
  const token = getVoterToken();
  if (!token) {
    return { error: "Не найдена персональная ссылка для голосования" };
  }

  const { error } = await supabase.rpc("cast_vote", {
    p_token: token,
    p_award_id: awardId,
    p_first_place: first,
    p_second_place: second,
    p_third_place: third,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ты уже проголосовал в этой номинации" };
    }
    return { error: error.message };
  }
  return {};
}

export async function fetchVotedAwards(): Promise<Set<string>> {
  const state = await fetchVoterState();
  if (!state || !state.voted_awards) return new Set();
  return new Set(state.voted_awards);
}

export async function fetchResults(
  awardId: string
): Promise<RankedResult[]> {
  const { data, error } = await supabase.rpc("get_public_votes");
  if (error || !data) return [];

  const tally = new Map<string, RankedResult>();
  const ensure = (name: string): RankedResult => {
    let r = tally.get(name);
    if (!r) {
      r = { participant: name, points: 0, firsts: 0, seconds: 0, thirds: 0 };
      tally.set(name, r);
    }
    return r;
  };

  (data as VoteRecord[])
    .filter((v) => v.award_id === awardId)
    .forEach((v) => {
      ensure(v.first_place).points += 3;
      ensure(v.first_place).firsts += 1;
      ensure(v.second_place).points += 2;
      ensure(v.second_place).seconds += 1;
      ensure(v.third_place).points += 1;
      ensure(v.third_place).thirds += 1;
    });

  return Array.from(tally.values()).sort(
    (a, b) =>
      b.points - a.points ||
      b.firsts - a.firsts ||
      b.seconds - a.seconds ||
      b.thirds - a.thirds
  );
}

export async function fetchAllResults(): Promise<
  Record<string, RankedResult[]>
> {
  const { data, error } = await supabase.rpc("get_public_votes");
  if (error || !data) return {};

  const byAward = new Map<string, Map<string, RankedResult>>();
  (data as VoteRecord[]).forEach((v) => {
    if (!byAward.has(v.award_id)) byAward.set(v.award_id, new Map());
    const tally = byAward.get(v.award_id)!;
    const ensure = (name: string): RankedResult => {
      let r = tally.get(name);
      if (!r) {
        r = {
          participant: name,
          points: 0,
          firsts: 0,
          seconds: 0,
          thirds: 0,
        };
        tally.set(name, r);
      }
      return r;
    };
    ensure(v.first_place).points += 3;
    ensure(v.first_place).firsts += 1;
    ensure(v.second_place).points += 2;
    ensure(v.second_place).seconds += 1;
    ensure(v.third_place).points += 1;
    ensure(v.third_place).thirds += 1;
  });

  const result: Record<string, RankedResult[]> = {};
  byAward.forEach((tally, awardId) => {
    result[awardId] = Array.from(tally.values()).sort(
      (a, b) =>
        b.points - a.points ||
        b.firsts - a.firsts ||
        b.seconds - a.seconds ||
        b.thirds - a.thirds
    );
  });
  return result;
}

export async function fetchTotalVotes(): Promise<number> {
  const { data, error } = await supabase.rpc("get_public_votes");
  if (error || !data) return 0;
  return (data as VoteRecord[]).length;
}
