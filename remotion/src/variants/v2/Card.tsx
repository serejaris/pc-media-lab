import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { fontSans } from '../../fonts';
import { tokens } from '../../tokens';

// v2 «Кинетическая типографика».
// Тайминг: тезисы 3×64 кадра (по ~2 c) -> свод 192..419 -> end-card 420..570 (ровно 5 c).
// Всё движение детерминировано от useCurrentFrame.

const SLOT = 64;
const SUM_START = SLOT * 3; // 192
const END_START = 420;

type ThesisEntry = 'rise' | 'tracking' | 'stretch';

const THESES: { lines: string[]; size: number; entry: ThesisEntry; barW: number }[] = [
  { lines: ['ПАПКА', 'ШТАБА'], size: 182, entry: 'rise', barW: 480 },
  { lines: ['КОНТЕКСТ'], size: 146, entry: 'tracking', barW: 430 },
  { lines: ['ПРАВИЛА'], size: 164, entry: 'stretch', barW: 400 },
];

const CASES = [
  'Заведёшь папку штаба',
  'Запишешь правила агента',
  'Проверишь агента в деле',
];

const clampOpts = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

// ---------- Шапка ----------

const Header: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [2, 22], [0, 1], clampOpts);
  return (
    <div
      style={{
        position: 'absolute',
        top: 62,
        left: 78,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        opacity,
      }}
    >
      <div style={{ width: 10, height: 10, background: tokens.accent }} />
      <div
        style={{
          fontSize: 23,
          fontWeight: 500,
          letterSpacing: '0.26em',
          color: tokens.dim,
          textTransform: 'uppercase',
        }}
      >
        PERSONAL CORP · СЕНТЯБРЬ–НОЯБРЬ 2026
      </div>
    </div>
  );
};

// ---------- Прогресс тезисов ----------

const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= SUM_START) return null;
  const idx = Math.min(2, Math.floor(frame / SLOT));
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 76,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        opacity: interpolate(frame, [8, 20], [0, 1], clampOpts),
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: i === idx ? 58 : 42,
            height: 5,
            borderRadius: 3,
            background: i === idx ? tokens.accent : tokens.dim,
            opacity: i === idx ? 1 : 0.26,
          }}
        />
      ))}
    </div>
  );
};

// ---------- Тезис-слово ----------

