import { Composition } from 'remotion';
import { registerRoot } from 'remotion';
import { V1Card } from './Card';

registerRoot(() => (
  <Composition
    id="V1"
    component={V1Card}
    durationInFrames={570}
    fps={30}
    width={1080}
    height={1080}
  />
));
