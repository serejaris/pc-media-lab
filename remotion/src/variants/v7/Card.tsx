import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Unbounded';
import { loadFont as loadInterExtra } from '@remotion/google-fonts/Inter';
import { fontSans } from '../../fonts';

// v7 «Neo-Brutalism» — плашечный постер: кремовый фон, чёрные рамки 4px,
// жёсткие offset-тени без blur, постерный стек строк Unbounded, плоские цветные плашки.
// Никаких градиентов и размытий; движения резкие: элемент пружиной приземляется
// на собственную тень с перелётом. Кейсы остаются до end-card; hold end-card ~5 c.

const { fontFamily: fontDisplay } = loadFont('normal', {
  weights: ['700', '800', '900'],
  subsets: ['latin', 'cyrillic'],
});
// Регистрируем 700 для Inter: в общих fonts.ts только 400/500.
loadInterExtra('normal', { weights: ['700'], subsets: ['latin', 'cyrillic'] });

const C = {
  paper: '#F2ECDD',
  ink: '#101010',
  white: '#FFFDF6',
  orange: '#EE6018',
  yellow: '#FFC900',
  dim: '#6A6154',
};

const BADGE_TEXT = 'PERSONAL CORP · СЕНТЯБРЬ–НОЯБРЬ 2026 · УРОК 1';
const TITLE_LINES = ['СОБИРАЕМ', 'ГЛАВНЫЙ ОТДЕЛ:'];
const SUBTITLE = 'папка, контекст и правила';
const CASES = [
  'Заведёшь папку штаба и решишь, какой контекст в ней живёт',
  'Запишешь правила, по которым агент работает предсказуемо',
  'Проверишь агента на своей задаче',
];
const SHORT_TITLE_LINES = ['СОБИРАЕМ', 'ГЛАВНЫЙ ОТДЕЛ'];
const WHEN = 'вторник 15 сентября · 19:00 МСК / 13:00 BA';
const SIGNATURE = 'Серёжа Рис · ссылка в посте';

const SCHEDULE = [
  { d: '15.09', t: 'Папка и правила' },
  { d: '22.09', t: 'Отдел и пульс' },
  { d: '29.09', t: 'Входящий поток' },
  { d: '06.10', t: 'Скилл и запуск' },
  { d: '13.10', t: 'Runtime вне ноутбука' },
  { d: '20.10', t: 'Медиа-отдел' },
  { d: '27.10', t: 'Система, в которой живёшь' },
  { d: '03.11', t: 'AI-команда и совет' },
];

// Тайминг (30 fps, 570 кадров): hook 0-90 -> кейсы слэммятся с 96 и остаются ->
// контент уезжает влево с 352 -> end-card въезжает справа с 360 и держится ~5 c.
const BADGE_AT = 6;
const T1_AT = 16;
const T2_AT = 28;
const SUB_AT = 46;
const CASE_START = 96;
const CASE_STEP = 42;
const EXIT_AT = 352;
const EXIT_DUR = 20;
const END_AT = 360;

const PAD_X = 64;

