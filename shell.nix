{ run ? false, debug ? false, build ? false,

host ? "0.0.0.0", port ? "8000",

workers ? "5", worker_connections ? "100", timeout ? "100", }:

let
  pkgs =
    import (fetchTarball "https://github.com/NixOS/nixpkgs/tarball/nixos-24.11")
    { };

  command = if run || debug then ''
    source tasks.sh

    # Build
    ${if build then
      "build"
    else if debug then
      "build_debug &"
    else
      ""}

    # Start server
    gunicorn ${if debug then "--reload" else ""} \
      --bind=${host}:${port} \
      --worker-class=gevent \
      -w=${workers} \
      --worker-connections=${worker_connections} \
      --timeout=${timeout} \
      server:app

    exit
  '' else
    "";

in pkgs.mkShell {
  packages = with pkgs; [
    single-file-cli
    chromium
    nodejs_23
    typescript
    lightningcss
    esbuild
    inotify-tools
    (python312.withPackages
      (python-pkgs: with python-pkgs; [ flask gunicorn gevent ]))
  ];

  # typescript-eslint is not in nixpkgs, so I use npm here.
  shellHook = ''
    (cd web; npm install --prefix ../node_modules --save-dev eslint @eslint/js typescript-eslint)
    ${command}
  '';
}
