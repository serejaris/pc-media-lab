import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { V4Card } from './Card';

registerRoot(() => (
  <Composition
    id="V4"
    component={V4Card}
    durationInFrames={570}
    fps={30}
    width={1080}
    height={1080}
  />
));
