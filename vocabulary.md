# pc-media-lab

Словарь учебного шаблона медиа-отдела (Personal Corp L6).

## Language

**Медиа-отдел**:
OS производства медиа: правила агента, skills и postable артефакты.
_Avoid_: папка с картинками, dump

**Инст-карусель**:
Instagram-карусель кодом (HTML/CSS → PNG 1080×1080), русский visible text.
_Avoid_: code-carousel, reels, stories

**inst-carousel**:
Идентификатор skill и сегмент пути `output/inst-carousel/`.
_Avoid_: instagram-carousel

**Тема (theme)**:
Дизайн-система в `skills/inst-carousel/themes/<name>/design.md`.
_Avoid_: корневой templates/

**Factory**:
Тёмная тема terminal war room: #101010 canvas, bone-карточки, Geist/Inter, orange/green только как сигнал.
_Avoid_: purple AI gradient, soft elevation shadows

**output/**:
`output/<skill>/<YYYY-MM-DD-slug>/` — в корне только postable PNG.
_Avoid_: HTML в корне output

**src/**:
Исходники внутри run: HTML, meta, run log.
_Avoid_: исходники как deliverable для соцсетей

**Postable asset**:
Файл, который можно сразу запостить (слайд PNG).
_Avoid_: index.html как результат

**Export**:
Агент сам рендерит HTML → PNG. Ручной скрин запрещён.
_Avoid_: «открой preview и сделай screenshot»

**Уровень 1**:
Brief → src → export → postable PNG.
_Avoid_: HTML-only handoff

**Уровень 2**:
Review картинок → правки → re-export.
_Avoid_: второй несвязанный skill

**Stateful skill**:
Один skill, состояния в файлах run.
_Avoid_: one-shot промпт
