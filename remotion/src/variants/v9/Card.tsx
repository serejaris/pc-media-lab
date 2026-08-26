import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Manrope';
import { loadFont as loadJetBrains } from '@remotion/google-fonts/JetBrainsMono';

// v9 «Bento grid»: светлые модульные ячейки по рецепту bento-grid 2025–2026 —
// единый зазор и радиус, якорная ячейка крупнее поддерживающих, статистика как
// «одна метрика + подпись», вход ячеек stagger'ом (fade + scale на ease-out).
// Хук: бейдж-бар, якорь-заголовок, три кейс-колонки с номерами, пара снизу
// (акцентная дата + счётчик вторников). End-card перестраивает сетку:
// хук уезжает обратным stagger'ом, входят when-ячейка, расписание и подпись;
// бейдж-бар сохраняется как якорь кадра. Палитра: near-white фон, чёрный текст,
// один сочный акцент #EE6018 в дата-ячейках. См. NOTES.md с источниками.

const { fontFamily: fontSans } = loadFont('normal', {
  weights: ['500', '700', '800'],
  subsets: ['latin', 'cyrillic'],
});

const { fontFamily: fontMono } = loadJetBrains('normal', {
  weights: ['400', '500'],
  subsets: ['latin', 'cyrillic'],
});

const T = {
  bg: '#F2F0EB',
  cell: '#FFFFFF',
  ink: '#14120F',
  dim: '#79736A',
  accent: '#EE6018',
  hairline: 'rgba(20, 18, 15, 0.08)',
  shadow: '0 1px 0 rgba(20,18,15,0.03), 0 14px 34px rgba(20,18,15,0.07)',
};

const BADGE_TEXT = 'PERSONAL CORP · СЕНТЯБРЬ–НОЯБРЬ 2026 · УРОК 1';
const TITLE_LINES = 'Собираем главный отдел:\nпапка, контекст и правила';
const CASES = [
  'Заведёшь папку штаба и решишь, какой контекст в ней живёт',
  'Запишешь правила, по которым агент работает предсказуемо',
  'Проверишь агента на своей задаче',
];
const SHORT_DATE = '15.09';
const SHORT_DATE_LINE = 'вторник · 19:00 МСК / 13:00 BA';
const WEEKS_COUNT = '8';
const WEEKS_CAPTION = 'вторников · 19:00 МСК';
const WHEN_MAIN = 'вторник 15 сентября';
const WHEN_SUB = '19:00 МСК / 13:00 BA';
const SCHEDULE = [
  '15.09 · Папка и правила',
  '22.09 · Отдел и пульс',
  '29.09 · Входящий поток',
  '06.10 · Скилл и запуск',
  '13.10 · Runtime вне ноутбука',
  '20.10 · Медиа-отдел',
  '27.10 · Система, в которой живёшь',
  '03.11 · AI-команда и совет',
];
const SIGNATURE = 'Серёжа Рис · ссылка в посте';

// Геометрия: кадр 1080×1080, поле сетки 968×968 (внешний паддинг 56),
// единый зазор 22 и радиус ячеек 28 во всей сетке.
const FP = 56;
const GAP = 22;
const R = 28;
const IN_W = 1080 - FP * 2;

type Box = { x: number; y: number; w: number; h: number };

const HOOK_BADGE: Box = { x: 0, y: 0, w: IN_W, h: 72 };
const HOOK_TITLE: Box = { x: 0, y: HOOK_BADGE.y + HOOK_BADGE.h + GAP, w: IN_W, h: 306 };
const CASE_Y = HOOK_TITLE.y + HOOK_TITLE.h + GAP;
const CASE_H = 330;
const CASE_W = Math.round((IN_W - GAP * 2) / 3);
const HOOK_CASES: Box[] = [0, 1, 2].map((i) => ({
  x: i * (CASE_W + GAP),
  y: CASE_Y,
  w: CASE_W,
  h: CASE_H,
}));
const LOW_Y = CASE_Y + CASE_H + GAP;
const LOW_H = IN_W - LOW_Y;
const HOOK_DATE: Box = { x: 0, y: LOW_Y, w: 520, h: LOW_H };
const HOOK_COUNT: Box = { x: HOOK_DATE.w + GAP, y: LOW_Y, w: IN_W - 520 - GAP, h: LOW_H };

