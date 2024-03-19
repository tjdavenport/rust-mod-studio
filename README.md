# Rust Mod Studio
A minimal IDE for developing plugins for the multiplayer survival game, [Rust](https://rust.facepunch.com/)

## Features
- Syntax highlighting
- Intellisense
- Code snippets for available hooks
- Plugin file management (create, delete, enforcement of PascalCase conventions)
- Dependency management (SteamCMD, RustDedicated, OmniSharp, Oxide.Rust)
- Automated dependency updates for RustDedicated and Oxide.Rust
- Code diagnostics with quick fixes
- User-friendly integration with Rust Dedicated Server (start, stop, log output)
- Boilerplate for creating new plugins

## Roadmap
### Short Term
- Add support for decompiling DLLs
- GoTo definition
- Add support for related filetypes
- Add more navigation features (e.g. GoTo line)
- Find & replace across files
- More color schemes
- Add support for changing font size
- Support for Linux
### Long Term
- Support for Carbon
- Prefab browsing and autocompletion
- Support RustDedicated on non-supported platforms with Docker integration.
- Support for developing plugins on remote servers
