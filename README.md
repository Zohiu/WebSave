# WebSave

<img src="./web/assets/icons/icon.png" width="50" height="50"/>

A progressive web app built with the help of [Single File](https://www.getsinglefile.com/) that allows you to save the current state of websites locally for offline viewing. An instance is available at https://websave.catgirl.click/


## Storage

There are different ways to store files - not every way is supported on all browsers. You can use multiple storages at the same time.

-   **Directory:** Grant the app full access to a local directory, which it will then use to save and load sites. Supported by Chrome, Edge, and Opera in addition to some Android browsers.
-   **IndexedDB (unfinished!)**: Store sites directly inside the browser's built-in storage. Pretty much every modern browser supports this, but there is a [size limit](https://rxdb.info/articles/indexeddb-max-storage-limit.html#browser-specific-indexeddb-limits)
-   **Download (unfinished!)**: Directly download the html files. This options works everywhere, but does not allow viewing and managing saved websites within the app.

## Development

This repository uses [Nix](https://nixos.org/download/) for a consistent development environment. To enter the environment, simply run `nix-shell` in the project root. If you don't want to enter the nix shell, you can also use `nix-shell --run "<command>"` to automatically return to your shell after every command.

> A development server can be started using `cargo make debug`. All website changes will be updated in real-time.

### Offline usage

For production all code is bundled into a single .js file, so the service worker only caches that one file. Thus, the PWA won't work offline when using the included debug environment.

### Linting

To use ESLint manually, enter `nix-shell` and run `npx eslint web`. Alternatively you can configure your code editor to use ESLint automatically - for which you'll likely have to install it on your system manually.

# Deploying

### Nix

To build the project, enter `nix-shell` and run `cargo make build`. This will create a `release` folder which contains a binary and a bundled website. Executing the binary will run the server (_The contained `dist` folder must within the current working directory. The binary can be anywhere_).

### Docker

A dockerfile is included, which can be built using `docker build -t websave .` after which you can run a container: `docker run websave`

Additionally, a basic `docker-compose.yml` example is given.

### Environment variables

you can set the `HOST` and `PORT` environment variables to change the repsective values.

## HTTPS

By default, this will only run as a basic HTTP server, so you'll have to setup your own proxy. An easy-to-setup solution for this is [Caddy](https://caddyserver.com/). Alternatively, you can use the official [Nginx example](https://docs.gunicorn.org/en/latest/deploy.html).
