Clasp doesn't let you specify multiple deployments so we do it ourselves. Clasp related files are kept here, and each
directory represents a deployment. Each directory has a script that copies the relevant files into their appropriate
places, runs `clasp push` and then deletes the files to return to the original state.

"Production" uploads the build from `dist` while "staging" uploads uncompiled files from `src`, minus `api` and Jest tests.