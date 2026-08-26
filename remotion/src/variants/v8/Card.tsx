import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont as loadManrope } from '@remotion/google-fonts/Manrope';
import { loadFont as loadUnbounded } from '@remotion/google-fonts/Unbounded';

// v8 «Aurora / Glassmorphism».
// Направление вправе уйти от тёмной Factory-палитры: живой градиентный фон
// (aurora-пятна медленно дрейфуют, детерминированно от useCurrentFrame),
// контент лежит на frosted-glass панелях (backdrop-blur, тонкие светлые бордеры).
// Research и источники параметров — src/variants/v8/NOTES.md.

const { fontFamily: fontBody } = loadManrope('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'cyrillic'],
});

const { fontFamily: fontDisplay } = loadUnbounded('normal', {
  weights: ['400', '500', '600'],
  subsets: ['latin', 'cyrillic'],
});

const BADGE_TEXT = 'PERSONAL CORP · СЕНТЯБРЬ–НОЯБРЬ 2026 · УРОК 1';
const TITLE_LINES = ['Собираем главный отдел:', 'папка, контекст и правила'];
const SHORT_TITLE = 'Собираем главный отдел';
const CASES = [
  'Заведёшь папку штаба и решишь, какой контекст в ней живёт',
  'Запишешь правила, по которым агент работает предсказуемо',
  'Проверишь агента на своей задаче',
];
const WHEN = 'вторник 15 сентября · 19:00 МСК / 13:00 BA';
const SIGNATURE = 'Серёжа Рис · ссылка в посте';

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

const ACCENT = '#ffd47e';

// Тайминг (30 fps): aurora разгорается 0-40 -> бейдж 10+, заголовок 22-66 ->
// кейсы 104-230 остаются -> сцена кейсов гаснет 360-382 ->
// end-панель входит 388-414 и держится статично до 570 (= ровно 5 c).
const BADGE_AT = 10;
const TITLE_AT = 22;
const CASE_BASE = 104;
const CASE_STEP = 44;
const CASE_DUR = 32;
const FADE_OUT_AT = 360;
const FADE_OUT_DUR = 22;
const END_IN = 388;
const END_IN_DUR = 26;

// База: глубокое индиго; поверх — пятна aurora в режиме screen.
const BASE_BG =
  'linear-gradient(165deg, #191041 0%, #120d33 42%, #0b0a1f 100%)';
const VIGNETTE =
  'radial-gradient(circle at 50% 44%, rgba(8,6,24,0) 48%, rgba(7,5,20,0.55) 100%)';

type BlobDef = {
  color: string;
  cx: number;
  cy: number;
  r: number;
  ampX: number;
  ampY: number;
  cycle: number;
  phase: number;
  tilt: number;
  alpha: number;
};

// Циклы дрейфа намеренно разные (620-900 кадров): паттерн не повторяется.
const BLOBS: BlobDef[] = [
  { color: '#7c3aed', cx: 235, cy: 175, r: 470, ampX: 135, ampY: 95, cycle: 820, phase: 0.0, tilt: -14, alpha: 0.85 },
  { color: '#22d3ee', cx: 905, cy: 465, r: 430, ampX: 155, ampY: 115, cycle: 640, phase: 2.1, tilt: 12, alpha: 0.62 },
  { color: '#db2777', cx: 245, cy: 895, r: 450, ampX: 165, ampY: 85, cycle: 900, phase: 4.0, tilt: -9, alpha: 0.58 },
  { color: '#4f46e5', cx: 815, cy: 965, r: 410, ampX: 125, ampY: 105, cycle: 700, phase: 1.2, tilt: 16, alpha: 0.72 },
  { color: '#2dd4bf', cx: 560, cy: 265, r: 300, ampX: 145, ampY: 70, cycle: 560, phase: 5.1, tilt: -18, alpha: 0.4 },
];

const AuroraBlob: React.FC<{ def: BlobDef; index: number }> = ({ def, index }) => {
  const frame = useCurrentFrame();
  // Медленный majestный дрейф: полные периоды sin/cos, разные для X и Y.
  const wx = (2 * Math.PI * frame) / def.cycle + def.phase;
  const wy = (2 * Math.PI * frame) / (def.cycle * 1.31) + def.phase * 1.7;
  const x = def.cx + def.ampX * Math.sin(wx);
  const y = def.cy + def.ampY * Math.cos(wy);
  const scale = 1 + 0.07 * Math.sin(wx * 0.7 + index);
  const tilt = def.tilt * Math.sin(wx * 0.5);

  return (
    <div
      style={{
        position: 'absolute',
        left: x - def.r,
        top: y - def.r,
        width: def.r * 2,
        height: def.r * 2,
        borderRadius: '46%',
        background: `radial-gradient(circle, ${def.color} 12%, transparent 62%)`,
        opacity: def.alpha,
        mixBlendMode: 'screen',
        filter: 'blur(58px)',
        transform: `translate(0px, 0px) rotate(${tilt}deg) scale(${scale})`,
      }}
    />
  );
};

const glassStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.09)',
  border: '1px solid rgba(255, 255, 255, 0.22)',
  borderRadius: 30,
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  boxShadow:
    'inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 22px 60px rgba(9, 6, 28, 0.38)',
};

const BadgePill: React.FC<{ t: number }> = ({ t }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '13px 26px',
      borderRadius: 999,
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.24)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      opacity: t,
      transform: `translateY(${14 * (1 - t)}px)`,
    }}
  >
    <span
      style={{
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: '0.16em',
        color: 'rgba(255, 255, 255, 0.85)',
        whiteSpace: 'nowrap',
      }}
    >
      {BADGE_TEXT}
    </span>
  </div>
);

