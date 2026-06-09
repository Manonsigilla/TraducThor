from flask import Flask, render_template, request, jsonify
from concurrent.futures import ThreadPoolExecutor, as_completed
from translators import MOTEURS

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/translate", methods=["POST"])
def translate():
    data   = request.get_json()
    text   = data.get("text", "").strip()
    source = data.get("source", "auto")
    target = data.get("target", "en")

    if not text:
        return jsonify({"error": "Texte vide"}), 400

    resultats = {}
    with ThreadPoolExecutor() as executor:
        futures = {
            executor.submit(fn, text, source, target): nom
            for nom, fn in MOTEURS.items()
        }
        for future in as_completed(futures):
            nom = futures[future]
            try:
                resultats[nom] = future.result()
            except Exception as e:
                resultats[nom] = f"Erreur : {e}"

    # Réordonner dans l'ordre défini dans MOTEURS
    ordered = {nom: resultats[nom] for nom in MOTEURS if nom in resultats}
    return jsonify(ordered)

if __name__ == "__main__":
    app.run(debug=True)
