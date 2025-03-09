fn main() {
    println!("cargo::rustc-check-cfg=cfg(embed)");
    println!("cargo::rerun-if-env-changed=FORCE_EMBED");
    cfg_if::cfg_if! {
        if #[cfg(debug_assertions)] {
            // DO not enable embed for debug mode
            if option_env!("FORCE_EMBED").is_some() {
                println!("cargo::rustc-cfg=embed")    
            }
        } else if #[cfg(feature = "embed")] {
            println!("cargo::rustc-cfg=embed")
        }
    }
}
