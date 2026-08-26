import { Composition, registerRoot } from 'remotion';
import { V11Card } from './Card';

registerRoot(() => (
  <Composition
    id="V11"
    component={V11Card}
    durationInFrames={570}
    fps={30}
    width={1080}
    height={1080}
  />
));
