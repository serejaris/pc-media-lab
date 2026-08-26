import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { tokens } from '../../tokens';
import { fontSans } from '../../fonts';

// v1 «Строгий Factory»: спокойный кинетик.
// hook 0-3s: badge -> заголовок пружиной -> кейсы выезжают по очереди и остаются ->
// end-card с даты держится статично до конца (осмысленный луп).

const BADGE_AT = 4;
const TITLE_AT = 10;
const RULE_AT = 22;
const BULLET_START = 96;
const BULLET_STEP = 64;
const BULLET_DUR = 26;
const END_START = 420;

const TITLE_LINES = ['Собираем главный', 'отдел: папка,', 'контекст и правила'];

export const V1Card: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  const ruleT = interpolate(frame, [RULE_AT, RULE_AT + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const endT = interpolate(frame, [END_START, END_START + 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const restDim = interpolate(frame, [END_START, END_START + 20], [1, 0.14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: tokens.bg,
        fontFamily: fontSans,
        padding: '66px 84px',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div style={{ opacity: restDim }}>
        {/* badge: метка-сигнал, Geist Mono стилистика */}
        <div
          style={{
            fontSize: 25,
            fontWeight: 500,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: tokens.accent,
            marginBottom: 34,
            opacity: badgeT,
            transform: `translateY(${12 * (1 - badgeT)}px)`,
          }}
        >
          Personal Corp · Сентябрь–ноябрь 2026 · Урок 1
        </div>

        {/* заголовок: появляется пружиной мгновенно */}
        <h1
          style={{
            fontSize: 84,
            lineHeight: 1.07,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: tokens.ink,
            whiteSpace: 'pre-line',
            margin: 0,
            opacity: titleSpring,
            transform: `translateY(${titleShift}px)`,
          }}
        >
          {TITLE_LINES.join('\n')}
        </h1>

        {/* тонкая линия-разделитель */}
        <div
          style={{
            height: 2,
            width: `${ruleT * 100}%`,
            background: tokens.surface,
            marginTop: 42,
            marginBottom: 40,
          }}
        />

        {/* три кейса: выезжают по очереди и остаются */}
        <div>
          {[
            'Заведёшь папку штаба и решишь, какой контекст в ней живёт',
            'Запишешь правила, по которым агент работает предсказуемо',
            'Проверишь агента на своей задаче',
          ].map((b, i) => {
            const at = BULLET_START + i * BULLET_STEP;
            const u = interpolate(frame, [at, at + BULLET_DUR], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            });
            return (
              <div
                key={b}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 26,
                  marginBottom: i < 2 ? 28 : 0,
                  opacity: u,
                  transform: `translateX(${44 * (1 - u)}px)`,
                }}
              >
                <div
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: '50%',
                    background: tokens.accent,
                    marginTop: 15,
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: 33, lineHeight: 1.35, color: tokens.ink }}>{b}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* end-card: дата/время + подпись, держится 5 секунд статично */}
      <div
        style={{
          marginTop: 48,
          paddingTop: 32,
          borderTop: `2px solid ${tokens.surface}`,
          opacity: endT,
          transform: `translateY(${24 * (1 - endT)}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 14,
              height: 14,
              background: tokens.accent,
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: 39, fontWeight: 500, color: tokens.ink, whiteSpace: 'nowrap' }}>
            вторник 15 сентября · 19:00 МСК / 13:00 BA
          </div>
        </div>
        <div style={{ fontSize: 28, color: tokens.dim, marginTop: 14, paddingLeft: 34 }}>
          Серёжа Рис · ссылка в посте
        </div>
      </div>
    </AbsoluteFill>
  );
};
