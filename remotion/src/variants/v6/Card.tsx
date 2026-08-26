import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont as loadJetBrains } from '@remotion/google-fonts/JetBrainsMono';
import { fontSans } from '../../fonts';
import { tokens } from '../../tokens';

// v6 «Строгий каркас + живые обрывки».
// Основа — композиция v1: mono-бейдж, заголовок пружиной, кейсы по очереди, статичный end-card.
// Оживление — механика v5, укрупнённо убранная в фон: маленькие приглушённые чипы
// прыгают spring-ом во время кейсов, собираются в линию и растворяются в end-card.
// Новый слой end-card: мини-расписание потока двумя моноколонками, ближайшая дата с accent-маркером.

const { fontFamily: fontMono } = loadJetBrains('normal', {
  weights: ['400', '500'],
  subsets: ['latin', 'cyrillic'],
});

const C = tokens;

const BADGE_TEXT = 'PERSONAL CORP · СЕНТЯБРЬ–НОЯБРЬ 2026 · УРОК 1';
const TITLE_LINES = ['Собираем главный отдел:', 'папка, контекст и правила'];
const CASES = [
  'Заведёшь папку штаба и решишь, какой контекст в ней живёт',
  'Запишешь правила, по которым агент работает предсказуемо',
  'Проверишь агента на своей задаче',
];
const WHEN = 'вторник 15 сентября · 19:00 МСК / 13:00 BA';
const SHORT_TITLE = 'Собираем главный отдел';
const SIGNATURE = 'Personal Corp · Сентябрь–ноябрь 2026 · Серёжа Рис · ссылка в посте';

const SCHEDULE = [
  '15.09 · Папка, контекст и правила',
  '22.09 · Отдел и недельный пульс',
  '29.09 · Входящий поток',
  '06.10 · Скилл и запуск по событию',
  '13.10 · Runtime вне ноутбука',
  '20.10 · Медиа-отдел',
  '27.10 · Система, в которой живёшь',
  '03.11 · AI-команда и совет директоров',
];

// Тайминг (30 fps): hook 0-90 -> кейсы 96-234 -> чипы живут 110-296 -> сборка 296-360 ->
// растворение 380+, end-card входит с 390 и держится статично до 690.
const BADGE_AT = 4;
const TITLE_AT = 12;
const CASE_START = 96;
const CASE_STEP = 56;
const CASE_DUR = 26;
const CHIP_POP_BASE = 110;
const CHIP_POP_STEP = 16;
const ASSEMBLE_AT = 296;
const ASSEMBLE_DUR = 44;
const CONTENT_FADE_AT = 372;
const DISSOLVE_BASE = 380;
const END_AT = 390;

export type V6Layout = 'square' | 'wide';

type ChipDef = {
  label: string;
  hx: number;
  hy: number;
  rot: number;
  tx: number;
  ty: number;
};

type Geo = typeof SQUARE;

const SQUARE = {
  wide: false,
  padX: 84,
  padTop: 92,
  badgeSize: 24,
  badgeTrack: '0.16em',
  titleSize: 66,
  titleLineHeight: 1.1,
  titleMinH: 152,
  ruleMy: 30,
  caseSize: 30,
  caseGap: 24,
  chips: [
    { label: 'папка', hx: 100, hy: 760, rot: -5, tx: 133, ty: 884 },
    { label: 'контекст', hx: 330, hy: 906, rot: 4, tx: 284, ty: 884 },
    { label: 'правила', hx: 596, hy: 756, rot: -3, tx: 468, ty: 884 },
    { label: 'своя задача', hx: 775, hy: 916, rot: 6, tx: 641, ty: 884 },
    { label: 'агент', hx: 878, hy: 782, rot: -7, tx: 858, ty: 884 },
  ] as ChipDef[],
  schedSize: 20,
  schedRowGap: 17,
  schedColGap: 36,
  schedCols: 'minmax(0, 47fr) minmax(0, 53fr)',
  shortTitle: 44,
  when: 33,
  signature: 21,
};

