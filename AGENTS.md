# AGENTS.md

Медиа-отдел `pc-media-lab`: учебный шаблон производства медиа для агента.

## Назначение

Довести запрос до **postable** файлов в `output/`, чтобы другой оператор понял brief, skill, тему и статус без чтения чата.

Runnable-маршрут v1: **инст-карусель кодом** (`skills/inst-carousel`).

## Общение

- Отвечай по-русски, коротко и прямо.
- Формулируй: `Главная ставка`, `Риск`, `Следующее действие`.
- Visible text в слайдах — русский (Cyrillic). Английский только по явному запросу пользователя.

## Цикл прогона

```text
запрос → brief → HTML в src/ → агентский export PNG → review → (revise) → final
```

1. Прочитай `skills/inst-carousel/SKILL.md`.
2. Создай run: `output/inst-carousel/YYYY-MM-DD-slug/`.
3. Исходники только в `src/` (`index.html`, `meta.md`, `run.json`).
4. В корне run — только `slide-01.png` … (и при необходимости `slide-02.png` …).
5. Export запускай сам: `python3 skills/inst-carousel/export.py <run-dir>`. Не проси пользователя скринить.
6. Уровень 1 готов, когда PNG на месте и их можно запостить.
7. Уровень 2: review → правки `src/` → повторный export → обновить `run.json`.

## Границы

- Не клади секреты, токены, private пути в prompts и ассеты.
- Не считай HTML deliverable: deliverable = картинки в корне run.
- Не дублируй длинную narrative из README в ответы; исполняй skill.
- Новые media types (imagegen, video, audio) — только после явного расширения шаблона.

## Файлы

| Путь | Роль |
|---|---|
| `README.md` | повествование для человека |
| `vocabulary.md` | словарь |
| `skills/inst-carousel/SKILL.md` | контракт пайплайна |
| `skills/inst-carousel/themes/*/design.md` | темы оформления |
| `skills/inst-carousel/export.py` | HTML → PNG |
| `output/inst-carousel/<date-slug>/` | postable PNG + `src/` |
