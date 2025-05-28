function build_static() {
    cp -rd web/assets/ dist/
    cp web/index.html dist/
    cp web/manifest.json dist/
}

function build_debug() {
    while true; do
        inotifywait -e modify,create,delete -r web
        build_static
        cp -rd web/css/ dist/
        (
            cd web
            tsc
        )
    done
}

function build() {
    rm -r dist
    build_static
    (
        cd web
        tsc
    )
    esbuild --minify --outdir=dist --bundle=true --format=esm ./dist/src/main.js
    rm -r dist/src/*
    mv dist/main.js dist/src
    lightningcss --minify --bundle web/css/* --output-dir dist/css
}
