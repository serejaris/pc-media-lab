import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Unbounded';
import { fontSans } from '../../fonts';

// v11 «Chrome / Y2K retro-futurism»: графитово-серебряный фон, хром-заголовок
// с медленным бликом (gradient text), дрейфующие пузырчатые формы с перламутровыми
// краями, вращающийся CD-глинт, кислотные sparkle-вспышки на переходах.
// Все анимации детерминированы от useCurrentFrame.

const { fontFamily: fontDisplay } = loadFont('normal', {
  weights: ['400', '500', '700'],
  subsets: ['latin', 'cyrillic'],
});

const P = {
  bgDeep: '#0a0c12',
  bgMid: '#12151f',
  bgHi: '#1a2030',
  ink: '#eef1f7',
  inkSoft: '#c6cdda',
  dim: '#8b94a7',
  silverLine: '#6f7c96',
  chromeShadow: 'rgba(159,196,255,0.28)',
  acid: '#c9f531',
};

const PASTELS = ['#cdeaff', '#ffd2ec', '#d9d0ff', '#c9f5d2'];

const BADGE_TEXT = 'PERSONAL CORP · СЕНТЯБРЬ–НОЯБРЬ 2026 · УРОК 1';
const TITLE_LINES = ['Собираем главный отдел:', 'папка, контекст и правила'];
const CASES = [
  'Заведёшь папку штаба и решишь, какой контекст в ней живёт',
  'Запишешь правила, по которым агент работает предсказуемо',
  'Проверишь агента на своей задаче',
];
const WHEN = 'вторник 15 сентября · 19:00 МСК / 13:00 BA';
const SHORT_TITLE = 'Собираем главный отдел';
const SIGNATURE = 'Серёжа Рис · ссылка в посте';

const SCHEDULE: Array<[string, string]> = [
  ['15.09', 'Папка и правила'],
  ['22.09', 'Отдел и пульс'],
  ['29.09', 'Входящий поток'],
  ['06.10', 'Скилл и запуск'],
  ['13.10', 'Runtime вне ноутбука'],
  ['20.10', 'Медиа-отдел'],
  ['27.10', 'Система, в которой живёшь'],
  ['03.11', 'AI-команда и совет'],
];

// Тайминг (30 fps): hook 0-100 -> кейсы 100-250 остаются -> контент тает 340-364 ->
// end-card входит 396-420 и держится статично до 570 (ровно 5 c после входа).
const BADGE_AT = 6;
const TITLE_AT = 14;
const RULE_AT = 58;
const CASE_START = 100;
const CASE_STEP = 50;
const CASE_DUR = 22;
const CONTENT_FADE_AT = 340;
const END_AT = 396;

const PAD_X = 84;
const PAD_TOP = 92;

// Металлический текст: серебряный градиент с резкими светотеневыми стопами,
// блик медленно плавает туда-обратно по глифам.
const chromeText = (frame: number): React.CSSProperties => ({
  backgroundImage:
    'linear-gradient(105deg, #ffffff 0%, #e2e8f2 14%, #a7b3c9 28%, #f4f7fb 42%, #ffffff 50%, #b4c0d4 62%, #74819b 74%, #d4dce9 86%, #ffffff 100%)',
  backgroundSize: '240% 100%',
  backgroundPositionX: `${50 + Math.sin(frame / 130) * 42}%`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
});

const chromeEase = Easing.out(Easing.cubic);

type SparkleDef = {
  at: number;
  life: number;
  x: number;
  y: number;
  size: number;
  color: string;
};

// Крупные вспышки ровно на переходах: заголовок, каждый кейс, вход end-card.
const FLASH_SPARKLES: SparkleDef[] = [
  { at: 24, life: 26, x: 964, y: 148, size: 38, color: '#ffffff' },
  { at: 40, life: 24, x: 908, y: 306, size: 24, color: '#ffd2ec' },
  { at: 52, life: 24, x: 74, y: 372, size: 26, color: '#cdeaff' },
  { at: CASE_START + 4, life: 22, x: 60, y: 378, size: 24, color: P.acid },
  { at: CASE_START + CASE_STEP + 4, life: 22, x: 72, y: 474, size: 22, color: '#ffffff' },
  { at: CASE_START + CASE_STEP * 2 + 4, life: 22, x: 62, y: 566, size: 26, color: '#d9d0ff' },
  { at: END_AT + 4, life: 28, x: 936, y: 232, size: 36, color: '#ffffff' },
  { at: END_AT + 16, life: 24, x: 116, y: 520, size: 24, color: P.acid },
  { at: END_AT + 28, life: 24, x: 986, y: 648, size: 26, color: '#cdeaff' },
];

