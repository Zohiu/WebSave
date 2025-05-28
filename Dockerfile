FROM nixos/nix

WORKDIR /app
COPY . .

ENTRYPOINT ["nix-shell"]
CMD [
"--arg", "build", "true",
"--arg", "run", "true"
]
