export type Participant = {
  id: string;
  name: string;
  photo?: string;
  quote?: string;
};

export type Award = {
  id: string;
  title: string;
  description?: string;
};

export const PARTICIPANTS: Participant[] = [
  { id: "ainur", name: "Айнур",                 quote: "Неправильный не я.... неправильный весь этот мир." },
  { id: "sasha", name: "Саша",                  quote: "ХОЧУ ХАПАНУТЬ премию" },
  { id: "timur", name: "Тимур",                 quote: "как это связано с реал ми мадрид???" },
  { id: "bulat", name: "Булат",                 quote: "эщкере" },
  { id: "evgeny", name: "Евгений",              quote: "ген животного" },
  { id: "ruslan_z", name: "Руслан Закиров",     quote: "икефешнулся в туалете"},
  { id: "lekha", name: "Леха",                  quote: "Когда Бог создавал Доту, он оставил один слот для себя. Но потом увидел мою игру и уступил его мне" },
  { id: "dima_bushuev", name: "Дима Бушуев",    quote: "Хуй с горы" },
  { id: "kolyan", name: "Колян",                quote: "Ревновал жутко, но ничего не мог сделать. Но зато напротив ее окна была футбольная площадка. Не могу сказать, что я хороший футболист. Но когда она смотрела, я играл, как Пеле и кричал: «Дайте мне мячик! Я ударю! Вот он я, здесь!» и бил. А когда она исчезала в окне, у меня ноги не ходили! Вот что такое любовь.." },
  { id: "ilnar", name: "Ильнар",                quote: "Я не проиграл, я просто нашёл ещё один способ не выиграть." },
  { id: "ivan", name: "Иван",                   quote: "heronwater" },
  { id: "ruslan_n", name: "Руслан Назмутдинов", quote: "Оставь надежду всяк входящий" },
  { id: "dima_dyagilev", name: "Дима Дягилев",  quote: "Болит голеностоп"  },
  { id: "dima_bazanov", name: "Дима Базанов",   quote: "В жопу пидору колготки" },
  { id: "vlad", name: "Влад",                   quote: "Всем хай" },
  { id: "rail", name: "Раиль",                  quote: 'Прикинь, я победил...' },
  { id: "dinar", name: "Динар",                 quote: "коч галдан" },
  { id: "vadim", name: "Вадим",                 quote: "Кто пчёлок уважает, тот к ним не пристаёт" },
];

export const PRESIDENT_PARTICIPANTS: Participant[] = [
  { id: "ruslan_z", name: "Руслан Закиров",   quote: "икефешнулся в туалете"},
  { id: "dinar", name: "Динар",               quote: "коч галдан" }
]

export const AWARDS: Award[] = [
  { id: "president", title: "Президент года (Динар/Руслан)", description: "Какой президент был самым лучшим в этом году?" },
  { id: "stuffy", title: "Самый душный человек года", description: "Кого временами хочется замутить в реальной жизни из-за духоты?" },
  { id: "goodguy", title: "Добряк года", description: "Самый добрый добряк беседы лучших" },
  { id: "active", title: "Самый активный участник", description: "Кто сделал больше всего контента в беседе?" },
  { id: "excuses", title: "Король отмазок года", description: "Выбери того, кто в споре изворачивается как уж на сковороде." },
  { id: "poor", title: "Бедолага года", description: "Кто претерпел самое неприятное и обидное событие в этом году?" },
  { id: "normis", title: "Нормис года", description: "...." },
  { id: "drinker", title: "Алкаш года", description: "Главный алкоголик беседы, пьет и не пьянеет." },
  { id: "adequate", title: "Самый адекватный человек", description: "Этого человека можно посылать на переговоры от беседы лучших и не переживать." },
  { id: "lucky", title: "Везунчик года", description: "Самый везучий хрен в этом году" },
  { id: "afk", title: "АФК года", description: "Выбери того, про кого даже не уверен, что он еще читает беседу..." },
  { id: "mvp_martinas", title: "MVP Мартинас капа", description: "Самый ценный игрок на Мартинас капе" },
  { id: "mvp_dota", title: "MVP луза в доте", description: "Кто больше всех влияет на поражение?" },
  { id: "khachik", title: "Хачик года", description: "Самый нерусский человек в этом году" },
  { id: "khachik", title: "Камбэк года", description: "Никто его не ждал, а он вернулся" },
  { id: "worker", title: "Главный работник года", description: "Самый главный работяга в беседе. Дайте ему уже выходной.." },
  { id: "mvp_conversation", title: "MVP беседы года", description: "Самый клевый четкий поцык беседы лучших MVP" },
];

export function getParticipant(id: string): Participant | undefined {
  return PARTICIPANTS.find((p) => p.id === id);
}

export function getAward(id: string): Award | undefined {
  return AWARDS.find((a) => a.id === id);
}
