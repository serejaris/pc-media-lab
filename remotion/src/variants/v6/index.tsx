import { Composition, registerRoot } from 'remotion';
import { V6Card } from './Card';

registerRoot(() => (
  <Composition
    id="V6"
    component={V6Card}
    durationInFrames={690}
    fps={30}
    width={1080}
    height={1080}
    defaultProps={{ layout: 'square' as const }}
  />
));
