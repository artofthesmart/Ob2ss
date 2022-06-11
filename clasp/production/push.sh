#!/usr/bin/env bash
npm run build
cp ./clasp/production/.clasp.json ./dist
cp ./clasp/production/appsscript.json ./dist
cp ./src/api.js ./dist

(cd ./dist && clasp push)

rm ./dist/.clasp.json
rm ./dist/appsscript.json
rm ./dist/api.js