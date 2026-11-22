#!/bin/sh
# Bundles the sources into a single self-contained index.html
set -e
cd "$(dirname "$0")"
JS="src/data.js src/core.js src/world.js src/paint.js src/entities.js src/npc.js src/game.js src/render.js src/ui.js"
cat $JS > /tmp/brumafonda_all.js
node --check /tmp/brumafonda_all.js
{ cat src/head.html; cat $JS; printf '\n}\n</script>\n</body>\n</html>\n'; } > index.html
echo "built index.html ($(wc -c < index.html) bytes)"