// Мелкие фоновые звёзды: бесконечное мерцание с разными периодами.
const AMBIENT_STARS: Array<{
  x: number;
  y: number;
  size: number;
  period: number;
  phase: number;
  color: string;
}> = [
  { x: 208, y: 172, size: 13, period: 91, phase: 0.1, color: '#dfe6f2' },
  { x: 994, y: 428, size: 11, period: 83, phase: 0.5, color: '#ffd2ec' },
  { x: 338, y: 76, size: 9, period: 103, phase: 0.8, color: '#c9f531' },
  { x: 772, y: 128, size: 8, period: 97, phase: 0.3, color: '#cdeaff' },
  { x: 46, y: 668, size: 12, period: 113, phase: 0.6, color: '#dfe6f2' },
  { x: 1022, y: 760, size: 10, period: 89, phase: 0.2, color: '#d9d0ff' },
];

const STAR_PATH =
  'M50 0 C55 34 66 44 100 50 C66 56 55 66 50 100 C45 66 34 56 0 50 C34 44 45 34 50 0 Z';

const Sparkle: React.FC<{ def: SparkleDef }> = ({ def }) => {
  const frame = useCurrentFrame();
  const t = frame - def.at;
  if (t < 0 || t > def.life) {
    return null;
  }
  const p = t / def.life;
  const s = Math.sin(Math.PI * p);
  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        position: 'absolute',
        left: def.x - def.size / 2,
        top: def.y - def.size / 2,
        width: def.size,
        height: def.size,
        opacity: s,
        transform: `scale(${0.35 + 0.65 * s}) rotate(${p * 80}deg)`,
      }}
    >
      <path d={STAR_PATH} fill={def.color} />
    </svg>
  );
};

const AmbientStar: React.FC<{ def: (typeof AMBIENT_STARS)[number] }> = ({ def }) => {
  const frame = useCurrentFrame();
  const t = (Math.sin((frame / def.period + def.phase) * Math.PI * 2) + 1) / 2;
  const s = t * t;
  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        position: 'absolute',
        left: def.x - def.size / 2,
        top: def.y - def.size / 2,
        width: def.size,
        height: def.size,
        opacity: 0.12 + 0.4 * s,
        transform: `rotate(${frame * 0.08}deg) scale(${0.7 + 0.3 * s})`,
      }}
    >
      <path d={STAR_PATH} fill={def.color} />
    </svg>
  );
};

// Пузырчатая форма: мягкий перламутровый шар, живёт на периферии и не спорит с текстом.
const Bubble: React.FC<{
  cx: number;
  cy: number;
  r: number;
  seed: number;
  pastel: string;
  opacity: number;
}> = ({ cx, cy, r, seed, pastel, opacity }) => {
  const frame = useCurrentFrame();
  const dx = Math.sin(frame / 57 + seed) * 12;
  const dy = Math.cos(frame / 49 + seed * 1.7) * 10;
  const rot = frame * 0.12 + seed * 40;
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - r + dx,
        top: cy - r + dy,
        width: r * 2,
        height: r * 2,
        opacity,
        transform: `rotate(${rot}deg)`,
        borderRadius: '47% 53% 56% 44% / 52% 46% 54% 48%',
        background: `radial-gradient(circle at 33% 28%, rgba(255,255,255,0.9) 0%, ${pastel} 30%, rgba(110,124,152,0.28) 58%, rgba(13,16,24,0) 78%)`,
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    />
  );
};

