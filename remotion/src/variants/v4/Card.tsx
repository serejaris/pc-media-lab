import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { tokens } from '../../tokens';
import { fontSans } from '../../fonts';

// v4 «Терминал штаба»: war-room консоль, строки лога печатаются посимвольно
// и подтверждаются меткой ok (positive). Печать детерминированная от кадра.

const BADGE = 'PERSONAL CORP · СЕНТЯБРЬ–НОЯБРЬ 2026 · УРОК 1';
const TITLE = 'Собираем главный отдел: папка, контекст и правила';
const LABELS = ['папка штаба', 'контекст агента', 'правила'] as const;
const DOTS = [9, 5, 13] as const;
const PROMPT = '> ';
const WHEN = 'вторник 15 сентября · 19:00 МСК / 13:00 BA';
const HOST = 'Серёжа Рис · ссылка в посте';

// Хронометраж набора: метка времени каждой строки считается один раз, детерминированно.
const LABEL_FPS = 1.0; // кадров на символ
const GAP_LABEL_DOTS = 8;
const DOT_FPS = 0.5;
const GAP_DOTS_OK = 7;
const OK_POP = 10;
const LINE_HOLD = 22;

type LineTiming = {
  start: number;
  labelChars: number;
  labelFrames: number;
  dotFrames: number;
  okAt: number;
};

const LINE_T: LineTiming[] = (() => {
  let cursor = 56;
  return LABELS.map((label, i) => {
    const labelChars = PROMPT.length + label.length;
    const labelFrames = Math.ceil(labelChars * LABEL_FPS);
    const dotFrames = Math.ceil(DOTS[i] * DOT_FPS);
    const okAt = labelFrames + GAP_LABEL_DOTS + dotFrames + GAP_DOTS_OK;
    const t = { start: cursor, labelChars, labelFrames, dotFrames, okAt };
    cursor += okAt + OK_POP + LINE_HOLD;
    return t;
  });
})();

const ALL_DONE =
  LINE_T[LINE_T.length - 1].start + LINE_T[LINE_T.length - 1].okAt + OK_POP;

const TITLE_AT = ALL_DONE + 34; // появление заголовка после сборки
const END_START = 420;

const clampNum = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

// Remotion interpolate по умолчанию экстраполирует за пределы диапазона — всегда клампим.
const clampRange = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

const Caret: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    style={{
      display: 'inline-block',
      width: 22,
      height: 46,
      marginLeft: 6,
      background: tokens.ink,
      opacity: on ? 1 : 0,
      transform: 'translateY(6px)',
    }}
  />
);