// Резкий приземляющийся блок: тень стоит на месте, плашка падает на неё сверху
// с небольшим перелётом (spring без сильного демпфирования). До кадра at скрыт.
const Slam: React.FC<{
  at: number;
  fromX?: number;
  fromY?: number;
  off?: number;
  shadow?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ at, fromX = 0, fromY = -54, off = 8, shadow = C.ink, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - at,
    fps,
    config: { damping: 15, mass: 0.75, stiffness: 165 },
  });
  const on = frame >= at ? 1 : 0;
  return (
    <div style={{ position: 'relative', opacity: on, ...style }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: shadow,
          transform: `translate(${off}px, ${off}px)`,
        }}
      />
      <div
        style={{
          position: 'relative',
          transform: `translate(${fromX * (1 - p)}px, ${fromY * (1 - p)}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Float: React.FC<{
  seed: number;
  amp?: number;
  children: React.ReactNode;
}> = ({ seed, amp = 7, children }) => {
  const frame = useCurrentFrame();
  const x = Math.sin(frame / 47 + seed * 2.13) * amp;
  const y = Math.cos(frame / 39 + seed * 1.71) * amp;
  return (
    <div style={{ transform: `translate(${x}px, ${y}px)` }}>{children}</div>
  );
};

const Cross: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <path
      d="M14 0h12v14h14v12H26v14H14V26H0V14h14z"
      fill={C.white}
      stroke={C.ink}
      strokeWidth={3.4}
    />
  </svg>
);

const Sparkle: React.FC<{ size: number; baseRot: number }> = ({
  size,
  baseRot,
}) => {
  const frame = useCurrentFrame();
  const rot = baseRot + Math.sin(frame / 53 + baseRot) * 7;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ transform: `rotate(${rot}deg)` }}
    >
      <path
        d="M50 2 C55 32 68 45 98 50 C68 55 55 68 50 98 C45 68 32 55 2 50 C32 45 45 32 50 2 Z"
        fill={C.yellow}
        stroke={C.ink}
        strokeWidth={4}
      />
    </svg>
  );
};

export const V7Card: React.FC = () => {
  const frame = useCurrentFrame();

  // Уезд основного контента влево, жёсткий cubic.
  const exitP = interpolate(frame, [EXIT_AT, EXIT_AT + EXIT_DUR], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Въезд end-card справа.
  const endP = interpolate(frame, [END_AT, END_AT + 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: C.paper,
        fontFamily: fontSans,
        color: C.ink,
        overflow: 'hidden',
      }}
    >
      {/* ---------- Слой 0: фоновый декор (живёт весь ролик за контентом) ---------- */}
      <AbsoluteFill style={{ zIndex: 0 }}>
        {/* Жёлтый круг из правого верхнего угла */}
        <div
          style={{
            position: 'absolute',
            top: -66,
            right: -60,
            width: 196,
            height: 196,
            borderRadius: '50%',
            background: C.yellow,
            border: `4px solid ${C.ink}`,
          }}
        />
        {/* Оранжевый круг из левого нижнего угла */}
        <div
          style={{
            position: 'absolute',
            bottom: -70,
            left: -58,
            width: 178,
            height: 178,
            borderRadius: '50%',
            background: C.orange,
            border: `4px solid ${C.ink}`,
          }}
        />
        {/* Дрейфующие крестики */}
        <Float seed={1}>
          <div style={{ position: 'absolute', top: 214, right: 52 }}>
            <Cross size={34} />
          </div>
        </Float>
        <Float seed={3}>
          <div style={{ position: 'absolute', top: 496, right: 74 }}>
            <Cross size={26} />
          </div>
        </Float>
        <Float seed={5}>
          <div style={{ position: 'absolute', bottom: 216, left: 30 }}>
            <Cross size={30} />
          </div>
        </Float>
      </AbsoluteFill>

      {/* ---------- Слой 1: hook + кейсы, уезжает влево ---------- */}
      <AbsoluteFill
        style={{
          zIndex: 1,
          padding: `${52}px ${PAD_X}px`,
          justifyContent: 'flex-start',
          transform: `translateX(${-1140 * exitP}px)`,
        }}
      >
        {/* Бейдж-плашка: оранжевая, слэм слева */}
        <Slam at={BADGE_AT} fromX={-150} fromY={0} off={6}>
          <div
            style={{
              width: 'fit-content',
              background: C.orange,
              border: `3px solid ${C.ink}`,
              padding: '11px 22px',
              fontFamily: fontDisplay,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: '0.05em',
            }}
          >
            {BADGE_TEXT}
          </div>
        </Slam>

        {/* Постерный стек заголовка: жёлтая жёсткая тень через textShadow */}
        <div style={{ position: 'relative', marginTop: 40 }}>
          <Float seed={2} amp={5}>
            <div style={{ position: 'absolute', top: -12, right: 8 }}>
              <Sparkle size={92} baseRot={14} />
            </div>
          </Float>
          <div
            style={{
              fontFamily: fontDisplay,
              fontWeight: 800,
              fontSize: 106,
              lineHeight: 1.02,
              letterSpacing: '-0.01em',
              textShadow: '7px 7px 0 #FFC900',
              whiteSpace: 'nowrap',
            }}
          >
            {TITLE_LINES[0]}
          </div>
          <div
            style={{
              fontFamily: fontDisplay,
              fontWeight: 800,
              fontSize: 72,
              lineHeight: 1.08,
              letterSpacing: '-0.01em',
              textShadow: '6px 6px 0 #FFC900',
              whiteSpace: 'nowrap',
              marginTop: 4,
            }}
          >
            {TITLE_LINES[1]}
          </div>
          {/* Подзаголовок-стикер */}
          <div style={{ marginTop: 20 }}>
            <Slam at={SUB_AT} fromY={-44} off={6} shadow={C.ink}>
              <div
                style={{
                  width: 'fit-content',
                  background: C.white,
                  border: `3px solid ${C.ink}`,
                  padding: '8px 18px',
                  fontWeight: 700,
                  fontSize: 33,
                }}
              >
                {SUBTITLE}
              </div>
            </Slam>
          </div>
        </div>

        {/* Кейсы: ряды-плашки приземляются по очереди и остаются */}
        <div style={{ marginTop: 42 }}>
          {CASES.map((text, i) => {
            const dir = i % 2 === 0 ? -76 : 76;
            const chipBg = i === 1 ? C.orange : C.yellow;
            return (
              <Slam
                key={text}
                at={CASE_START + i * CASE_STEP}
                fromX={dir}
                fromY={-40}
                off={8}
                style={{ marginBottom: i < CASES.length - 1 ? 20 : 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'stretch', gap: 20 }}>
                  <div
                    style={{
                      width: 62,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: chipBg,
                      border: `4px solid ${C.ink}`,
                      fontFamily: fontDisplay,
                      fontWeight: 800,
                      fontSize: 21,
                      flexShrink: 0,
                    }}
                  >
                    {`0${i + 1}`}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: C.white,
                      border: `4px solid ${C.ink}`,
                      padding: '15px 22px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 29,
                        lineHeight: 1.32,
                        fontWeight: 500,
                        transform: `translateY(${Math.sin((frame + i * 21) / 33) * 1.6}px)`,
                      }}
                    >
                      {text}
                    </span>
                  </div>
                </div>
              </Slam>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* ---------- Слой 2: end-card, въезжает справа ---------- */}
      <AbsoluteFill
        style={{
          zIndex: 2,
          background: C.paper,
          padding: `0 ${PAD_X + 12}px`,
          justifyContent: 'center',
          transform: `translateX(${(1 - endP) * 1100}px)`,
        }}
      >
        {/* Собственный декор end-card */}
        <Float seed={6}>
          <div style={{ position: 'absolute', top: 88, right: 60 }}>
            <Sparkle size={72} baseRot={-10} />
          </div>
        </Float>
        <Float seed={4}>
          <div style={{ position: 'absolute', bottom: 120, left: 46 }}>
            <Cross size={34} />
          </div>
        </Float>

        <div>
          {/* Краткий заголовок стеком */}
          <Slam at={END_AT + 10} fromY={-64} off={0} shadow="transparent">
            <div>
              <div
                style={{
                  fontFamily: fontDisplay,
                  fontWeight: 800,
                  fontSize: 84,
                  lineHeight: 1.02,
                  letterSpacing: '-0.01em',
                  textShadow: '6px 6px 0 #FFC900',
                  whiteSpace: 'nowrap',
                }}
              >
                {SHORT_TITLE_LINES[0]}
              </div>
              <div
                style={{
                  fontFamily: fontDisplay,
                  fontWeight: 800,
                  fontSize: 58,
                  lineHeight: 1.08,
                  letterSpacing: '-0.01em',
                  textShadow: '5px 5px 0 #FFC900',
                  whiteSpace: 'nowrap',
                  marginTop: 4,
                }}
              >
                {SHORT_TITLE_LINES[1]}
              </div>
            </div>
          </Slam>

          {/* Когда-плашка */}
          <div style={{ marginTop: 26 }}>
            <Slam at={END_AT + 16} fromX={60} fromY={0} off={8}>
              <div
                style={{
                  width: 'fit-content',
                  background: C.yellow,
                  border: `4px solid ${C.ink}`,
                  padding: '12px 24px',
                  fontWeight: 700,
                  fontSize: 29,
                  whiteSpace: 'nowrap',
                }}
              >
                {WHEN}
              </div>
            </Slam>
          </div>

          {/* Метка расписания */}
          <div style={{ marginTop: 30 }}>
            <Slam at={END_AT + 22} fromY={-36} off={5} shadow={C.orange}>
              <div
                style={{
                  width: 'fit-content',
                  background: C.ink,
                  color: C.paper,
                  padding: '7px 16px',
                  fontWeight: 700,
                  fontSize: 17,
                  letterSpacing: '0.16em',
                }}
              >
                РАСПИСАНИЕ ПОТОКА
              </div>
            </Slam>
          </div>

          {/* Мини-расписание: 2 колонки × 4 ряда */}
          <div
            style={{
              marginTop: 18,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: 'repeat(4, auto)',
              gridAutoFlow: 'column',
              columnGap: 44,
              rowGap: 13,
            }}
          >
            {SCHEDULE.map((item, i) => {
              const nearest = i === 0;
              const u = interpolate(
                frame,
                [END_AT + 26 + i * 2, END_AT + 38 + i * 2],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) },
              );
              if (nearest) {
                return (
                  <div key={item.d} style={{ opacity: u }}>
                    <div
                      style={{
                        width: 'fit-content',
                        background: C.orange,
                        border: `3px solid ${C.ink}`,
                        boxShadow: `5px 5px 0 ${C.ink}`,
                        padding: '5px 14px',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: fontDisplay,
                          fontWeight: 700,
                          fontSize: 18,
                          color: C.paper,
                        }}
                      >
                        {item.d}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 20, color: C.paper }}>
                        {item.t}
                      </span>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={item.d}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 12,
                    opacity: u,
                    transform: `translateX(${36 * (1 - u)}px)`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: fontDisplay,
                      fontWeight: 700,
                      fontSize: 18,
                      color: C.dim,
                    }}
                  >
                    {item.d}
                  </span>
                  <span style={{ color: C.dim }}>·</span>
                  <span style={{ fontSize: 21, fontWeight: 500 }}>{item.t}</span>
                </div>
              );
            })}
          </div>

          {/* Подпись — после сборки расписания */}
          <div style={{ marginTop: 30 }}>
            <Slam at={END_AT + 34} fromY={-20} off={0} shadow="transparent">
              <span style={{ fontSize: 21, fontWeight: 500, color: C.dim, display: 'block' }}>
                {SIGNATURE}
              </span>
            </Slam>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
