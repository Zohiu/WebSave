from flask import Flask, send_from_directory
import subprocess
import uuid


app = Flask(__name__)

# https://github.com/gildas-lormeau/single-file-cli
single_file_executable = "single-file/single-file.exe"
single_file_executable = "single-file/single-file-x86_64-linux"


@app.route("/")
def hello_world():
    return send_from_directory('./web/', 'index.html')


@app.route('/<path:path>')
def sendstuff(path):
	print(path)
	return send_from_directory('./web/', path)


@app.route("/get/<path:path>")
def api(path):
    proc = subprocess.run([single_file_executable, path, "--dump-content"], stdout=subprocess.PIPE)
    html = proc.stdout
    if not html:
        return "Invalid URL.", 404
    return html, 200