from flask import Flask, send_from_directory
import subprocess
import mimetypes
import os

# mimetypes are taken directly from the system, so they might not be defined.
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')

app = Flask(__name__)


@app.route("/get/<path:path>")
def api(path):
    proc = subprocess.run(["single-file", "--browser-executable-path", "chromium", path, "--dump-content"], stdout=subprocess.PIPE)
    html = proc.stdout
    if not html:
        return "Invalid URL.", 404
    return html, 200


@app.route('/src/<path:path>')
def src(path):
	return send_from_directory('dist/src', path)


@app.route('/<path:path>')
def content(path):
	return send_from_directory('dist/', path)


@app.route("/")
def main():
    return send_from_directory('dist/', 'index.html')
