from deep_translator import (
    GoogleTranslator,
    MyMemoryTranslator,
    LingueeTranslator,
    PonsTranslator,
)

# Translation engines exposed to the app.
# Each value is a callable (text, source, target) -> translated text.
# The dict order also defines the order results are displayed in the UI.
ENGINES = {
    "Google":   lambda text, src, tgt: GoogleTranslator(source=src, target=tgt).translate(text),
    "MyMemory": lambda text, src, tgt: MyMemoryTranslator(source=src, target=tgt).translate(text),
    "Linguee":  lambda text, src, tgt: LingueeTranslator(source=src, target=tgt).translate(text),
    "Pons":     lambda text, src, tgt: PonsTranslator(source=src, target=tgt).translate(text),
}
