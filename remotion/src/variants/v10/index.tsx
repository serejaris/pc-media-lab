import { Composition, registerRoot } from 'remotion';
import { V10Card } from './Card';

registerRoot(() => (
  <Composition
    id="V10"
    component={V10Card}
    durationInFrames={570}
    fps={30}
    width={1080}
    height={1080}
  />
));
