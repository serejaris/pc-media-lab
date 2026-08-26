import { Composition, registerRoot } from 'remotion';
import { V5Card } from './Card';

registerRoot(() => (
  <Composition
    id="V5"
    component={V5Card}
    durationInFrames={570}
    fps={30}
    width={1080}
    height={1080}
    defaultProps={{
      badge: 'PERSONAL CORP · СЕНТЯБРЬ–НОЯБРЬ 2026 · УРОК 1',
      title: 'Собираем главный отдел:\nпапка, контекст и правила',
      when: 'Вторник, 15 сентября · 19:00 МСК / 13:00 BA',
      host: 'Серёжа Рис · ссылка в посте',
    }}
  />
));
