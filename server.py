from flask import Flask, send_from_directory
import subprocess
import mimetypes
import os

# mimetypes are taken directly from the system, so they might not be defined.
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')

app = Flask(__name__)


if os.name == "nt":
    single_file_executable = "single-file/single-file.exe"
else:
    single_file_executable = "single-file/single-file-x86_64-linux"


@app.route("/")
def main():
    return send_from_directory('web/', 'index.html')


@app.route('/<path:path>')
def mainjs(path):
	return send_from_directory('web/', path)


@app.route("/get/<path:path>")
def api(path):
    proc = subprocess.run([single_file_executable, path, "--dump-content"], stdout=subprocess.PIPE)
    html = proc.stdout
    if not html:
        return "Invalid URL.", 404
    return html, 200