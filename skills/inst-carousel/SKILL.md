---
name: inst-carousel
description: Use when creating an Instagram carousel by code (HTML/CSS → PNG) in pc-media-lab. Triggers on инст-карусель, карусель кодом, Instagram carousel, slide pack for IG.
---

# Инст-карусель (карусель кодом)

Stateful пайплайн: тема → brief → HTML в `src/` → **агентский export** → postable PNG в корне run → review.

## Invariant

```text
output/inst-carousel/<YYYY-MM-DD-slug>/
  slide-01.png          ← deliverable
  slide-02.png
  ...
  src/
    index.html
    meta.md
    run.json
```

В корне run — только картинки для соцсетей. Исходники — только в `src/`.

## Уровень 1

1. **Brief** — тема, аудитория, число слайдов (по умолчанию 5), язык visible text = русский, theme id (`factory` по умолчанию).
2. **Тема** — прочитай `themes/<id>/design.md` и применяй токены.
3. **HTML** — single-file `src/index.html`: каждый слайд `.slide` ровно `1080×1080`, `lang="ru"`, без imagegen.
4. **Export** — запусти сам:

```bash
python3 skills/inst-carousel/export.py output/inst-carousel/<date-slug>
```

5. **Готово**, когда `slide-01.png`… существуют и визуально читаются на mobile preview.

Запрещено: просить пользователя скринить; отдавать HTML как результат уровня 1.

## Уровень 2

1. Review PNG: `use` / `revise` / `reject`.
2. При `revise` — правь `src/index.html` (или meta), снова export.
3. Обнови `src/run.json`: decision, rejected notes, selected slides, next action.

## meta.md (минимум)

```yaml
---
title: ""
created: "YYYY-MM-DD"
platform: instagram
format: carousel
size: "1080x1080"
theme: factory
slides_count: 5
language: ru
summary: ""
---
```

Exact visible text по слайдам — списком в теле `meta.md`.

## HTML contract

- Один файл, без сборщика.
- Слайды: элементы с классом `slide` (и опционально `data-slide="1"`).
- Размер слайда: 1080×1080 CSS px.
- Шрифты: по `design.md` (Geist или substitute Inter / JetBrains Mono).
- Цвета и радиусы — только из темы.
- Visible text: русский; `no readable English` без запроса.
- Export-скрипт делает каждый `.slide` видимым по очереди и снимает PNG.

## Export

Скрипт: `skills/inst-carousel/export.py`

Зависимости: `pip install playwright && playwright install chromium`

Агент ставит зависимости при необходимости и запускает export без участия пользователя.

## Reject if

- В корне run нет PNG или есть только HTML.
- Слайды не 1080×1080.
- Английский visible text без запроса.
- Тема проигнорирована (случайный purple gradient / тяжёлые тени против Factory).
- Export «оставьте на потом» / «сделайте скрин сами».

## Themes

| id | path |
|---|---|
| `factory` | `themes/factory/design.md` |

Новая тема = новая папка `themes/<id>/design.md`. Не выносить в корневой `templates/`.
