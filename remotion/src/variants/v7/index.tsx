import { Composition, registerRoot } from 'remotion';
import { V7Card } from './Card';

registerRoot(() => (
  <Composition
    id="V7"
    component={V7Card}
    durationInFrames={570}
    fps={30}
    width={1080}
    height={1080}
  />
));