const WIDE: Geo = {
  wide: true,
  padX: 96,
  padTop: 108,
  badgeSize: 24,
  badgeTrack: '0.14em',
  titleSize: 62,
  titleLineHeight: 1.14,
  titleMinH: 152,
  ruleMy: 30,
  caseSize: 31,
  caseGap: 28,
  chips: [
    { label: 'папка', hx: 140, hy: 620, rot: -5, tx: 553, ty: 902 },
    { label: 'контекст', hx: 430, hy: 760, rot: 4, tx: 704, ty: 902 },
    { label: 'правила', hx: 690, hy: 520, rot: -3, tx: 888, ty: 902 },
    { label: 'своя задача', hx: 1085, hy: 740, rot: 6, tx: 1061, ty: 902 },
    { label: 'агент', hx: 1640, hy: 620, rot: -7, tx: 1278, ty: 902 },
  ] as ChipDef[],
  schedSize: 25,
  schedRowGap: 22,
  schedColGap: 72,
  schedCols: '1fr 1fr',
  shortTitle: 52,
  when: 38,
  signature: 23,
};

const Chip: React.FC<{ def: ChipDef; index: number }> = ({ def, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Прыгучее появление: слабое демпфирование даёт видимый подскок масштаба.
  const pop = spring({
    frame: frame - (CHIP_POP_BASE + index * CHIP_POP_STEP),
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 120 },
  });
  const inOpacity = Math.max(0, Math.min(1, pop));

  // Дрейф, пока чип жив; гаснет при сборке.
  const raw = interpolate(
    frame,
    [ASSEMBLE_AT + index * 4, ASSEMBLE_AT + index * 4 + ASSEMBLE_DUR],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const p = Easing.out(Easing.cubic)(raw);
  const damp = inOpacity * (1 - p);
  const dx = Math.sin(frame / 43 + index * 1.9) * 6 * damp;
  const dy = Math.cos(frame / 34 + index * 2.6) * 5 * damp;
  const wob = Math.sin(frame / 51 + index) * 1.6 * damp;

  // Сборка: полёт на своё место в линии с мягкой дугой сверху.
  const arc = -Math.sin(Math.PI * p) * 26;
  const left = def.hx + (def.tx - def.hx) * p;
  const top = def.hy + (def.ty - def.hy) * p + arc;
  const rot = def.rot * (1 - p);
  const scale = 0.6 + 0.4 * pop;

  // Растворение линии перед end-card.
  const dis = interpolate(
    frame,
    [DISSOLVE_BASE + index * 6, DISSOLVE_BASE + index * 6 + 24],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        opacity: inOpacity * (1 - dis),
        transform: `translate(${dx}px, ${dy}px) rotate(${rot + wob}deg) scale(${scale})`,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          padding: '9px 18px',
          background: C.surface,
          border: '1px solid rgba(138, 131, 128, 0.24)',
          borderRadius: 12,
          fontSize: 21,
          fontWeight: 400,
          color: C.dim,
          whiteSpace: 'nowrap',
        }}
      >
        {def.label}
      </div>
    </div>
  );
};

const ScheduleRow: React.FC<{
  item: string;
  size: number;
  nearest: boolean;
}> = ({ item, size, nearest }) => {
  const sep = item.indexOf(' · ');
  const date = item.slice(0, sep);
  const label = item.slice(sep + 3);
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
      {nearest ? (
        <span
          style={{
            alignSelf: 'center',
            width: 7,
            height: size + 4,
            borderRadius: 3,
            background: C.accent,
            flexShrink: 0,
          }}
        />
      ) : null}
      <span
        style={{
          fontFamily: fontMono,
          fontSize: size,
          fontWeight: nearest ? 500 : 400,
          color: nearest ? C.ink : C.dim,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {date}
        <span style={{ color: C.dim }}>{' · '}</span>
        {label}
      </span>
    </div>
  );
};

const CasesCol: React.FC<{
  dir: 1 | -1;
  G: Geo;
  frame: number;
}> = ({ dir, G, frame }) => (
  <div>
    {CASES.map((text, i) => {
      const at = CASE_START + i * CASE_STEP;
      const u = interpolate(frame, [at, at + CASE_DUR], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      });
      return (
        <div
          key={text}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 24,
            marginBottom: i < CASES.length - 1 ? G.caseGap : 0,
            opacity: u,
            transform: `translateX(${dir * 44 * (1 - u)}px)`,
          }}
        >
          <div
            style={{
              width: 13,
              height: 13,
              borderRadius: '50%',
              background: C.accent,
              marginTop: Math.round(G.caseSize * 0.45),
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: G.caseSize, lineHeight: 1.35, color: C.ink }}>{text}</div>
        </div>
      );
    })}
  </div>
);