const END_WHEN: Box = { x: 0, y: 94, w: IN_W, h: 290 };
const END_SCHED: Box = { x: 0, y: 406, w: IN_W, h: 456 };
const END_SIGN: Box = { x: 0, y: 884, w: IN_W, h: 84 };

// Тайминг (30 fps): stagger-вход хука f4–70, чтение до f356, обратный
// stagger-выход f356–397, сборка end-card f400–455, статичный холд до 570.
const AT = {
  badge: 4,
  title: 11,
  date: 18,
  cases: [25, 31, 37],
  count: 44,
};
const OUT = {
  cases: [366, 361, 356],
  count: 371,
  date: 376,
  title: 381,
  dur: 16,
};
const END_IN = { when: 400, schedCell: 406, schedRows: 410, sign: 418 };

// Вход ячейки: fade + scale 0.93→1 + лёгкий подъём (ease-out spring).
const useEnter = (at: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - at,
    fps,
    config: { damping: 24, mass: 0.8, stiffness: 150 },
  });
  const opacity = Math.max(0, Math.min(1, s * 1.3));
  return {
    opacity,
    transform: `translateY(${26 * (1 - s)}px) scale(${0.93 + 0.07 * s})`,
  };
};

// Выход ячейки: быстрый fade + небольшое смещение вверх (обратный stagger).
const useExit = (at: number) => {
  const frame = useCurrentFrame();
  const u = interpolate(frame, [at, at + OUT.dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  return {
    opacity: 1 - u,
    transform: `translateY(${-18 * u}px) scale(${1 - 0.04 * u})`,
  };
};

const Cell: React.FC<{
  box: Box;
  style?: React.CSSProperties;
  animStyle: React.CSSProperties;
  children: React.ReactNode;
}> = ({ box, style, animStyle, children }) => (
  <div
    style={{
      position: 'absolute',
      left: FP + box.x,
      top: FP + box.y,
      width: box.w,
      height: box.h,
      borderRadius: R,
      overflow: 'hidden',
      ...animStyle,
      ...style,
    }}
  >
    {children}
  </div>
);

const baseCell: React.CSSProperties = {
  background: T.cell,
  border: `1px solid ${T.hairline}`,
  boxShadow: T.shadow,
};

const BadgeBar: React.FC = () => {
  const enter = useEnter(AT.badge);
  return (
    <Cell box={HOOK_BADGE} animStyle={enter} style={{ ...baseCell }}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 40,
          fontFamily: fontMono,
          fontSize: 21,
          fontWeight: 500,
          letterSpacing: '0.16em',
          color: T.accent,
          whiteSpace: 'nowrap',
        }}
      >
        {BADGE_TEXT}
      </div>
    </Cell>
  );
};

const TitleCell: React.FC = () => {
  const enter = useEnter(AT.title);
  const exit = useExit(OUT.title);
  return (
    <Cell
      box={HOOK_TITLE}
      animStyle={{ ...enter, ...(exit.opacity < 1 ? exit : {}) }}
      style={{ ...baseCell }}
    >
      <h1
        style={{
          margin: 0,
          padding: '0 52px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          fontSize: 62,
          lineHeight: 1.12,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: T.ink,
          whiteSpace: 'pre-line',
        }}
      >
        {TITLE_LINES}
      </h1>
    </Cell>
  );
};

const CaseCell: React.FC<{ index: number }> = ({ index }) => {
  const enter = useEnter(AT.cases[index]);
  const exit = useExit(OUT.cases[index]);
  return (
    <Cell
      box={HOOK_CASES[index]}
      animStyle={{ ...enter, ...(exit.opacity < 1 ? exit : {}) }}
      style={{ ...baseCell }}
    >
      <div
        style={{
          height: '100%',
          padding: '34px 34px 30px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 22,
          }}
        >
          <span
            style={{
              fontFamily: fontMono,
              fontSize: 23,
              fontWeight: 500,
              color: T.accent,
              letterSpacing: '0.04em',
            }}
          >
            {`0${index + 1}`}
          </span>
          <span style={{ flex: 1, height: 1, background: T.hairline }} />
        </div>
        <div
          style={{
            fontSize: 25,
            lineHeight: 1.42,
            fontWeight: 500,
            color: T.ink,
          }}
        >
          {CASES[index]}
        </div>
      </div>
    </Cell>
  );
};

