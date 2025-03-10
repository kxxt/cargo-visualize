# cargo-visualize

Know your dependencies via interactive cargo dependency graph visualization.

## Installation

See [installation instructions](./INSTALL.md)

## Usage

`cargo visualize [options]`

The full list of options can be seen by running

`cargo visualize --help`

Commonly useful options:

* `--all-deps`
* `--all-deps --dedup-transitive-deps`

## Output explanation

* Cyan background = root / workspace member
* Grey background = target-specific dependency
* Green background = optional dependency
* Dark Green background = optional target-specific dependency
* Dotted lines = optional dependency (could be removed by disabling a cargo feature)
* Dashed lines = transitively optional dependency (could be removed by removing one of the dotted edges)
