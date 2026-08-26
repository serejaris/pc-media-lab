import { Composition, registerRoot } from 'remotion';
import { V9Card } from './Card';

registerRoot(() => (
  <Composition
    id="V9"
    component={V9Card}
    durationInFrames={570}
    fps={30}
    width={1080}
    height={1080}
  />
));