const DateCell: React.FC = () => {
  const enter = useEnter(AT.date);
  const exit = useExit(OUT.date);
  return (
    <Cell
      box={HOOK_DATE}
      animStyle={{ ...enter, ...(exit.opacity < 1 ? exit : {}) }}
      style={{ background: T.accent }}
    >
      <div
        style={{
          height: '100%',
          padding: '0 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 54,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            fontVariantNumeric: 'tabular-nums',
            marginBottom: 14,
          }}
        >
          {SHORT_DATE}
        </div>
        <div style={{ fontSize: 23, fontWeight: 700, opacity: 0.95 }}>
          {SHORT_DATE_LINE}
        </div>
      </div>
    </Cell>
  );
};

const CountCell: React.FC = () => {
  const enter = useEnter(AT.count);
  const exit = useExit(OUT.count);
  return (
    <Cell
      box={HOOK_COUNT}
      animStyle={{ ...enter, ...(exit.opacity < 1 ? exit : {}) }}
      style={{ ...baseCell }}
    >
      <div
        style={{
          height: '100%',
          padding: '0 44px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 22,
          color: T.ink,
        }}
      >
        <span style={{ fontSize: 84, fontWeight: 800, letterSpacing: '-0.03em' }}>
          {WEEKS_COUNT}
        </span>
        <span
          style={{
            fontFamily: fontMono,
            fontSize: 19,
            fontWeight: 400,
            color: T.dim,
          }}
        >
          {WEEKS_CAPTION}
        </span>
      </div>
    </Cell>
  );
};

const WhenCell: React.FC = () => {
  const enter = useEnter(END_IN.when);
  return (
    <Cell box={END_WHEN} animStyle={enter} style={{ background: T.accent }}>
      <div
        style={{
          height: '100%',
          padding: '0 52px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: '#FFFFFF',
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {WHEN_MAIN}
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: fontMono,
            fontSize: 34,
            fontWeight: 500,
            opacity: 0.95,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {WHEN_SUB}
        </div>
      </div>
    </Cell>
  );
};

const ScheduleCell: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = useEnter(END_IN.schedCell);

  return (
    <Cell box={END_SCHED} animStyle={enter} style={{ ...baseCell }}>
      <div
        style={{
          height: '100%',
          padding: '46px 52px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: `repeat(${SCHEDULE.length / 2}, auto)`,
          gridAutoFlow: 'column',
          columnGap: 44,
          rowGap: 42,
          alignContent: 'center',
        }}
      >
        {SCHEDULE.map((item, i) => {
          // Микростаггер строк после входа самой ячейки — сетка «достраивается».
          const rs = spring({
            frame: frame - (END_IN.schedRows + i * 2),
            fps,
            config: { damping: 200, mass: 0.5 },
          });
          const sep = item.indexOf(' · ');
          const date = item.slice(0, sep);
          const label = item.slice(sep + 3);
          const nearest = i === 0;
          return (
            <div
              key={item}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                opacity: rs,
                transform: `translateY(${10 * (1 - rs)}px)`,
              }}
            >
              {nearest ? (
                <span
                  style={{
                    alignSelf: 'center',
                    width: 7,
                    height: 28,
                    borderRadius: 3,
                    background: T.accent,
                    flexShrink: 0,
                  }}
                />
              ) : null}
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: 26,
                  fontWeight: nearest ? 500 : 400,
                  color: nearest ? T.ink : T.dim,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: nearest ? T.accent : undefined }}>{date}</span>
                {'  '}
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </Cell>
  );
};

const SignCell: React.FC = () => {
  const enter = useEnter(END_IN.sign);
  return (
    <Cell box={END_SIGN} animStyle={enter} style={{ ...baseCell }}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 52,
          fontFamily: fontMono,
          fontSize: 22,
          color: T.dim,
        }}
      >
        {SIGNATURE}
      </div>
    </Cell>
  );
};

export const V9Card: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: T.bg, fontFamily: fontSans, overflow: 'hidden' }}>
      {/* End-card: перестроенная сетка под расписание */}
      <AbsoluteFill>
        <WhenCell />
        <ScheduleCell />
        <SignCell />
      </AbsoluteFill>

      {/* Хук: бенто-сетка урока */}
      <AbsoluteFill>
        <BadgeBar />
        <TitleCell />
        {CASES.map((_, i) => (
          <CaseCell key={i} index={i} />
        ))}
        <DateCell />
        <CountCell />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
