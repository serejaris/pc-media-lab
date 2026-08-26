import { Composition } from 'remotion';
import { registerRoot } from 'remotion';
import { V3Card } from './Card';

registerRoot(() => (
  <Composition
    id="V3"
    component={V3Card}
    durationInFrames={570}
    fps={30}
    width={1080}
    height={1080}
  />
));
