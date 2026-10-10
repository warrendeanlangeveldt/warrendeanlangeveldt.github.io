#!/bin/sh
# The maps on the site are drawn by the plugins' own drawing code, copied here unchanged. Run this from
# the site's folder, with code-kit and context-graph checked out beside it, after either changes.
set -e
cp ../code-kit/hooks/mod/codemap.mjs assets/vendor/code-kit/codemap.mjs
cp ../code-kit/hooks/mod/trail.mjs assets/vendor/code-kit/trail.mjs
cp ../context-graph/adapters/claude-code/hooks/mod/views/graph.mjs assets/vendor/context-graph/graph.mjs
cp ../context-graph/adapters/claude-code/hooks/mod/views/proposals.mjs assets/vendor/context-graph/proposals.mjs
echo "Copied the plugins' drawing code."