export const V4Card: React.FC = () => {
  const frame = useCurrentFrame();

  // --- фазы ---
  const badgeT = interpolate(frame, [8, 30], [0, 1], {
    ...clampRange,
    easing: Easing.out(Easing.cubic),
  });
  const panelT = interpolate(frame, [14, 42], [0, 1], {
    ...clampRange,
    easing: Easing.out(Easing.cubic),
  });
  const titleT = interpolate(frame, [TITLE_AT, TITLE_AT + 30], [0, 1], {
    ...clampRange,
    easing: Easing.out(Easing.cubic),
  });
  const endT = interpolate(frame, [END_START + 4, END_START + 32], [0, 1], {
    ...clampRange,
    easing: Easing.out(Easing.cubic),
  });
  const dimT = interpolate(frame, [END_START, END_START + 22], [1, 0.45], clampRange);

  const blink = Math.floor(frame / 8) % 2 === 0;

  // Кому принадлежит каретка: строка в фазе набора (до появления ok).
  let caretLine = -1;
  LINE_T.forEach((t, i) => {
    const local = frame - t.start;
    if (frame >= t.start && local < t.okAt) caretLine = i;
  });

  let doneCount = 0;
  LINE_T.forEach((t) => {
    if (frame >= t.start + t.okAt + OK_POP) doneCount += 1;
  });

  return (
    <AbsoluteFill
      style={{
        background: tokens.bg,
        fontFamily: fontSans,
        color: tokens.ink,
        padding: 84,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ opacity: dimT }}>
        {/* badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginBottom: 34,
            opacity: badgeT,
            transform: `translateY(${14 * (1 - badgeT)}px)`,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              background: tokens.accent,
              flexShrink: 0,
              opacity: doneCount === LABELS.length ? 0.85 : blink ? 1 : 0.25,
            }}
          />
          <div
            style={{
              fontSize: 21,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: tokens.dim,
              whiteSpace: 'nowrap',
            }}
          >
            {BADGE}
          </div>
        </div>

        {/* окно терминала */}
        <div
          style={{
            background: tokens.surface,
            borderRadius: 20,
            padding: '44px 56px 50px',
            opacity: panelT,
            transform: `translateY(${18 * (1 - panelT)}px)`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 38,
            }}
          >
            <div
              style={{
                fontSize: 21,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: tokens.dim,
              }}
            >
              Сборка штаба
            </div>
            <div style={{ fontSize: 22, letterSpacing: '0.18em', color: tokens.dim }}>
              {doneCount}/{LABELS.length}
            </div>
          </div>

          {LABELS.map((label, i) => {
            const t = LINE_T[i];
            const local = frame - t.start;
            if (local <= 0 && caretLine !== i) {
              return <div key={label} style={{ height: 58 }} />;
            }
            const visLabel = clampNum(
              Math.floor(local / LABEL_FPS),
              0,
              t.labelChars,
            );
            const dotLocal = local - t.labelFrames - GAP_LABEL_DOTS;
            const visDots = clampNum(
              Math.floor(dotLocal / DOT_FPS),
              0,
              DOTS[i],
            );
            const okT = clampNum((local - t.okAt) / OK_POP, 0, 1);
            const showLine = frame >= t.start;
            const pulse = 0.93 + 0.07 * Math.sin(frame / 16 + i * 2);
            const okEase = Easing.out(Easing.cubic)(okT);

            return (
              <div
                key={label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '450px 300px 1fr',
                  alignItems: 'baseline',
                  height: 58,
                  opacity: showLine ? 1 : 0,
                }}
              >
                <div style={{ fontSize: 44, whiteSpace: 'pre' }}>
                  <span style={{ color: tokens.dim }}>
                    {PROMPT.slice(0, showLine ? visLabel : 0)}
                  </span>
                  <span style={{ color: tokens.ink, letterSpacing: '0.05em' }}>
                    {showLine && visLabel > PROMPT.length
                      ? label.slice(0, visLabel - PROMPT.length)
                      : ''}
                  </span>
                  {caretLine === i && visLabel < t.labelChars && (
                    <Caret on={blink} />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 44,
                    letterSpacing: '0.16em',
                    color: tokens.dim,
                    whiteSpace: 'pre',
                  }}
                >
                  {'.'.repeat(showLine ? visDots : 0)}
                  {caretLine === i && visLabel >= t.labelChars ? (
                    <Caret on={blink} />
                  ) : null}
                </div>
                <div>
                  {okT > 0 ? (
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: 33,
                        fontWeight: 500,
                        letterSpacing: '0.24em',
                        color: tokens.positive,
                        paddingLeft: 26,
                        opacity: okEase * pulse,
                        transform: `translateY(${10 * (1 - okEase)}px)`,
                      }}
                    >
                      ok
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* заголовок урока — после сборки */}
        <h1
          style={{
            margin: '46px 0 0',
            maxWidth: 880,
            fontSize: 64,
            lineHeight: 1.15,
            fontWeight: 500,
            opacity: titleT,
            transform: `translateY(${26 * (1 - titleT)}px)`,
          }}
        >
          {TITLE}
        </h1>
      </div>

      <div style={{ flexGrow: 1 }} />

      {/* end-card */}
      <div
        style={{
          borderTop: `2px solid ${tokens.surface}`,
          paddingTop: 36,
          opacity: endT,
          transform: `translateY(${24 * (1 - endT)}px)`,
        }}
      >
        <div style={{ fontSize: 37, fontWeight: 500, marginBottom: 12 }}>
          {WHEN}
        </div>
        <div style={{ fontSize: 27, color: tokens.dim }}>{HOST}</div>
      </div>
    </AbsoluteFill>
  );
};
