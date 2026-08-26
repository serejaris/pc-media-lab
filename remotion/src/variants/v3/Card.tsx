import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { tokens } from '../../tokens';
import { fontSans } from '../../fonts';

// v3 «Карусель кейсов с прогрессом».
// hook 0-60: badge + заголовок -> три полноэкранных кейса-слайда по 96 кадров
// (гигантский номер + фраза-результат, горизонтальный сдвиг ease-out) ->
// сборка 348-420: те же три кратко списком -> end-card 420-570 держится 5 секунд.
// Тонкая полоса прогресса всего ролика идёт по низу во всех секциях.

const SECTION_W = 1080;
const SHIFT = 22; // длительность горизонтального перехода между секциями

const CASE_AT = [60, 156, 252];
const SUMMARY_AT = 348;
const END_AT = 420;
const BOUNDS = [...CASE_AT, SUMMARY_AT, END_AT];

const BADGE_AT = 4;
const TITLE_AT = 10;

const TITLE_LINES = ['Собираем главный', 'отдел: папка,', 'контекст и правила'];

const CASES = [
  { num: '01', phrase: 'Заведёшь папку штаба' },
  { num: '02', phrase: 'Запишешь правила агента' },
  { num: '03', phrase: 'Проверишь агента в деле' },
];

const easeOut = Easing.out(Easing.cubic);

const u = (frame: number, from: number, dur: number) =>
  interpolate(frame, [from, from + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  });

// Позиция карусели в индексах секций: 0..5, на стыках — плавный сдвиг.
const shiftPos = (frame: number): number => {
  let pos = 0;
  BOUNDS.forEach((b, i) => {
    if (frame >= b + SHIFT) {
      pos = i + 1;
    } else if (frame > b) {
      pos = i + easeOut((frame - b) / SHIFT);
    }
  });
  return pos;
};

const HookSection: React.FC = () => {
  const frame = useCurrentFrame();
  const badgeT = u(frame, BADGE_AT, 20);
  const titleT = u(frame, TITLE_AT, 26);
  const lineT = u(frame, 26, 26);

  return (
    <div
      style={{
        width: SECTION_W,
        height: SECTION_W,
        flexShrink: 0,
        padding: '84px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontSize: 25,
          fontWeight: 500,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: tokens.accent,
          marginBottom: 36,
          opacity: badgeT,
          transform: `translateY(${14 * (1 - badgeT)}px)`,
        }}
      >
        Personal Corp · Сентябрь–ноябрь 2026 · Урок 1
      </div>

      <h1
        style={{
          fontSize: 80,
          lineHeight: 1.06,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: tokens.ink,
          whiteSpace: 'pre-line',
          margin: 0,
          opacity: titleT,
          transform: `translateY(${34 * (1 - titleT)}px)`,
        }}
      >
        {TITLE_LINES.join('\n')}
      </h1>

      <div
        style={{
          height: 3,
          width: `${lineT * 320}px`,
          background: tokens.accent,
          marginTop: 44,
        }}
      />
    </div>
  );
};

const CaseSlide: React.FC<{ num: string; phrase: string; at: number }> = ({
  num,
  phrase,
  at,
}) => {
  const frame = useCurrentFrame();
  const numT = u(frame, at + 2, 20);
  const lineT = u(frame, at + 18, 22);
  const phraseT = u(frame, at + 12, 28);

  return (
    <div
      style={{
        width: SECTION_W,
        height: SECTION_W,
        flexShrink: 0,
        padding: '84px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontSize: 430,
          lineHeight: 0.88,
          fontWeight: 500,
          letterSpacing: '-0.04em',
          color: tokens.accent,
          marginLeft: -8,
          opacity: numT,
          transform: `translateX(${-110 * (1 - numT)}px)`,
        }}
      >
        {num}
      </div>

      <div
        style={{
          height: 3,
          width: `${lineT * 180}px`,
          background: tokens.accent,
          marginTop: 34,
          marginBottom: 40,
        }}
      />

      <div
        style={{
          fontSize: 86,
          lineHeight: 1.12,
          fontWeight: 500,
          color: tokens.ink,
          maxWidth: 880,
          opacity: phraseT,
          transform: `translateY(${40 * (1 - phraseT)}px)`,
        }}
      >
        {phrase}
      </div>
    </div>
  );
};

const SummarySection: React.FC = () => {
  const frame = useCurrentFrame();
  const headT = u(frame, SUMMARY_AT + 2, 18);

  return (
    <div
      style={{
        width: SECTION_W,
        height: SECTION_W,
        flexShrink: 0,
        padding: '84px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: tokens.dim,
          marginBottom: 46,
          opacity: headT,
          transform: `translateX(${24 * (1 - headT)}px)`,
        }}
      >
        За час сделаешь
      </div>

      {CASES.map((c, i) => {
        const t = u(frame, SUMMARY_AT + 8 + i * 10, 22);
        return (
          <div
            key={c.num}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 30,
              paddingTop: i === 0 ? 0 : 30,
              paddingBottom: 30,
              borderBottom: i < 2 ? `2px solid ${tokens.surface}` : undefined,
              opacity: t,
              transform: `translateX(${50 * (1 - t)}px)`,
            }}
          >
            <div
              style={{
                fontSize: 30,
                fontWeight: 500,
                letterSpacing: '0.1em',
                color: tokens.accent,
                width: 76,
                flexShrink: 0,
              }}
            >
              {c.num}
            </div>
            <div style={{ fontSize: 42, fontWeight: 500, color: tokens.ink }}>
              {c.phrase}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const EndSection: React.FC = () => {
  const frame = useCurrentFrame();
  const t = u(frame, END_AT + 4, 26);

  return (
    <div
      style={{
        width: SECTION_W,
        height: SECTION_W,
        flexShrink: 0,
        padding: '84px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          background: tokens.accent,
          marginBottom: 38,
          opacity: t,
          transform: `translateY(${26 * (1 - t)}px)`,
        }}
      />
      <div
        style={{
          fontSize: 42,
          fontWeight: 500,
          color: tokens.ink,
          whiteSpace: 'nowrap',
          opacity: t,
          transform: `translateY(${26 * (1 - t)}px)`,
        }}
      >
        вторник 15 сентября · 19:00 МСК / 13:00 BA
      </div>
      <div
        style={{
          fontSize: 27,
          color: tokens.dim,
          marginTop: 20,
          opacity: t,
          transform: `translateY(${26 * (1 - t)}px)`,
        }}
      >
        Серёжа Рис · ссылка в посте
      </div>
    </div>
  );
};

export const V3Card: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 570], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: tokens.bg,
        fontFamily: fontSans,
        overflow: 'hidden',
      }}
    >
      {/* горизонтальная карусель секций */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: SECTION_W * 6,
            transform: `translateX(${-shiftPos(frame) * SECTION_W}px)`,
          }}
        >
          <HookSection />
          {CASES.map((c, i) => (
            <CaseSlide key={c.num} num={c.num} phrase={c.phrase} at={CASE_AT[i]} />
          ))}
          <SummarySection />
          <EndSection />
        </div>
      </AbsoluteFill>

      {/* полоса прогресса всего ролика */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 6,
          background: tokens.surface,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: tokens.accent,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
