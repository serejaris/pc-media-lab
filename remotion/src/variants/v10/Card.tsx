import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/PlayfairDisplay';
import { fontSans } from '../../fonts';

// v10 «Editorial / magazine serif revival»: кремовая бумага, почти чёрная тушь,
// один кирпичный акцент. Огромный display-serif хедлайн с построчным reveal из
// масок, волосяные линейки, дек курсивом, кейсы мелким гротеском с антиквенными
// номерами 01/02/03, end-card журнальным разворотом Contents. Все анимации
// детерминированы от useCurrentFrame, спокойные easeOutExpo-кривые.

// Обе гарнитуры грузятся явно: normal для прямых начертаний и italic для дека,
// номеров и подписи. subsets включают cyrillic — кириллица в серифе обязательна.
const { fontFamily: SERIF } = loadFont('normal', {
  weights: ['500', '600', '700', '800', '900'],
  subsets: ['latin', 'cyrillic'],
});
loadFont('italic', {
  weights: ['500', '600', '700'],
  subsets: ['latin', 'cyrillic'],
});

const P = {
  paperHi: '#F7F2E9',
  paperMid: '#F3EDE1',
  paperLo: '#EEE5D4',
  ink: '#181310',
  inkDeck: '#37302A',
  soft: '#5A534B',
  dim: '#8A8177',
  hair: 'rgba(24,19,16,0.30)',
  hairSoft: 'rgba(24,19,16,0.16)',
  accent: '#AC3A23',
};

const BADGE_TEXT = 'PERSONAL CORP · СЕНТЯБРЬ–НОЯБРЬ 2026 · УРОК 1';
const WHEN = 'вторник 15 сентября · 19:00 МСК / 13:00 BA';
const WHEN_DATE = WHEN.split(' · ')[0];
const WHEN_TIME = WHEN.split(' · ')[1];
const SIGNATURE = 'Серёжа Рис · ссылка в посте';

const CASES = [
  'Заведёшь папку штаба и решишь, какой контекст в ней живёт',
  'Запишешь правила, по которым агент работает предсказуемо',
  'Проверишь агента на своей задаче',
];

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

// Тайминг (30 fps): мастхед и hook 0-60 -> заголовок построчно 20-70 ->
// дек 66 -> кейсы 112-180 остаются видимыми до конца контента ->
// контент тает 376-398 -> end-card входит 384-414 и держится статично
// до 570 (156 кадров после входа, ровно ~5 c чистого холда).
const BADGE_AT = 8;
const MAST_RULE_AT = 14;
const LINE_AT = [20, 32, 44];
const LINE_DUR = 26;
const STAR_AT = 58;
const DECK_AT = 68;
const DECK_RULE_AT = 76;
const CASE_START = 112;
const CASE_STEP = 24;
const CASE_DUR = 22;
const CONTENT_OUT_AT = 376;
const CONTENT_OUT_DUR = 22;
const END_AT = 384;
const END_DUR = 30;

const PAD_X = 88;
const PAD_TOP = 84;

const EASE = Easing.bezier(0.19, 1, 0.22, 1);

const progress = (frame: number, at: number, dur: number): number =>
  interpolate(frame, [at, at + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });

// Построчный reveal из маски: строка поднимается на место снизу вверх.
// pad — глиф-клиренс под выносные элементы (у, д, двоеточие): контейнер
// получает запас снизу, а отрицательный margin сохраняет ритм вёрстки.
const MaskLine: React.FC<{
  at: number;
  dur?: number;
  pad?: number;
  children: React.ReactNode;
}> = ({ at, dur = LINE_DUR, pad = 0, children }) => {
  const frame = useCurrentFrame();
  const t = progress(frame, at, dur);
  return (
    <div style={{ overflow: 'hidden', marginBottom: -pad }}>
      <div
        style={{
          transform: `translateY(${114 * (1 - t)}%)`,
          opacity: Math.min(1, t * 1.7),
          paddingBottom: pad,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Спокойный fade + подъём для каптионов, кейсов и блоков end-card.
const FadeRise: React.FC<{
  at: number;
  dur?: number;
  dy?: number;
  children: React.ReactNode;
}> = ({ at, dur = 22, dy = 16, children }) => {
  const frame = useCurrentFrame();
  const t = progress(frame, at, dur);
  return (
    <div style={{ opacity: t, transform: `translateY(${dy * (1 - t)}px)` }}>
      {children}
    </div>
  );
};

// Волосяная линейка, растёт слева направо.
const HairRule: React.FC<{ at: number; dur?: number; color?: string }> = ({
  at,
  dur = 24,
  color = P.hair,
}) => {
  const frame = useCurrentFrame();
  const t = progress(frame, at, dur);
  return (
    <div
      style={{
        height: 1,
        background: color,
        transform: `scaleX(${t})`,
        transformOrigin: 'left center',
      }}
    />
  );
};

// Газетная двойная линейка: толстая + тонкая.
const DoubleRule: React.FC<{ at: number; width: string }> = ({ at, width }) => {
  const frame = useCurrentFrame();
  const t = progress(frame, at, 26);
  return (
    <div
      style={{
        width,
        transform: `scaleX(${t})`,
        transformOrigin: 'left center',
      }}
    >
      <div style={{ height: 3, background: P.ink }} />
      <div style={{ height: 1, background: P.hair, marginTop: 5 }} />
    </div>
  );
};

// Типографская звёздочка-орнамент, медленно вращается всю жизнь карточки.
const StarGlyph: React.FC<{ size: number; color: string; opacity?: number }> = ({
  size,
  color,
  opacity = 1,
}) => {
  const spokes = [0, 45, 90, 135];
  return (
    <svg
      viewBox="0 0 100 100"
      style={{ width: size, height: size, display: 'block', opacity }}
    >
      {spokes.map((deg) => (
        <line
          key={deg}
          x1={50}
          y1={8}
          x2={50}
          y2={92}
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
    </svg>
  );
};

const FolioStar: React.FC = () => {
  const frame = useCurrentFrame();
  const t = progress(frame, STAR_AT, 20);
  return (
    <div
      style={{
        position: 'absolute',
        top: PAD_TOP + 4,
        right: PAD_X,
        opacity: t,
        transform: `rotate(${frame * 0.35}deg) scale(${0.7 + 0.3 * t})`,
      }}
    >
      <StarGlyph size={34} color={P.accent} />
    </div>
  );
};

export const V10Card: React.FC = () => {
  const frame = useCurrentFrame();

  const contentOut = interpolate(
    frame,
    [CONTENT_OUT_AT, CONTENT_OUT_AT + CONTENT_OUT_DUR],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const endT = progress(frame, END_AT, END_DUR);
  const endShift = 28 * (1 - endT);

  const titleL1 = (
      <MaskLine key="l1" at={LINE_AT[0]} pad={20}>
        <span
          style={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 92,
            lineHeight: 1.04,
            letterSpacing: '-0.005em',
            color: P.ink,
            whiteSpace: 'nowrap',
          }}
        >
          Собираем
        </span>
      </MaskLine>
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily: fontSans,
        color: P.ink,
        background: `linear-gradient(168deg, ${P.paperHi} 0%, ${P.paperMid} 58%, ${P.paperLo} 100%)`,
        overflow: 'hidden',
      }}
    >
      <FolioStar />

      {/* Полоса 1: hook + кейсы. Кейсы появляются и остаются до самого перехода. */}
      <AbsoluteFill style={{ padding: `${PAD_TOP}px ${PAD_X}px`, opacity: contentOut }}>
        <FadeRise at={BADGE_AT}>
          <div
            style={{
              fontFamily: fontSans,
              fontWeight: 500,
              fontSize: 17,
              letterSpacing: '0.24em',
              color: P.soft,
              whiteSpace: 'nowrap',
            }}
          >
            {BADGE_TEXT}
          </div>
        </FadeRise>

        <div style={{ marginTop: 20 }}>
          <HairRule at={MAST_RULE_AT} />
        </div>

        <div style={{ marginTop: 38 }}>{titleL1}</div>

        <MaskLine at={LINE_AT[1]} pad={56}>
          <span
            style={{
              display: 'block',
              fontFamily: SERIF,
              fontWeight: 800,
              fontSize: 182,
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
              color: P.ink,
              whiteSpace: 'nowrap',
            }}
          >
            главный
          </span>
        </MaskLine>

        <MaskLine at={LINE_AT[2]} pad={56}>
          <span
            style={{
              display: 'block',
              fontFamily: SERIF,
              fontWeight: 800,
              fontSize: 182,
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
              color: P.ink,
              whiteSpace: 'nowrap',
            }}
          >
            отдел
            <span style={{ color: P.accent }}>:</span>
          </span>
        </MaskLine>

        <div style={{ marginTop: 30, maxWidth: 720 }}>
          <MaskLine at={DECK_AT} dur={24} pad={16}>
            <span
              style={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 51,
                lineHeight: 1.12,
                color: P.inkDeck,
                whiteSpace: 'nowrap',
              }}
            >
              папка, контекст и правила
            </span>
          </MaskLine>
        </div>

        <div style={{ marginTop: 26 }}>
          <HairRule at={DECK_RULE_AT} color={P.hairSoft} />
        </div>

        <div>
          {CASES.map((text, i) => {
            const at = CASE_START + i * CASE_STEP;
            return (
              <div
                key={text}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 30,
                  borderTop: i > 0 ? `1px solid ${P.hairSoft}` : undefined,
                  padding: '17px 0',
                }}
              >
                <FadeRise at={at} dy={12}>
                  <span
                    style={{
                      fontFamily: SERIF,
                      fontStyle: 'italic',
                      fontWeight: 600,
                      fontSize: 40,
                      color: P.accent,
                      display: 'block',
                      minWidth: 64,
                    }}
                  >
                    {`0${i + 1}`}
                  </span>
                </FadeRise>
                <FadeRise at={at + 4} dy={12}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 23,
                      lineHeight: 1.35,
                      color: P.ink,
                      maxWidth: 700,
                    }}
                  >
                    {text}
                  </span>
                </FadeRise>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* Полоса 2: end-card журнальной вёрсткой Contents. */}
      <AbsoluteFill style={{ padding: `0 ${PAD_X}px` }}>
        <div
          style={{
            opacity: endT,
            transform: `translateY(${endShift}px)`,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <FadeRise at={END_AT + 2} dy={12}>
            <div
              style={{
                fontFamily: fontSans,
                fontWeight: 500,
                fontSize: 15,
                letterSpacing: '0.24em',
                color: P.dim,
                whiteSpace: 'nowrap',
              }}
            >
              {BADGE_TEXT}
            </div>
          </FadeRise>

          <div style={{ marginTop: 22 }}>
            <DoubleRule at={END_AT + 6} width="100%" />
          </div>

          <MaskLine at={END_AT + 10} dur={24} pad={26}>
            <span
              style={{
                display: 'block',
                fontFamily: SERIF,
                fontWeight: 800,
                fontSize: 82,
                lineHeight: 1.06,
                letterSpacing: '-0.015em',
                color: P.ink,
                whiteSpace: 'nowrap',
              }}
            >
              {WHEN_DATE}
            </span>
          </MaskLine>
          <FadeRise at={END_AT + 24} dy={10}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
              <span style={{ width: 30, height: 3, background: P.accent, display: 'block' }} />
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 25,
                  letterSpacing: '0.09em',
                  color: P.accent,
                  whiteSpace: 'nowrap',
                }}
              >
                {WHEN_TIME}
              </span>
            </div>
          </FadeRise>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 47fr) minmax(0, 53fr)',
              gridTemplateRows: 'repeat(4, auto)',
              gridAutoFlow: 'column',
              columnGap: 56,
              rowGap: 15,
              marginTop: 38,
              marginBottom: 40,
            }}
          >
            {SCHEDULE.map(([date, label], i) => {
              const at = END_AT + 26 + i * 4;
              return (
                <FadeRise key={date} at={at} dur={18} dy={9}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                    <span
                      style={{
                        fontSize: 21,
                        fontWeight: 500,
                        fontVariantNumeric: 'tabular-nums',
                        color: P.dim,
                        whiteSpace: 'nowrap',
                        minWidth: 74,
                      }}
                    >
                      {date}
                    </span>
                    {i === 0 ? (
                      <StarGlyph size={13} color={P.accent} />
                    ) : (
                      <span
                        style={{
                          width: 13,
                          height: 1,
                          background: P.hair,
                          alignSelf: 'center',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: i === 0 ? 22 : 21.5,
                        lineHeight: 1.35,
                        fontWeight: i === 0 ? 600 : 400,
                        color: i === 0 ? P.ink : P.soft,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                </FadeRise>
              );
            })}
          </div>

          <FadeRise at={END_AT + 44} dy={10}>
            <div style={{ borderTop: `1px solid ${P.hairSoft}`, paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontFamily: SERIF,
                    fontStyle: 'italic',
                    fontWeight: 600,
                    fontSize: 30,
                    color: P.ink,
                  }}
                >
                  {SIGNATURE.split(' · ')[0]}
                </span>
                <span
                  style={{
                    fontSize: 18,
                    letterSpacing: '0.14em',
                    color: P.dim,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {SIGNATURE.split(' · ')[1]}
                </span>
              </div>
            </div>
          </FadeRise>
        </div>
      </AbsoluteFill>

      {/* Бумажная виньетка: собирает полосу без шума и грязи */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 50% 42%, rgba(24,19,16,0) 58%, rgba(24,19,16,0.07) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
