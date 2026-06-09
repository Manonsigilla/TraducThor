# Multi-engine translator

A lightweight web app that translates text with **several translation engines in
parallel** and shows the results side by side. Handy for comparing renderings and
picking the best wording.

Built with **Flask** (back-end) and a vanilla HTML / CSS / JavaScript front-end,
with no client-side framework.

## Engines

Translations are provided through the [`deep-translator`](https://github.com/nidhaloff/deep-translator) library:

- **Google** (`GoogleTranslator`)
- **MyMemory** (`MyMemoryTranslator`)
- **Linguee** (`LingueeTranslator`)
- **Pons** (`PonsTranslator`)

All engines are free and require **no API key**.

## Features

- Simultaneous translation across all 4 engines (run in parallel on the server)
- Automatic source-language detection
- 12 selectable languages (French, English, Spanish, German, Italian,
  Portuguese, Dutch, Arabic, Chinese, Japanese, Russian)
- Character counter (5000-character limit)
- A "Copy" button on each result
- Keyboard shortcut `Ctrl+Enter` (or `Cmd+Enter`) to run the translation
- Responsive UI with loading states (skeleton loaders)

## Requirements

- Python 3.9 or newer
- `pip`

## Installation

```bash
# 1. (Optional but recommended) create a virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# 2. Install the dependencies
pip install -r requirements.txt
```

## Project structure

Flask looks for pages in a `templates/` folder and static assets in `static/`,
so the project is laid out as follows:

```
TraducThor/
├── app.py                  # Flask server + routes
├── translators.py          # Translation engine definitions
├── requirements.txt
├── README.md
├── main.scss               # Sass source for style.css (not served directly)
├── templates/
│   └── index.html          # Main page
└── static/
    ├── css/
    │   └── style.css        # Styles (compiled from main.scss)
    └── js/
        └── main.js          # Front-end logic
```

`main.scss` is the Sass source for `style.css`; it is not served directly and
stays at the project root according to your build workflow.

## Running

```bash
python app.py
```

The app starts in debug mode and is available at:

```
http://127.0.0.1:5000
```

## Usage

1. Pick the source language (or leave "Auto-detect") and the target language.
2. Type your text in the input area.
3. Click **Translate** (or press `Ctrl+Enter`).
4. Compare the results from each engine and copy the one you prefer.

## API

The app exposes a single JSON endpoint used by the front-end:

**`POST /translate`**

Request:

```json
{
  "text": "Hello world",
  "source": "auto",
  "target": "fr"
}
```

Response:

```json
{
  "Google": "Bonjour le monde",
  "MyMemory": "Bonjour le monde",
  "Linguee": "...",
  "Pons": "..."
}
```

If an engine fails, its value contains an `"Error: ..."` message instead of a
translation. An empty text returns HTTP `400`.

## Notes

- The engines rely on online services: an internet connection is required, and
  some engines may be temporarily unavailable or rate-limit requests.
- `debug=True` is meant for development. For deployment, use a WSGI server
  (e.g. `gunicorn`) and turn debug mode off.
