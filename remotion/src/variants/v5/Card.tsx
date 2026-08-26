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

const C = tokens;

// Хронология (30 fps): hook 0-90 -> хаос 90-240 -> сборка 240-390 -> end-card 390-570.
const TITLE_TYPE_START = 10;
const TITLE_CPS = 30;
const CHAOS_START = 90;
const ASSEMBLE_START = 240;
const FLIGHT = 66;
const MARKER_BASE = 292;
const END_START = 390;

// Геометрия финальных строк: маркер слева, текст правее.
const MARKER_X = 92;
const TEXT_X = 124;
const CHIP_PAD_X = 30;
const CHIP_PAD_Y = 14;
const ROW_Y = [448, 572, 696];

type Entity = {
  chaos: string;
  final: string | null;
  row: number | null;
  x: number;
  y: number;
  rot: number;
  delay: number;
};

const ENTITIES: Entity[] = [
  { chaos: 'где тот промпт', final: 'Папка штаба: один дом для агентов', row: 0, x: 120, y: 476, rot: -7, delay: 0 },
  { chaos: 'какой контекст?', final: 'Контекст: агент помнит сам', row: 1, x: 548, y: 418, rot: 6, delay: 14 },
  { chaos: 'правила?', final: 'Правила: предсказуемая работа', row: 2, x: 208, y: 668, rot: -4, delay: 28 },
  { chaos: 'снова объяснять', final: null, row: null, x: 604, y: 646, rot: 9, delay: 6 },
];

function Typewriter({
  text,
  start,
  cps,
}: {
  text: string;
  start: number;
  cps: number;
}) {
  const frame = useCurrentFrame();
  const chars = Math.floor(Math.max(0, frame - start) / (30 / cps));
  return (
    <>
      {text.split('\n').map((line, li) => {
        const before = text.split('\n').slice(0, li).join('\n').length + li;
        const visible = Math.max(0, Math.min(line.length, chars - before));
        return (
          <span key={li}>
            {line.slice(0, visible)}
            {li < text.split('\n').length - 1 ? <br /> : null}
          </span>
        );
      })}
    </>
  );
}

const Fragment: React.FC<{
  entity: Entity;
  index: number;
}> = ({ entity, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Появление обрывка из тишины.
  const pop = spring({
    frame: frame - (CHAOS_START + index * 11),
    fps,
    config: { damping: 16, mass: 0.4 },
  });
  const inOpacity = Math.max(0, Math.min(1, pop));

  // Прогресс полёта на своё место (для «снова объяснять» — растворение).
  const vanishDelay = 252;
  const raw = interpolate(
    frame,
    [
      ASSEMBLE_START + entity.delay,
      ASSEMBLE_START + entity.delay + FLIGHT,
    ],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const p = Easing.out(Easing.cubic)(raw);
  const pv =
    entity.final === null
      ? Easing.out(Easing.cubic)(
          interpolate(frame, [vanishDelay, vanishDelay + 54], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        )
      : 0;

  // Лёгкий дрейф хаоса, гаснет при сборке.
  const damp = inOpacity * (1 - p);
  const dx = Math.sin(frame / 41 + index * 1.9) * 7 * damp;
  const dy = Math.cos(frame / 33 + index * 2.7) * 6 * damp;
  const rot = entity.rot * (1 - p);

  // Цель полёта: строка-кейс либо растворение в центре.
  const tx = entity.row === null ? entity.x + 90 : TEXT_X - CHIP_PAD_X;
  const ty =
    entity.row === null ? entity.y - 20 : ROW_Y[entity.row] - CHIP_PAD_Y;
  const left = interpolate(p, [0, 1], [entity.x, tx]);
  const top = interpolate(p, [0, 1], [entity.y, ty]);

  const chaosOpacity = entity.final === null ? 1 : 1 - p * 1.18;
  const finalOpacity =
    entity.final === null
      ? 0
      : interpolate(p, [0.45, 0.85], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  const chromeOpacity = (1 - p) * 0.95;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        opacity: inOpacity * (1 - pv),
        transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
      }}
    >
      {/* Обрывок: свой чип, ширина по своему тексту */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          display: 'flex',
          padding: `${CHIP_PAD_Y}px ${CHIP_PAD_X}px`,
          background: C.surface,
          border: `1px solid rgba(138, 131, 128, 0.28)`,
          borderRadius: 18,
          opacity: Math.max(0, chaosOpacity) * chromeOpacity,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 36, fontWeight: 400, color: C.dim }}>
          {entity.chaos}
        </span>
      </div>
      {/* Строка-кейс: появляется на месте того же элемента */}
      {entity.final === null ? null : (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            display: 'flex',
            padding: `${CHIP_PAD_Y}px ${CHIP_PAD_X}px`,
            background: C.surface,
            border: `1px solid rgba(138, 131, 128, 0.28)`,
            borderRadius: 18,
            opacity: finalOpacity,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 40, fontWeight: 500, color: C.ink }}>
            {entity.final}
          </span>
        </div>
      )}
    </div>
  );
};

