use std::{env, error::Error, path::PathBuf};

use cfg_if::cfg_if;

fn main() -> Result<(), Box<dyn Error>> {
    println!("cargo::rustc-check-cfg=cfg(embed)");
    println!("cargo::rerun-if-env-changed=FORCE_EMBED");
    println!("cargo::rerun-if-env-changed=ASSET_DIR");
    let dist = env::var_os("ASSET_DIR").map(PathBuf::from).unwrap_or_else(|| {
        cfg_if! {
            if #[cfg(debug_assertions)] {
                // In debug mode, we just use the abs path of built frontend.
                env::current_dir().unwrap().join("frontend").join("dist")
            } else if #[cfg(not(feature = "embed"))] {
                // If not debug and embed is turned off, we require ASSET_DIR to be set.
                panic!("`embed` feature is turned off and env var `ASSET_DIR` is not set. Please set it to the path where cargo-visualize can load assets at runtime.")
            } else {
                PathBuf::from("/not-used")
            }
        }
    });
    cfg_if::cfg_if! {
        if #[cfg(debug_assertions)] {
            // Do not enable embed for debug mode
            if option_env!("FORCE_EMBED").is_some() {
                println!("cargo::rustc-cfg=embed");
            } else {
                println!("cargo::rustc-env=__ASSET_DIR={}", dist.display());
            }
        } else if #[cfg(feature = "embed")] {
            println!("cargo::rustc-cfg=embed")
        } else {
            println!("cargo::rustc-env=__ASSET_DIR={}", dist.display());
        }
    }
    cfg_if::cfg_if! {
        if #[cfg(debug_assertions)] {
            // We do not build the frontend in debug mode.
            // The user is up to build it.
            println!("cargo::rerun-if-changed=build.rs")
        } else if #[cfg(feature = "build-frontend")] {
            // Not using the entire frontend dir just to avoid scanning node_modules for changes
            println!("cargo::rerun-if-changed=frontend/package.json");
            println!("cargo::rerun-if-changed=frontend/yarn.lock");
            println!("cargo::rerun-if-changed=frontend/vite.config.js");
            println!("cargo::rerun-if-changed=frontend/tsconfig.json");
            println!("cargo::rerun-if-changed=frontend/index.html");
            println!("cargo::rerun-if-changed=frontend/public");
            println!("cargo::rerun-if-changed=frontend/src");
            // Just in case that someone delete node_modules and we need to re-run yarn install
            println!("cargo::rerun-if-changed=frontend/node_modules/.yarn-state.yml");
            use xshell::{cmd, Shell};
            let sh = Shell::new()?;
            sh.change_dir("frontend");
            // The build script’s current directory is the source directory of the build script’s package.
            cmd!(sh, "yarn install").run()?;
            cmd!(sh, "yarn build").run()?;
        } else {
            println!("cargo::rerun-if-changed=build.rs")
        }
    }
    Ok(())
}
