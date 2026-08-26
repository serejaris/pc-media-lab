import { Composition } from 'remotion';
import { registerRoot } from 'remotion';
import { LessonCard } from './Card';

registerRoot(() => (
  <Composition
    id="Square"
    component={LessonCard}
    durationInFrames={570}
    fps={30}
    width={1080}
    height={1080}
    defaultProps={{
      tag: 'Personal Corp · Поток 3 · Урок 1',
      title: 'Главный отдел:\nпапка, контекст и правила',
      bullets: [
        'Папка штаба: структура за 20 минут',
        'Контекст, который понимает агент',
        'Правила вместо бесконечных промптов',
      ],
      when: 'вт 15.09 · 19:00 МСК',
      host: 'ведёт Серёжа Рис',
    }}
  />
));
