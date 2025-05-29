# Build
FROM nixos/nix:latest AS builder

WORKDIR /app

COPY shell.nix .

COPY src/ ./src/
COPY web/ ./web/
COPY Cargo.toml .
COPY Cargo.lock .
COPY Makefile.toml .

RUN nix-shell --arg run false --run "cargo make build && cargo make clean"

# Runtime
FROM nixos/nix:latest AS runtime
WORKDIR /app

COPY --from=builder /app/release/ .
COPY --from=builder /app/shell.nix .

ENTRYPOINT ["nix-shell", "--arg", "build", "false", "--run"]
CMD ["./WebSave"]