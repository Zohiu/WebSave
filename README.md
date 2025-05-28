# WebSave

<img src="./web/lib/img/icon.png" width="50" height="50"/>

A progressive web app that allows you to save websites locally for offline viewing.

## How?

You will be asked to grant permission to a local directory, which will then be used to store `.html` files created using [Single File](https://www.getsinglefile.com/). This only works on browsers that support [window.showDirectoryPicker()](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker) - At the time of writing this, those include Chrome, Edge, and Opera.

### Unsupported browsers

On unsupported browsers all saved websites get stored in the browser's `IndexedDB`. If installed as a progressive web app. This makes it hard to transfer data between devices because you don't have easy access to the files.

## Development

This repository uses [Nix](https://nixos.org/download/) for a consistent development environment. To enter the environment, simply run `nix-shell` in the project root.

> A development server can be started directly using `nix-shell --arg debug true`

### Linting

To use ESLint manually, enter `nix-shell` and run `npx eslint web`.

# Deploying

### Nix

All official ways to deploy this app use Nix. If you want to handle everything yourself, just run `nix-shell --arg build true --arg run true` to start the server - See "Arguments" section.

### Docker

A dockerfile is included, which can be built using `docker build -t websave .` after which you can run a container: `docker run websave`

Additionally, a basic `docker-compose.yml` example is given.

## Arguments

You can add arguments to nix-shell or to the docker command (see `docker-compose.yml`). For additional details, refer to the [gunicorn](https://gunicorn.org/) documentation. The worker class used is `gevent`.
| Argument | Default | Note |
| - | -| - |
| --arg run [bool] | false | In the Dockerfile, this is set to "true" by default. To change that behavior, just override the run command. |
| --arg debug [bool] | false | Takes priority over "run". |
| --argstr host [host] | 0.0.0.0 | |
| --argstr port [port] | 8000 | |
| --argstr workers [workers] | 5 | 1 worker = 1 thread. |
| --argstr worker_connections [connections] | 100 | Allowed connections per worker |
| --argstr timeout [timeout] | 100 | Downloading a website can often take a while, so don't set this too low. |

## HTTPS

By default, this will only run as a basic HTTP server, so you'll have to setup your own proxy. An easy-to-setup solution for this is [Caddy](https://caddyserver.com/). Alternatively, you can use the official [Nginx example](https://docs.gunicorn.org/en/latest/deploy.html).

It's strongly recommended to use a reverse proxy, as mentioned in the gunicorn documentation.
