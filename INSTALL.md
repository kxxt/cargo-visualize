# Install cargo-visualize

`cargo-visualize` could be installed via several ways:

## Prebuilt Binary

See GitHub Releases.

## Via Package Managers

### Arch Linux

`cargo-visualize` package is available on AUR.

## From Source

cargo-visualize can be installed from source.
If you do not plan to contribute to `cargo-visualize`, you are expected to build it in release mode,
as debug build(or more precisely, `cfg(debug_assertions)`) enables some developer facing features
that are not suitable for end users.

### Requirements

- Rust and cargo
- Node.js and Yarn for building frontend.

### Features Flags

- The `embed` feature enables bundling of assets into the executable so that
  the final executable is self-contained and do not need external assets.
  - Without `embed` feature, env var `ASSET_DIR` needs to be set to the path to
    a directory where the executable can find the assets **at runtime**.
- The `build-frontend` feature builds the frontend assets while building `cargo-visualize`.
  - If this feature is turned off, you need to build the frontend assets
    manually by running `yarn install` and `yarn build` in `frontend` directory
    before building `cargo-visualize`
- The default features enables `embed` and `build-frontend` feature so that
  `cargo install` would work out of box.

### Instruction

Use `cargo install`(which installs latest stable version) or `cargo build` after cloning this repo.

```bash
cargo install cargo-visualize
```

```bash
cargo build --release
```
