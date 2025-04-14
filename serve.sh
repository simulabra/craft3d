bun build src/base.js --outdir=out --sourcemap=linked
cd out
bun x http-server
