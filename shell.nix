{ 
  build ? true,
  run ? true,
}:

let
  pkgs =
    import (fetchTarball "https://github.com/NixOS/nixpkgs/tarball/nixos-24.11") { };

  buildPkgs = with pkgs; [
    nodejs_23
    typescript
    lightningcss
    esbuild
    inotify-tools
    rustc
    cargo
    cargo-make
  ];

  runPkgs = with pkgs; [
    single-file-cli
    chromium
  ];

  selectedPkgs = (if build then buildPkgs else []) ++ (if run then runPkgs else []);

  # typescript-eslint is not in nixpkgs, so I use npm here.
  hookCmd = if build then ''
    (cd web; npm install --prefix .node_modules --save-dev eslint @eslint/js typescript-eslint)
  '' else "";

in pkgs.mkShell {
  packages = selectedPkgs;
  shellHook = hookCmd;
}
