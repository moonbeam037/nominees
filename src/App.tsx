import {
  Award as AwardIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  ImageOff,
  Moon,
  Sun,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  AWARDS,
  PARTICIPANTS,
  PRESIDENT_PARTICIPANTS,
  getParticipant,
  type Award,
} from "@/config";
import {
  fetchAllResults,
  fetchResults,
  fetchTotalVotes,
  fetchVotedAwards,
  submitVote,
  fetchVoterState, 
  VoterState,
  type RankedResult,
} from "@/lib/voting";

type View = "home" | "vote" | "results";
type Theme = "dark" | "light";

const THEME_KEY = "bl_theme";

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem(THEME_KEY) as Theme) || "light";
  });
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))];
}

function nomineePhoto(id: string): string {
  return `${import.meta.env.BASE_URL}images/nominees/${id}.jpg`;
}

const RANK_COLORS = {
  1: { border: "border-gold", bg: "bg-gold/10", text: "text-gold", solid: "bg-gold", label: "1 место" },
  2: { border: "border-sky", bg: "bg-sky/10", text: "text-sky", solid: "bg-sky", label: "2 место" },
  3: { border: "border-bronze", bg: "bg-bronze/10", text: "text-bronze", solid: "bg-bronze", label: "3 место" },
} as const;

export default function App() {
  const [view, setView] = useState<View>("home");
  const [activeAward, setActiveAward] = useState<Award | null>(null);
  const [votedAwards, setVotedAwards] = useState<Set<string>>(new Set());
  const [totalVotes, setTotalVotes] = useState(0);
  const [voter, setVoter] = useState<VoterState | null | undefined>(undefined);

  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    fetchVotedAwards().then(setVotedAwards);
    fetchTotalVotes().then(setTotalVotes);
    fetchVoterState().then((state) => {
      setVoter(state); // Вернет объект { name, voted_awards } или null
    });
  }, []);
  
  if (voter === undefined) {
    return <div style={{ padding: 40, textAlign: "center" }}>Проверяем ссылку...</div>;
  }
  
  if (voter === null) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Доступ закрыт</h2>
        <p>Открой сайт по своей персональной ссылке из личных сообщений.</p>
      </div>
    );
  }

  const refreshVoted = () => {
    fetchVotedAwards().then(setVotedAwards);
    fetchTotalVotes().then(setTotalVotes);
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header
        view={view}
        theme={theme}
        onToggleTheme={toggleTheme}
        awardTitle={activeAward?.title}
        onHome={() => setView("home")}
      />
      <main className="w-full px-6 xl:px-9 2xl:px-[300px]">
        {view === "home" && (
          <Home
            votedAwards={votedAwards}
            totalVotes={totalVotes}
            onVote={(a) => {
              setActiveAward(a);
              setView("vote");
            }}
          />
        )}
        {view === "vote" && activeAward && (
          <VoteScreen
            award={activeAward}
            alreadyVoted={votedAwards.has(activeAward.id)}
            onSubmit={async (f, s, t) => {
              const res = await submitVote(activeAward.id, f, s, t);
              if (!res.error) refreshVoted();
              return res;
            }}
            onBack={() => setView("home")}
          />
        )}
        {/* {view === "results" && <ResultsView onBack={() => setView("home")} />} */}
      </main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        Беседа лучших — премия года 2026
      </footer>
    </div>
  );
}

