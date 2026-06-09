# Traducteur multi-moteurs

Application web légère qui traduit un texte avec **plusieurs moteurs de traduction
en parallèle** et affiche les résultats côte à côte. Pratique pour comparer les
rendus et choisir la meilleure formulation.

Construite avec **Flask** (back-end) et un front-end HTML / CSS / JavaScript natif,
sans framework côté client.

## Moteurs utilisés

Les traductions sont fournies via la bibliothèque [`deep-translator`](https://github.com/nidhaloff/deep-translator) :

- **Google** (`GoogleTranslator`)
- **MyMemory** (`MyMemoryTranslator`)
- **Linguee** (`LingueeTranslator`)
- **Pons** (`PonsTranslator`)

Tous les moteurs sont gratuits et ne nécessitent **aucune clé API**.

## Fonctionnalités

- Traduction simultanée par les 4 moteurs (exécution parallèle côté serveur)
- Détection automatique de la langue source
- 12 langues sélectionnables (français, anglais, espagnol, allemand, italien,
  portugais, néerlandais, arabe, chinois, japonais, russe)
- Compteur de caractères (limite 5000)
- Bouton « Copier » par résultat
- Raccourci clavier `Ctrl+Entrée` (ou `Cmd+Entrée`) pour lancer la traduction
- Interface réactive avec états de chargement (skeleton loaders)

## Prérequis

- Python 3.9 ou supérieur
- `pip`

## Installation

```bash
# 1. (Optionnel mais recommandé) créer un environnement virtuel
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# 2. Installer les dépendances
pip install -r requirements.txt
```

## Structure des fichiers

> **Important** — Flask cherche les pages dans un dossier `templates/` et les
> ressources statiques dans `static/`. Le code attend donc l'arborescence
> suivante. Si les fichiers `index.html`, `style.css` et `main.js` se trouvent
> à la racine, déplacez-les comme indiqué ci-dessous avant de lancer l'application.

```
Projet-traducteur/
├── app.py                  # Serveur Flask + routes
├── translators.py          # Définition des moteurs de traduction
├── requirements.txt
├── README.md
├── templates/
│   └── index.html          # Page principale
└── static/
    ├── css/
    │   └── style.css        # Styles (compilés depuis main.scss)
    └── js/
        └── main.js          # Logique front-end
```

Le fichier `main.scss` est la source Sass de `style.css` ; il n'est pas servi
directement et reste à la racine (ou dans un dossier `scss/`) selon votre flux
de compilation.

## Lancement

```bash
python app.py
```

L'application démarre en mode debug et est accessible sur :

```
http://127.0.0.1:5000
```

## Utilisation

1. Choisissez la langue source (ou laissez « Détection auto ») et la langue cible.
2. Saisissez votre texte dans la zone de saisie.
3. Cliquez sur **Traduire** (ou `Ctrl+Entrée`).
4. Comparez les résultats des différents moteurs et copiez celui de votre choix.

## API

L'application expose un endpoint JSON utilisé par le front-end :

**`POST /translate`**

Requête :

```json
{
  "text": "Bonjour le monde",
  "source": "auto",
  "target": "en"
}
```

Réponse :

```json
{
  "Google": "Hello world",
  "MyMemory": "Hello world",
  "Linguee": "...",
  "Pons": "..."
}
```

En cas d'échec d'un moteur, la valeur correspondante contient un message
`"Erreur : ..."` au lieu de la traduction. Un texte vide renvoie un code HTTP
`400`.

## Remarques

- Les moteurs reposent sur des services en ligne : une connexion internet est
  nécessaire et certains moteurs peuvent être temporairement indisponibles ou
  limiter le nombre de requêtes.
- Le mode `debug=True` est destiné au développement. Pour un déploiement,
  utilisez un serveur WSGI (par exemple `gunicorn`) et désactivez le mode debug.