// CD-диск: конический градиент с пастельными секторами + дорожки + блик, медленно крутится.
const Disc: React.FC<{ x: number; y: number; r: number }> = ({ x, y, r }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [24, 64], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: chromeEase,
  });
  const dim = interpolate(frame, [CONTENT_FADE_AT - 30, CONTENT_FADE_AT + 30], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (enter <= 0 || dim <= 0) {
    return null;
  }
  const op = enter * dim * 0.8;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        opacity: op,
        transform: `rotate(${frame * 0.45}deg)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'conic-gradient(#dfe6f2, #ffcfe9 40deg, #cdeaff 85deg, #d9d0ff 135deg, #eef2fa 185deg, #c9f5d2 235deg, #cdeaff 285deg, #e6ebf5 325deg, #dfe6f2 360deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'repeating-radial-gradient(circle at center, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1.5px, rgba(0,0,0,0) 1.5px, rgba(0,0,0,0) 4px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'linear-gradient(115deg, rgba(255,255,255,0) 32%, rgba(255,255,255,0.55) 47%, rgba(255,255,255,0) 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: r * 0.22,
          borderRadius: '50%',
          background: P.bgDeep,
          boxShadow: 'inset 0 0 22px rgba(0,0,0,0.75)',
        }}
      />
    </div>
  );
};

// Маленькая четырёхлучевая искра-буллет у кейсов, слегка мерцает.
const CaseMarker: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const colors = [P.acid, '#ffffff', '#d9d0ff'];
  const twinkle = 0.82 + 0.18 * Math.sin(frame / 17 + index * 2.1);
  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        width: 21,
        height: 21,
        flexShrink: 0,
        marginTop: 7,
        opacity: twinkle,
        transform: `rotate(${index * 24}deg) scale(${twinkle})`,
      }}
    >
      <path d={STAR_PATH} fill={colors[index % colors.length]} />
    </svg>
  );
};

export const V11Card: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgePop = spring({
    frame: frame - BADGE_AT,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 120 },
  });

  const titleSpring = spring({
    frame: frame - TITLE_AT,
    fps,
    config: { damping: 200, mass: 0.7 },
  });
  const titleShift = interpolate(titleSpring, [0, 1], [36, 0]);

  const ruleT = interpolate(frame, [RULE_AT, RULE_AT + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: chromeEase,
  });

  const fade = interpolate(frame, [CONTENT_FADE_AT, CONTENT_FADE_AT + 24], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const endT = interpolate(frame, [END_AT, END_AT + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: chromeEase,
  });
  const endShift = interpolate(endT, [0, 1], [26, 0]);
  const endRuleT = interpolate(frame, [END_AT + 6, END_AT + 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: chromeEase,
  });

  const bubbleFade = interpolate(
    frame,
    [CONTENT_FADE_AT - 10, CONTENT_FADE_AT + 40],
    [1, 0.45],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily: fontSans,
        background: `linear-gradient(180deg, ${P.bgHi} 0%, ${P.bgDeep} 52%, ${P.bgMid} 100%)`,
        overflow: 'hidden',
      }}
    >
      {/* Слой 0: пузыри, CD-диск, мерцающие звёзды */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Bubble cx={118} cy={206} r={148} seed={0.7} pastel={PASTELS[0]} opacity={0.62 * bubbleFade} />
        <Bubble cx={1002} cy={168} r={104} seed={2.3} pastel={PASTELS[1]} opacity={0.5 * bubbleFade} />
        <Bubble cx={132} cy={928} r={162} seed={4.1} pastel={PASTELS[2]} opacity={0.55 * bubbleFade} />
        <Bubble cx={792} cy={996} r={88} seed={5.6} pastel={PASTELS[0]} opacity={0.45 * bubbleFade} />
        <Bubble cx={948} cy={472} r={30} seed={1.4} pastel={PASTELS[1]} opacity={0.6 * bubbleFade} />
        <Bubble cx={1002} cy={540} r={17} seed={3.2} pastel={PASTELS[0]} opacity={0.6 * bubbleFade} />
        <Disc x={946} y={920} r={196} />
        {AMBIENT_STARS.map((def, i) => (
          <AmbientStar key={i} def={def} />
        ))}
        {FLASH_SPARKLES.map((def, i) => (
          <Sparkle key={`flash-${i}`} def={def} />
        ))}
      </div>

      {/* Мягкое свечение сверху для глубины металла */}
      <AbsoluteFill
        style={{
          zIndex: 1,
          background:
            'radial-gradient(ellipse at 30% 12%, rgba(159,196,255,0.10) 0%, rgba(159,196,255,0) 55%)',
        }}
      />

      {/* Основной контент: хук -> кейсы */}
      <AbsoluteFill style={{ zIndex: 2, opacity: fade }}>
        <div style={{ position: 'absolute', left: PAD_X, right: PAD_X, top: PAD_TOP }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 22px',
              borderRadius: 999,
              border: '1px solid rgba(238,241,247,0.22)',
              background: 'rgba(238,241,247,0.05)',
              opacity: badgePop,
              transform: `scale(${0.85 + 0.15 * badgePop}) translateY(${10 * (1 - badgePop)}px)`,
            }}
          >
            <svg viewBox="0 0 100 100" style={{ width: 13, height: 13 }}>
              <path d={STAR_PATH} fill={P.acid} />
            </svg>
            <span
              style={{
                fontFamily: fontDisplay,
                fontWeight: 400,
                fontSize: 17,
                letterSpacing: '0.18em',
                color: P.ink,
                whiteSpace: 'nowrap',
              }}
            >
              {BADGE_TEXT}
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              marginTop: 40,
              fontFamily: fontDisplay,
              fontWeight: 700,
              fontSize: 51,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              whiteSpace: 'pre-line',
              filter: `drop-shadow(0 3px 16px ${P.chromeShadow})`,
              opacity: titleSpring,
              transform: `translateY(${titleShift}px)`,
              ...chromeText(frame),
            }}
          >
            {TITLE_LINES.join('\n')}
          </h1>

          <div
            style={{
              height: 2,
              width: `${ruleT * 84}%`,
              marginTop: 30,
              marginBottom: 30,
              backgroundImage:
                `linear-gradient(90deg, ${P.silverLine}, #eef2f8 40%, #97a4bd 70%, rgba(111,124,150,0))`,
            }}
          />

          <div>
            {CASES.map((text, i) => {
              const at = CASE_START + i * CASE_STEP;
              const u = interpolate(frame, [at, at + CASE_DUR], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: chromeEase,
              });
              return (
                <div
                  key={text}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 18,
                    marginBottom: i < CASES.length - 1 ? 24 : 0,
                    maxWidth: 850,
                    opacity: u,
                    transform: `translateX(${44 * (1 - u)}px)`,
                  }}
                >
                  <CaseMarker index={i} />
                  <div style={{ fontSize: 27, lineHeight: 1.35, color: P.ink }}>{text}</div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>

      {/* End-card: когда, расписание потока, подпись */}
      <AbsoluteFill
        style={{
          zIndex: 3,
          justifyContent: 'center',
          padding: `0 ${PAD_X}px`,
          background:
            'linear-gradient(180deg, rgba(10,12,18,0.86) 0%, rgba(10,12,18,0.93) 100%)',
          opacity: endT,
        }}
      >
        <div style={{ transform: `translateY(${endShift}px)` }}>
          <div
            style={{
              fontFamily: fontDisplay,
              fontWeight: 700,
              fontSize: 43,
              lineHeight: 1.16,
              letterSpacing: '-0.01em',
              filter: `drop-shadow(0 3px 14px ${P.chromeShadow})`,
              ...chromeText(frame + 60),
            }}
          >
            {SHORT_TITLE}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 26 }}>
            <svg viewBox="0 0 100 100" style={{ width: 24, height: 24, flexShrink: 0 }}>
              <path d={STAR_PATH} fill={P.acid} />
            </svg>
            <div
              style={{
                fontFamily: fontDisplay,
                fontWeight: 500,
                fontSize: 26,
                color: P.ink,
                whiteSpace: 'nowrap',
              }}
            >
              {WHEN}
            </div>
          </div>

          <div
            style={{
              height: 2,
              marginTop: 34,
              marginBottom: 30,
              width: `${endRuleT * 100}%`,
              backgroundImage:
                `linear-gradient(90deg, ${P.silverLine}, #eef2f8 40%, #97a4bd 70%, rgba(111,124,150,0))`,
            }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 47fr) minmax(0, 53fr)',
              gridTemplateRows: 'repeat(4, auto)',
              gridAutoFlow: 'column',
              columnGap: 44,
              rowGap: 17,
              alignItems: 'baseline',
            }}
          >
            {SCHEDULE.map(([date, label], i) => {
              const nearest = i === 0;
              return (
                <div key={date} style={{ display: 'flex', alignItems: 'baseline', gap: 13 }}>
                  {nearest ? (
                    <svg
                      viewBox="0 0 100 100"
                      style={{ width: 13, height: 13, alignSelf: 'center', flexShrink: 0 }}
                    >
                      <path d={STAR_PATH} fill={P.acid} />
                    </svg>
                  ) : (
                    <span
                      style={{
                        alignSelf: 'center',
                        width: 13,
                        height: 2,
                        background: 'rgba(139,148,167,0.4)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 20,
                      lineHeight: 1.4,
                      whiteSpace: 'nowrap',
                      color: nearest ? P.ink : P.inkSoft,
                      fontWeight: nearest ? 600 : 400,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {date}
                    <span style={{ color: P.dim }}>{' · '}</span>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 20, color: P.dim, marginTop: 36 }}>{SIGNATURE}</div>
        </div>
      </AbsoluteFill>

      {/* Винетка поверх фона, под контентом — собирает взгляд к центру */}
      <AbsoluteFill
        style={{
          zIndex: 1,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 50% 44%, rgba(5,6,10,0) 52%, rgba(5,6,10,0.5) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
