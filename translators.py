from deep_translator import (
    GoogleTranslator,
    MyMemoryTranslator,
    LingueeTranslator,
    PonsTranslator,
)

MOTEURS = {
    "Google":   lambda text, src, tgt: GoogleTranslator(source=src, target=tgt).translate(text),
    "MyMemory": lambda text, src, tgt: MyMemoryTranslator(source=src, target=tgt).translate(text),
    "Linguee":  lambda text, src, tgt: LingueeTranslator(source=src, target=tgt).translate(text),
    "Pons":     lambda text, src, tgt: PonsTranslator(source=src, target=tgt).translate(text),
}