const CaseRow: React.FC<{ text: string; index: number }> = ({ text, index }) => {
  const frame = useCurrentFrame();
  const at = CASE_BASE + index * CASE_STEP;
  const u = interpolate(frame, [at, at + CASE_DUR], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        padding: '22px 30px',
        ...glassStyle,
        borderRadius: 22,
        opacity: u,
        transform: `translateY(${34 * (1 - u)}px)`,
      }}
    >
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: ACCENT,
          boxShadow: '0 0 16px rgba(255, 212, 126, 0.65)',
          flexShrink: 0,
        }}
      />
      <div
        style={{
          fontSize: 26,
          fontWeight: 500,
          lineHeight: 1.32,
          color: 'rgba(255, 255, 255, 0.94)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

const ScheduleRow: React.FC<{ item: string; nearest: boolean }> = ({
  item,
  nearest,
}) => {
  const sep = item.indexOf(' · ');
  const date = item.slice(0, sep);
  const label = item.slice(sep + 3);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
      {nearest ? (
        <span
          style={{
            width: 7,
            height: 24,
            borderRadius: 3,
            background: ACCENT,
            boxShadow: '0 0 14px rgba(255, 212, 126, 0.6)',
            flexShrink: 0,
          }}
        />
      ) : null}
      <span
        style={{
          fontSize: 21,
          fontWeight: nearest ? 800 : 600,
          fontVariantNumeric: 'tabular-nums',
          color: nearest ? ACCENT : 'rgba(255, 255, 255, 0.92)',
          whiteSpace: 'nowrap',
        }}
      >
        {date}
      </span>
      <span
        style={{
          fontSize: 21,
          fontWeight: 400,
          color: nearest ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.62)',
          whiteSpace: 'nowrap',
        }}
      >
        {'· '}
        {label}
      </span>
    </div>
  );
};

export const V8Card: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Aurora разгорается мягко за первые ~1.3 c.
  const auroraIntro = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  const badgeT = interpolate(frame, [BADGE_AT, BADGE_AT + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const titleSpring = spring({
    frame: frame - TITLE_AT,
    fps,
    config: { damping: 200, mass: 0.7 },
  });
  const titleShift = interpolate(titleSpring, [0, 1], [34, 0]);
  const ruleT = interpolate(frame, [TITLE_AT + 26, TITLE_AT + 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Сцена с кейсами гаснет перед end-card.
  const sceneFade = interpolate(frame, [FADE_OUT_AT, FADE_OUT_AT + FADE_OUT_DUR], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const sceneRise = interpolate(sceneFade, [0, 1], [-18, 0]);

  const endT = interpolate(frame, [END_IN, END_IN + END_IN_DUR], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const endShift = interpolate(endT, [0, 1], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        background: BASE_BG,
        fontFamily: fontBody,
        overflow: 'hidden',
      }}
    >
      {/* Фон-слой: дрейфующие пятна aurora + виньетка */}
      <AbsoluteFill style={{ opacity: auroraIntro }}>
        {BLOBS.map((def, i) => (
          <AuroraBlob key={def.color} def={def} index={i} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: VIGNETTE }} />

      {/* Хук: стеклянная панель с бейджем и заголовком, ниже — кейсы */}
      <AbsoluteFill
        style={{
          zIndex: 2,
          opacity: sceneFade,
          transform: `translateY(${sceneRise}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 84,
            right: 84,
            top: 168,
            padding: '46px 52px 50px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            ...glassStyle,
          }}
        >
          <div style={{ marginBottom: 32 }}>
            <BadgePill t={badgeT} />
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: fontDisplay,
              fontSize: 44,
              fontWeight: 500,
              lineHeight: 1.24,
              letterSpacing: '-0.01em',
              color: '#ffffff',
              opacity: titleSpring,
              transform: `translateY(${titleShift}px)`,
              textShadow: '0 4px 30px rgba(10, 6, 34, 0.5)',
            }}
          >
            {TITLE_LINES.join('\n')}
          </h1>
          <div
            style={{
              marginTop: 30,
              height: 2,
              width: `${ruleT * 180}px`,
              borderRadius: 1,
              background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${ACCENT} 50%, rgba(255,255,255,0) 100%)`,
              opacity: ruleT,
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 96,
            right: 96,
            top: 536,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {CASES.map((text, i) => (
            <CaseRow key={text} text={text} index={i} />
          ))}
        </div>
      </AbsoluteFill>

      {/* End-card: стеклянная панель со расписанием потока */}
      <AbsoluteFill
        style={{
          zIndex: 3,
          padding: '0 84px',
          justifyContent: 'center',
          opacity: endT,
        }}
      >
        <div
          style={{
            ...glassStyle,
            minHeight: 700,
            padding: '56px 58px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            transform: `translateY(${endShift}px)`,
          }}
        >
          <div
            style={{
              fontFamily: fontDisplay,
              fontSize: 42,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: '#ffffff',
            }}
          >
            {SHORT_TITLE}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: ACCENT,
                boxShadow: '0 0 16px rgba(255, 212, 126, 0.65)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: '#ffffff',
                whiteSpace: 'nowrap',
              }}
            >
              {WHEN}
            </span>
          </div>
          <div
            style={{
              marginTop: 34,
              marginBottom: 30,
              height: 1,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.06) 100%)',
            }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 47fr) minmax(0, 53fr)',
              gridTemplateRows: 'repeat(4, auto)',
              gridAutoFlow: 'column',
              columnGap: 44,
              rowGap: 19,
              alignItems: 'baseline',
            }}
          >
            {SCHEDULE.map((item, i) => (
              <ScheduleRow key={item} item={item} nearest={i === 0} />
            ))}
          </div>
          <div
            style={{
              marginTop: 36,
              fontSize: 21,
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.62)',
            }}
          >
            {SIGNATURE}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