function Header({
  view,
  theme,
  onToggleTheme,
  awardTitle,
  onHome,
}: {
  view: View;
  theme: Theme;
  onToggleTheme: () => void;
  awardTitle?: string;
  onHome: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
        <button
          onClick={onHome}
          className="flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-btn-text">
            <Trophy size={18} />
          </span>
          <span className="text-base sm:text-lg">Беседа лучших</span>
          {view === "vote" && awardTitle && (
            <span className="ml-2 text-sm text-muted">
              · {awardTitle}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            aria-label="Сменить тему"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-2 text-text transition hover:border-border-strong"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function NavBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-text text-bg"
          : "text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function Home({
  votedAwards,
  totalVotes,
  onVote,
}: {
  votedAwards: Set<string>;
  totalVotes: number;
  onVote: (a: Award) => void;
}) {
  const progress = Math.round((votedAwards.size / AWARDS.length) * 100);

  return (
    <div>
      <section className="mb-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-mint" />
          Премия года 2026
        </span>
        <h1 className="mt-5 text-5xl font-bold tracking-tight sm:text-6xl">
          Беседа лучших
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Выбери топ-3 участников в каждой номинации. Голосование анонимное.
          Первое место — 3 балла, второе — 2, третье — 1.
        </p>
        <div className="mx-auto mt-7 flex max-w-sm items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-muted">
              <span>Прогресс</span>
              <span>
                {votedAwards.size} / {AWARDS.length}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-mint transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-muted">{totalVotes} голосов</span>
        </div>
      </section>


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {AWARDS.map((award, i) => {
          const voted = votedAwards.has(award.id);
          const accent = [
            "text-gold", "text-sky", "text-bronze", "text-mint",
            "text-rose", "text-sky", "text-gold", "text-bronze",
            "text-mint", "text-rose", "text-sky", "text-gold",
            "text-bronze", "text-mint", "text-rose", "text-sky",
          ][i % 16];
          return (
            <button
              key={award.id}
              onClick={() => onVote(award)}
              className="group relative flex flex-col items-start rounded-2xl border border-border bg-surface p-5 text-left backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-border-strong"
            >
              <div className="flex w-full items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 transition group-hover:bg-surface ${accent}`}>
                  <AwardIcon size={18} />
                </span>
                {voted && (
                  <span className="flex items-center gap-1 rounded-full bg-mint/15 px-2.5 py-1 text-xs font-medium text-mint">
                    <Check size={12} /> Готово
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-semibold leading-snug">{award.title}</h3>
              <span className="mt-3 text-sm font-medium text-muted transition group-hover:text-text">
                {voted ? "Переголосовать" : "Голосовать"} →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NomineePhoto({ id, name }: { id: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-2 text-muted">
        <ImageOff size={20} />
      </div>
    );
  }
  return (
    <img
      src={nomineePhoto(id)}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}
function shuffle<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
function VoteScreen({
  award,
  alreadyVoted,
  onSubmit,
  onBack,
}: {
  award: Award;
  alreadyVoted: boolean;
  onSubmit: (
    f: string,
    s: string,
    t: string
  ) => Promise<{ error?: string }>;
  onBack: () => void;
}) {
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [third, setThird] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [shuffledParticipants] = useState(() =>
    shuffle(PARTICIPANTS)
  );

  const [shuffledPresidentParticipants] = useState(() =>
    shuffle(PRESIDENT_PARTICIPANTS)
  );
  const filledCount = [first, second, third].filter(Boolean).length;
  const allFilled = award.id === 'president' ? Boolean(first) : Boolean(first && second && third);

  function pick(participantId: string) {
  if (award.id === "president") {
    return setFirst(first === participantId ? "" : participantId);
  }

  if (first === participantId) return setFirst("");
  if (second === participantId) return setSecond("");
  if (third === participantId) return setThird("");
  if (!first) return setFirst(participantId);
  if (!second) return setSecond(participantId);
  if (!third) return setThird(participantId);
}

  function clearSlot(slot: 1 | 2 | 3) {
    if (slot === 1) setFirst("");
    if (slot === 2) setSecond("");
    if (slot === 3) setThird("");
  }

  async function handleSubmit() {
    if (!allFilled) return;
    setSubmitting(true);
    setError("");
    const res = await onSubmit(first, second, third);
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-mint text-btn-text">
          <Check size={36} />
        </div>
        <h2 className="mt-6 text-3xl font-bold">Голос принят!</h2>
        <p className="mt-3 text-muted">
          Твой голос по номинации «{award.title}» засчитан.
        </p>
        <button
          onClick={onBack}
          className="mt-8 rounded-xl bg-text px-6 py-3.5 font-semibold text-bg transition hover:opacity-90"
        >
          Вернуться к номинациям
        </button>
      </div>
    );
  }

  const slots: { rank: 1 | 2 | 3; id: string }[] = [
    { rank: 1, id: first },
    { rank: 2, id: second },
    { rank: 3, id: third },
  ];

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-sm font-medium text-muted hover:text-text"
      >
        ← Все номинации
      </button>

      <div className="mb-6">
        <span className="text-sm font-medium uppercase tracking-wider text-muted">
          Номинация
        </span>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight">
          {award.title}
        </h1>
        <p className="mt-2 text-muted">
          {award.description}
        </p>
        {alreadyVoted && (
          <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
            Ты уже голосовал в этой номинации. Повторный голос не заменит
            предыдущий — будет показана ошибка.
          </div>
        )}
      </div>

      {/* Sticky podium bar — stays pinned under the header while scrolling */}
      <div className="sticky top-[57px] z-20 -mx-4 mb-8 border-y border-border bg-surface px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="grid gap-2.5 sm:grid-cols-4">
          {award.id === 'president' ?  <PodiumSlot key={1} rank={1} points={3} participantId={first} onClear={() => clearSlot(1)} compact /> : slots.map(({ rank, id }) => (
            <PodiumSlot
              key={rank}
              rank={rank}
              points={rank === 1 ? 3 : rank === 2 ? 2 : 1}
              participantId={id}
              onClear={() => clearSlot(rank)}
              compact
            />
          ))}
        </div>
      </div>

      {/* Participants grid */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
        Участники ({award.id === 'president' ? PRESIDENT_PARTICIPANTS.length : PARTICIPANTS.length}) — кликай по очереди
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {award.id === 'president' ? shuffledPresidentParticipants.map((p) => {
          const rank =
            first === p.id ? 1 : second === p.id ? 2 : third === p.id ? 3 : 0;
          const isSelected = rank > 0;
          const c = isSelected ? RANK_COLORS[rank as 1 | 2 | 3] : null;
          return (
            <button
              key={p.id}
              onClick={() => pick(p.id)}
              className={`relative flex flex-col overflow-hidden rounded-2xl border bg-surface text-left transition ${
                isSelected
                  ? `${c!.border} border-2`
                  : "border-border hover:-translate-y-0.5 hover:border-border-strong"
              }`}
            >
              <div className="aspect-square w-full overflow-hidden">
                <NomineePhoto id={p.id} name={p.name} />
              </div>
               <div className="flex items-center justify-between px-3 py-2.5">
                <span className="truncate text-sm font-medium">{p.name}</span>
                {isSelected && (
                  <span
                    className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold text-btn-text ${c!.solid}`}
                  >
                    {rank}
                  </span>
                )}
              </div>
              {p.quote && (
                <div className="relative border-t border-border bg-surface-2/40 px-3 py-3">
                  <span className="absolute left-2 top-1 text-3xl font-serif leading-none text-gold/30 select-none">
                    “
                  </span>
                  <p className="pl-3 text-xs italic leading-relaxed text-muted">
                    {p.quote}
                  </p>
                </div>
              )}
            </button>
          );
        }) : shuffledParticipants.map((p) => {
          const rank =
            first === p.id ? 1 : second === p.id ? 2 : third === p.id ? 3 : 0;
          const isSelected = rank > 0;
          const c = isSelected ? RANK_COLORS[rank as 1 | 2 | 3] : null;
          return (
            <button
              key={p.id}
              onClick={() => pick(p.id)}
              className={`relative flex flex-col overflow-hidden rounded-2xl border bg-surface text-left transition ${
                isSelected
                  ? `${c!.border} border-2`
                  : "border-border hover:-translate-y-0.5 hover:border-border-strong"
              }`}
            >
              <div className="aspect-square w-full overflow-hidden">
                <NomineePhoto id={p.id} name={p.name} />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="truncate text-sm font-medium">{p.name}</span>
                {isSelected && (
                  <span
                    className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold text-btn-text ${c!.solid}`}
                  >
                    {rank}
                  </span>
                )}
              </div>
              {p.quote && (
                <div className="relative border-t border-border bg-surface-2/40 px-3 py-3">
                  <span className="absolute left-2 top-1 text-3xl font-serif leading-none text-gold/30 select-none">
                    “
                  </span>
                  <p className="pl-3 text-xs italic leading-relaxed text-muted">
                    {p.quote}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}

      <div className="sticky bottom-4 mt-8">
        <button
          onClick={handleSubmit}
          disabled={!allFilled || submitting}
          className={`w-full rounded-2xl px-6 py-4 text-base font-semibold transition ${
            allFilled && !submitting
              ? "bg-mint text-btn-text hover:opacity-90"
              : "border border-border bg-surface-2 text-muted"
          }`}
        >
          {submitting
            ? "Отправляем…"
            : allFilled
            ? "Отправить голос"
            : `Выбери ещё ${award.id === 'president' ? 1 - filledCount : 3 - filledCount}`}
        </button>
      </div>
    </div>
  );
}

function PodiumSlot({
  rank,
  points,
  participantId,
  onClear,
  compact,
}: {
  rank: number;
  points: number;
  participantId: string;
  onClear: () => void;
  compact?: boolean;
}) {
  const p = participantId ? getParticipant(participantId) : null;
  const c = RANK_COLORS[rank as 1 | 2 | 3];
  const size = compact ? "h-11 w-11" : "h-14 w-14";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-2 p-2.5 ${c.border} ${c.bg}`}
    >
      <div className={`relative ${size} flex-none overflow-hidden rounded-lg bg-surface-2`}>
        {p ? (
          <NomineePhoto id={p.id} name={p.name} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <Crown size={18} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${c.text}`}>
          <span>{rank} место</span>
          <span className="opacity-40">·</span>
          <span>{points} б.</span>
        </div>
        <div className="truncate text-sm font-semibold">
          {p ? p.name : "— не выбран —"}
        </div>
      </div>
      {p && (
        <button
          onClick={onClear}
          className="flex-none rounded-lg p-1 text-muted hover:bg-surface hover:text-text"
          aria-label="Сбросить"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function ResultsView({ onBack }: { onBack: () => void }) {
  const [results, setResults] = useState<Record<string, RankedResult[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<RankedResult[]>([]);

  useEffect(() => {
    fetchAllResults().then((r) => {
      setResults(r);
      setLoading(false);
    });
  }, []);

  async function toggle(awardId: string) {
    if (expanded === awardId) {
      setExpanded(null);
      return;
    }
    setExpanded(awardId);
    setExpandedData(results[awardId] ?? []);
    const fresh = await fetchResults(awardId);
    setExpandedData(fresh);
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-sm font-medium text-muted hover:text-text"
      >
        ← Все номинации
      </button>
      <h1 className="text-3xl font-bold tracking-tight">Результаты</h1>
      <p className="mt-2 text-muted">
        Подсчёт по баллам: 1 место — 3 балла, 2 — 2, 3 — 1. Нажми на номинацию,
        чтобы развернуть полный топ.
      </p>

      {loading ? (
        <div className="py-16 text-center text-muted">Загрузка…</div>
      ) : (
        <div className="mt-8 space-y-3">
          {AWARDS.map((award) => {
            const top = results[award.id] ?? [];
            const isOpen = expanded === award.id;
            const shown = isOpen ? expandedData : top.slice(0, 3);
            const voteCount = top.reduce(
              (a, r) => a + r.firsts + r.seconds + r.thirds,
              0
            );
            return (
              <div
                key={award.id}
                className="overflow-hidden rounded-2xl border border-border bg-surface backdrop-blur-xl"
              >
                <button
                  onClick={() => toggle(award.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-surface-2"
                >
                  <span className="font-semibold">{award.title}</span>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>
                      {voteCount > 0 ? `${voteCount} голосов` : "нет голосов"}
                    </span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {shown.length > 0 ? (
                  <div className="border-t border-border">
                    {shown.map((r, i) => (
                      <ResultRow key={r.participant} rank={i + 1} r={r} />
                    ))}
                    {!isOpen && top.length > 3 && (
                      <button
                        onClick={() => toggle(award.id)}
                        className="w-full px-5 py-2.5 text-sm font-medium text-sky hover:bg-surface-2"
                      >
                        Показать все {top.length} →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-border px-5 py-4 text-sm text-muted">
                    Пока никто не голосовал.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResultRow({ rank, r }: { rank: number; r: RankedResult }) {
  const p = getParticipant(r.participant);
  const c =
    rank === 1
      ? { ring: "ring-gold", badge: "bg-gold text-btn-text" }
      : rank === 2
      ? { ring: "ring-sky", badge: "bg-sky text-btn-text" }
      : rank === 3
      ? { ring: "ring-bronze", badge: "bg-bronze text-btn-text" }
      : { ring: "ring-transparent", badge: "bg-surface-2 text-muted" };
  const label =
    rank === 1 ? "1" : rank === 2 ? "2" : rank === 3 ? "3" : `${rank}`;

  return (
    <div className="flex items-center gap-4 border-b border-border px-5 py-3 last:border-b-0">
      <span
        className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg text-sm font-bold ${c.badge}`}
      >
        {label}
      </span>
      <div
        className={`h-11 w-11 flex-none overflow-hidden rounded-full ring-2 ${c.ring} bg-surface-2`}
      >
        {p && <NomineePhoto id={p.id} name={p.name} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{r.participant}</div>
        <div className="text-xs text-muted">
          <span className="text-gold">{r.firsts}</span>·
          <span className="text-sky">{r.seconds}</span>·
          <span className="text-bronze">{r.thirds}</span> (1-2-3 места)
        </div>
      </div>
      <span className="flex-none rounded-lg bg-surface-2 px-2.5 py-1 text-sm font-bold text-text">
        {r.points}
      </span>
    </div>
  );
}