const ThesisWord: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const th = THESES[index];
  const local = frame - index * SLOT;
  if (local < 0 || local > SLOT + 6) return null;

  // Scale-in с overshoot: пружина намеренно недодемпфирована.
  const pop = spring({
    frame: local,
    fps,
    config: { damping: 9, mass: 0.75, stiffness: 135 },
  });
  const settle = Math.min(pop, 1);

  const out = interpolate(local, [SLOT - 7, SLOT], [0, 1], {
    ...clampOpts,
    easing: Easing.in(Easing.cubic),
  });

  // Микро-движение у каждого слова своё.
  let dx = 0;
  let dy = 0;
  if (th.entry === 'rise') {
    dy = -local * 0.1;
    dx = Math.sin(local * 0.052) * 5;
  } else if (th.entry === 'tracking') {
    dx = local * 0.09;
    dy = Math.sin(local * 0.048 + 1.7) * 4;
  } else {
    dy = local * 0.075;
    dx = Math.sin(local * 0.045 + 3.6) * 5;
  }
  dx -= 14 * out * Math.sign(dx || 1);
  dy -= 22 * out;

  const entryScale = interpolate(pop, [0, 1], [0.86, 1]);
  const squashY =
    th.entry === 'stretch' ? interpolate(pop, [0, 1], [1.07, 1]) : 1;
  const tracking =
    th.entry === 'tracking'
      ? `${interpolate(settle, [0, 1], [0.13, -0.01])}em`
      : '-0.015em';

  const barIn = interpolate(local, [15, 33], [0, 1], {
    ...clampOpts,
    easing: Easing.out(Easing.cubic),
  });
  const barScale = barIn * (1 - out);
  const labelOpacity = interpolate(settle, [0.2, 1], [0, 0.9]) * (1 - out);

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        opacity: interpolate(settle, [0, 0.35], [0, 1]) * (1 - out),
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `translate(${dx}px, ${dy}px)`,
        }}
      >
        <div
          style={{
            fontSize: 25,
            fontWeight: 500,
            letterSpacing: '0.34em',
            color: tokens.dim,
            marginBottom: 30,
            opacity: labelOpacity,
          }}
        >
          {`0${index + 1}`}
        </div>
        <div
          style={{
            fontSize: th.size,
            lineHeight: 0.98,
            fontWeight: 500,
            color: tokens.ink,
            textAlign: 'center',
            whiteSpace: 'pre-line',
            letterSpacing: tracking,
            transform: `scale(${entryScale}, ${entryScale * squashY})`,
          }}
        >
          {th.lines.join('\n')}
        </div>
        <div
          style={{
            width: th.barW,
            height: 7,
            marginTop: 36,
            background: tokens.accent,
            transform: `scaleX(${barScale})`,
            borderRadius: 2,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------- Сводящий кадр ----------

const Summary: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < SUM_START) return null;
  const local = frame - SUM_START;

  const ent = spring({
    frame: local,
    fps,
    config: { damping: 200, mass: 0.55 },
  });
  const lift = interpolate(ent, [0, 1], [36, 0]);
  const out = interpolate(frame, [END_START - 2, END_START + 8], [0, 1], clampOpts);

  const titleBar = interpolate(local, [12, 32], [0, 1], {
    ...clampOpts,
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center' }}>
      <div
        style={{
          paddingLeft: 112,
          paddingRight: 112,
          paddingTop: 60,
          opacity: 1 - out,
          transform: `translateY(${lift - 24 * out}px)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 44,
              height: 6,
              background: tokens.accent,
              transform: `scaleX(${titleBar})`,
              transformOrigin: 'left center',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              fontSize: 25,
              fontWeight: 500,
              letterSpacing: '0.3em',
              color: tokens.dim,
              textTransform: 'uppercase',
              opacity: ent,
            }}
          >
            УРОК 1
          </div>
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 70,
            lineHeight: 1.08,
            fontWeight: 500,
            color: tokens.ink,
            whiteSpace: 'nowrap',
          }}
        >
          Собираем главный отдел
        </h1>

        <div style={{ marginTop: 52 }}>
          {CASES.map((c, i) => {
            const st = 20 + i * 13;
            const u = interpolate(local, [st, st + 21], [0, 1], {
              ...clampOpts,
              easing: Easing.out(Easing.cubic),
            });
            return (
              <div
                key={c}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 26,
                  marginTop: i === 0 ? 0 : 28,
                  opacity: u,
                  transform: `translateX(${38 * (1 - u)}px)`,
                }}
              >
                <span
                  style={{
                    fontSize: 25,
                    fontWeight: 500,
                    color: tokens.dim,
                    letterSpacing: '0.18em',
                    width: 44,
                  }}
                >
                  {`0${i + 1}`}
                </span>
                <span
                  style={{ width: 6, height: 40, background: tokens.accent, borderRadius: 2 }}
                />
                <span style={{ fontSize: 45, fontWeight: 500, color: tokens.ink }}>{c}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- End-card ----------

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < END_START) return null;
  const local = frame - END_START;

  const pop = spring({
    frame: local,
    fps,
    config: { damping: 12, mass: 0.85, stiffness: 110 },
  });
  const settle = Math.min(pop, 1);
  const breath = Math.sin(local * 0.032) * 3;
  const barScale = interpolate(settle, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        opacity: interpolate(settle, [0, 0.4], [0, 1]),
      }}
    >
      <div
        style={{
          background: tokens.surface,
          borderRadius: 10,
          padding: '86px 88px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `translateY(${interpolate(settle, [0, 1], [34, 0]) + breath}px) scale(${interpolate(
            pop,
            [0, 1],
            [0.96, 1],
          )})`,
        }}
      >
        <div
          style={{
            width: 84,
            height: 7,
            background: tokens.accent,
            borderRadius: 2,
            marginBottom: 52,
            transform: `scaleX(${barScale})`,
          }}
        />
        <div
          style={{
            fontSize: 72,
            fontWeight: 500,
            lineHeight: 1.16,
            color: tokens.ink,
            textAlign: 'center',
          }}
        >
          вторник 15 сентября
          <br />
          19:00 МСК / 13:00 BA
        </div>
        <div
          style={{
            marginTop: 54,
            fontSize: 31,
            fontWeight: 400,
            color: tokens.dim,
            letterSpacing: '0.02em',
          }}
        >
          Серёжа Рис · ссылка в посте
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Карточка ----------

export const KineticCard: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: tokens.bg,
        fontFamily: fontSans,
        overflow: 'hidden',
      }}
    >
      {THESES.map((_, i) => (
        <ThesisWord key={i} index={i} />
      ))}
      <Summary />
      <EndCard />
      <Progress />
      <Header />
    </AbsoluteFill>
  );
};
