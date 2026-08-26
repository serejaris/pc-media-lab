import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const C = {
  bg: '#0e0f13',
  ink: '#f5f2ea',
  dim: '#b9b4a6',
  gold: '#ffcc4d',
  line: '#26272e',
};

// Народная структура (corp-hermes#18): hook 0-3s -> bullets 3-14s (остаются) -> end-card hold 5s.
const HOOK_END = 90;
const BULLET_START = 96;
const BULLET_STEP = 85;
const END_START = 420;

function Typewriter({ text, start, cps = 24 }: { text: string; start: number; cps?: number }) {
  const frame = useCurrentFrame();
  const chars = Math.floor(Math.max(0, frame - start) / (30 / cps));
  return (
    <>
      {text.split('\n').map((line, li) => {
        const linesBefore = text.split('\n').slice(0, li).join('\n').length + li;
        const visible = Math.max(0, Math.min(line.length, chars - linesBefore));
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

export const LessonCard: React.FC<{
  tag: string;
  title: string;
  bullets: string[];
  when: string;
  host: string;
}> = ({ tag, title, bullets, when, host }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hookSpring = spring({ frame, fps, config: { damping: 200, mass: 0.6 } });
  const hookShift = interpolate(hookSpring, [0, 1], [26, 0]);

  const endT = interpolate(frame, [END_START, END_START + 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const bulletsDim = interpolate(frame, [END_START, END_START + 20], [1, 0.16], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: C.bg, padding: 90, justifyContent: 'center' }}>
      <div
        style={{
          position: 'absolute', top: -140, right: -140, width: 420, height: 420,
          borderRadius: '50%', background: '#1c2a4a',
          transform: `translate(${Math.sin(frame / 34) * 22}px, ${Math.cos(frame / 40) * 24}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: -160, left: -120, width: 380, height: 380,
          borderRadius: '50%', background: '#23306b', opacity: 0.6,
          transform: `translate(${Math.cos(frame / 29) * 20}px, ${Math.sin(frame / 37) * 18}px)`,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontSize: 30, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: C.gold, marginBottom: 38, opacity: hookSpring, transform: `translateY(${hookShift}px)`,
          }}
        >
          {tag}
        </div>

        <h1 style={{ fontSize: 84, lineHeight: 1.06, color: C.ink, minHeight: 360, whiteSpace: 'pre-wrap', margin: 0 }}>
          <Typewriter text={title} start={6} cps={26} />
        </h1>

        <div style={{ marginTop: 44, opacity: bulletsDim }}>
          {bullets.map((b, i) => {
            const at = BULLET_START + i * BULLET_STEP;
            const u = interpolate(frame, [at, at + 22], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            });
            return (
              <div
                key={b}
                style={{
                  display: 'flex', alignItems: 'center', gap: 24, marginBottom: 26,
                  opacity: u, transform: `translateX(${34 * (1 - u)}px)`,
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: C.gold, flexShrink: 0 }} />
                <div style={{ fontSize: 40, color: C.ink }}>{b}</div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 46, paddingTop: 34, borderTop: `3px solid ${C.line}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 40,
            opacity: endT, transform: `translateY(${26 * (1 - endT)}px)`,
          }}
        >
          <div style={{ fontSize: 42, fontWeight: 700, color: C.gold }}>{when}</div>
          <div style={{ fontSize: 30, color: C.dim, textAlign: 'right' }}>
            {host} · ссылка в посте
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
