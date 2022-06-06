#!/usr/bin/env bash
cp ./clasp/staging/.clasp.json ./
cp ./clasp/staging/appsscript.json ./src
cp ./clasp/staging/.claspignore ./

clasp push

rm ./.clasp.json
rm ./src/appsscript.json
rm ./.claspignore