export const V5Card: React.FC<{
  badge: string;
  title: string;
  when: string;
  host: string;
}> = ({ badge, title, when, host }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hookSpring = spring({ frame, fps, config: { damping: 200, mass: 0.6 } });
  const hookShift = interpolate(hookSpring, [0, 1], [26, 0]);

  const endT = interpolate(frame, [END_START, END_START + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Акцентные маркеры строк проявляются, когда обрывок доехал.
  const markerU = (i: number) =>
    interpolate(
      frame,
      [MARKER_BASE + i * 12, MARKER_BASE + 26 + i * 12],
      [0, 1],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      },
    );

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        fontFamily: fontSans,
        padding: 84,
        overflow: 'hidden',
      }}
    >
      {/* Медленное пятно глубины под зоной хаоса */}
      <div
        style={{
          position: 'absolute',
          left: -120,
          top: 320,
          width: 720,
          height: 720,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(29, 26, 24, 0.95) 0%, rgba(16, 16, 16, 0) 68%)`,
          transform: `translate(${Math.sin(frame / 47) * 26}px, ${
            Math.cos(frame / 39) * 22
          }px)`,
        }}
      />

      {/* Hook: badge + заголовок */}
      <div
        style={{
          position: 'absolute',
          top: 104,
          left: 84,
          right: 84,
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: C.accent,
            marginBottom: 30,
            opacity: hookSpring,
            transform: `translateY(${hookShift}px)`,
          }}
        >
          {badge}
        </div>
        <h1
          style={{
            fontSize: 68,
            fontWeight: 500,
            lineHeight: 1.14,
            color: C.ink,
            margin: 0,
            minHeight: 158,
            whiteSpace: 'pre-wrap',
          }}
        >
          <Typewriter text={title} start={TITLE_TYPE_START} cps={TITLE_CPS} />
        </h1>
      </div>

      {/* Хаос и сборка: одни и те же элементы едут на свои места */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {ENTITIES.map((entity, i) => (
          <Fragment key={entity.chaos} entity={entity} index={i} />
        ))}
        {ROW_Y.map((y, i) => (
          <div
            key={y}
            style={{
              position: 'absolute',
              left: MARKER_X,
              top: y + 4,
              width: 10,
              height: 44,
              borderRadius: 5,
              background: C.accent,
              transform: `scaleY(${markerU(i)})`,
              transformOrigin: 'top',
            }}
          />
        ))}
      </div>

      {/* End-card: дата/время + ведущий без слова про роль */}
      <div
        style={{
          position: 'absolute',
          left: 84,
          right: 84,
          top: 862,
          zIndex: 2,
        }}
      >
        <div
          style={{
            height: 3,
            background: C.surface,
            transform: `scaleX(${endT})`,
            transformOrigin: 'left',
            marginBottom: 30,
          }}
        />
        <div
          style={{
            fontSize: 38,
            fontWeight: 500,
            color: C.ink,
            opacity: endT,
            transform: `translateY(${24 * (1 - endT)}px)`,
          }}
        >
          {when}
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 29,
            color: C.dim,
            opacity: endT,
            transform: `translateY(${24 * (1 - endT)}px)`,
          }}
        >
          {host}
        </div>
      </div>
    </AbsoluteFill>
  );
};
