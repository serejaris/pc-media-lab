import { Composition, registerRoot } from 'remotion';
import { V8Card } from './Card';

registerRoot(() => (
  <Composition
    id="V8"
    component={V8Card}
    durationInFrames={570}
    fps={30}
    width={1080}
    height={1080}
  />
));
