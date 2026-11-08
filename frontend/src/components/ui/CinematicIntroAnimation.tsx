import React from 'react';
import { CinematicIntro } from '../cinematic-intro/CinematicIntro';
import { type CinematicIntroProps } from '../cinematic-intro/intro.types';

export interface CinematicIntroAnimationProps extends CinematicIntroProps {}

export const CinematicIntroAnimation: React.FC<CinematicIntroAnimationProps> = (props) => {
  return <CinematicIntro {...props} />;
};

export { CinematicIntro };
export default CinematicIntroAnimation;
