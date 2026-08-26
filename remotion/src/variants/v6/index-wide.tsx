import { Composition, registerRoot } from 'remotion';
import { V6Card } from './Card';

registerRoot(() => (
  <Composition
    id="V6WIDE"
    component={V6Card}
    durationInFrames={690}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ layout: 'wide' as const }}
  />
));
