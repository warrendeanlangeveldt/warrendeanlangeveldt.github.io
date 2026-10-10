# code-kit & Context Graph

The website for two Claude Code plugins: [code-kit](https://github.com/warrendeanlangeveldt/code-kit) and [Context Graph](https://github.com/warrendeanlangeveldt/context-graph). Live at **https://warrendeanlangeveldt.github.io**.

![A replay of a build with both plugins: the band, the lanes, the code map and the module graph](assets/media/harness.gif)

Plain HTML, CSS and one script, no build step. `assets/harness.js` is the live replay on the home page. Its maps are drawn by the plugins' own drawing code, copied unchanged into `assets/vendor/` by `scripts/vendor.sh`, from the book editor's real files in `assets/data/`, so the site shows exactly what the plugins draw in the desktop app and in the terminal. `_capture/` holds the bare pages the GIFs and the social card are recorded from.
