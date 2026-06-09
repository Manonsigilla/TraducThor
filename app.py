from flask import Flask, render_template, request, jsonify
from concurrent.futures import ThreadPoolExecutor, as_completed
from translators import ENGINES

app = Flask(__name__)


@app.route("/")
def index():
    """Serve the single-page translator UI."""
    return render_template("index.html")


@app.route("/translate", methods=["POST"])
def translate():
    """Translate the incoming text with every engine and return the results as JSON."""
    data = request.get_json()
    text = data.get("text", "").strip()
    source = data.get("source", "auto")
    target = data.get("target", "en")

    if not text:
        return jsonify({"error": "Empty text"}), 400

    # Run every engine concurrently so the response time is bounded by the
    # slowest engine rather than the sum of all of them.
    results = {}
    with ThreadPoolExecutor() as executor:
        futures = {
            executor.submit(fn, text, source, target): name
            for name, fn in ENGINES.items()
        }
        for future in as_completed(futures):
            name = futures[future]
            try:
                results[name] = future.result()
            except Exception as e:
                # Keep the UI working even when a single engine fails.
                # The "Error:" prefix is what the front-end checks to flag a card.
                results[name] = f"Error: {e}"

    # Reorder the results to match the declaration order in ENGINES,
    # since as_completed() yields them in completion order.
    ordered = {name: results[name] for name in ENGINES if name in results}
    return jsonify(ordered)


if __name__ == "__main__":
    app.run(debug=True)
