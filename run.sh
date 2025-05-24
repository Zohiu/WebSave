#!/bin/bash

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
gunicorn --bind=127.0.0.1 -w 1 --worker-class=gevent --worker-connections=1000 'server:app' --timeout 300

# Run caddy for https dev environment:
# sudo caddy reverse-proxy -i --from localhost --to 127.0.0.1:8000