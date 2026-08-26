import { Composition, registerRoot } from 'remotion';
import { KineticCard } from './Card';

registerRoot(() => (
  <Composition
    id="V2"
    component={KineticCard}
    durationInFrames={570}
    fps={30}
    width={1080}
    height={1080}
  />
));