export const V6Card: React.FC<{ layout: V6Layout }> = ({ layout }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const G = layout === 'wide' ? WIDE : SQUARE;

  const badgeT = interpolate(frame, [BADGE_AT, BADGE_AT + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const titleSpring = spring({
    frame: frame - TITLE_AT,
    fps,
    config: { damping: 200, mass: 0.7 },
  });
  const titleShift = interpolate(titleSpring, [0, 1], [38, 0]);

  const ruleT = interpolate(frame, [TITLE_AT + 30, TITLE_AT + 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const fade = interpolate(frame, [CONTENT_FADE_AT, CONTENT_FADE_AT + 26], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const endT = interpolate(frame, [END_AT, END_AT + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const endShift = interpolate(endT, [0, 1], [26, 0]);
  const endRuleT = interpolate(frame, [END_AT + 6, END_AT + 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        fontFamily: fontSans,
        overflow: 'hidden',
      }}
    >
      {/* Фон-слой: прыгучие приглушённые чипы */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {G.chips.map((def, i) => (
          <Chip key={def.label} def={def} index={i} />
        ))}
      </div>

      {/* Основной контент: бейдж и заголовок слева, кейсы в своей колонке */}
      <AbsoluteFill style={{ zIndex: 2, opacity: fade }}>
        <div
          style={{
            position: 'absolute',
            left: G.padX,
            right: G.wide ? 1920 - 984 - 96 : G.padX,
            top: G.padTop,
          }}
        >
          <div
            style={{
              fontFamily: fontMono,
              fontSize: G.badgeSize,
              fontWeight: 500,
              letterSpacing: G.badgeTrack,
              textTransform: 'uppercase',
              color: C.accent,
              marginBottom: 28,
              opacity: badgeT,
              transform: `translateY(${12 * (1 - badgeT)}px)`,
            }}
          >
            {BADGE_TEXT}
          </div>
          <h1
            style={{
              fontSize: G.titleSize,
              lineHeight: G.titleLineHeight,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: C.ink,
              whiteSpace: 'pre-line',
              margin: 0,
              opacity: titleSpring,
              transform: `translateY(${titleShift}px)`,
            }}
          >
            {TITLE_LINES.join('\n')}
          </h1>
          {G.wide ? null : (
            <>
              <div
                style={{
                  height: 2,
                  width: `${ruleT * 82}%`,
                  background: C.surface,
                  marginTop: G.ruleMy,
                  marginBottom: G.ruleMy,
                }}
              />
              <CasesCol dir={1} G={G} frame={frame} />
            </>
          )}
        </div>

        {G.wide ? (
          <>
            <div
              style={{
                position: 'absolute',
                left: 952,
                top: 124,
                height: 760,
                width: 2,
                background: C.surface,
                opacity: ruleT,
              }}
            />
            <div style={{ position: 'absolute', left: 1024, top: 250, width: 800 }}>
              <CasesCol dir={-1} G={G} frame={frame} />
            </div>
          </>
        ) : null}
      </AbsoluteFill>

      {/* End-card: заголовок кратко, когда, расписание потока, подпись */}
      <AbsoluteFill
        style={{
          zIndex: 3,
          background: C.bg,
          padding: `0 ${G.padX}px`,
          justifyContent: 'center',
          opacity: endT,
        }}
      >
        <div style={{ transform: `translateY(${endShift}px)` }}>
          <div
            style={{
              fontSize: G.shortTitle,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: C.ink,
            }}
          >
            {SHORT_TITLE}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 20 }}>
            <div style={{ width: 14, height: 14, background: C.accent, flexShrink: 0 }} />
            <div
              style={{
                fontSize: G.when,
                fontWeight: 500,
                color: C.ink,
                whiteSpace: 'nowrap',
              }}
            >
              {WHEN}
            </div>
          </div>
          <div
            style={{
              height: 2,
              width: `${endRuleT * 100}%`,
              background: C.surface,
              marginTop: 34,
              marginBottom: 30,
            }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: G.schedCols,
              gridTemplateRows: 'repeat(4, auto)',
              gridAutoFlow: 'column',
              columnGap: G.schedColGap,
              rowGap: G.schedRowGap,
              alignItems: 'baseline',
            }}
          >
            {SCHEDULE.map((item, i) => (
              <ScheduleRow key={item} item={item} size={G.schedSize} nearest={i === 0} />
            ))}
          </div>
          <div style={{ fontSize: G.signature, color: C.dim, marginTop: 36 }}>
            {SIGNATURE}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
