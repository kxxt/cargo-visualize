use std::{
    iter,
    net::{Ipv4Addr, SocketAddrV4},
    sync::Arc,
};

use anyhow::Context;
use axum::{
    routing::{get, post}, Router,
};
use cargo_metadata::MetadataCommand;
use cfg_if::cfg_if;
use graph::{DepGraph, DepMap};

use tower_http::cors::CorsLayer;

// `DepInfo` represents the data associated with dependency graph edges
mod dep_info;
// `Package` represents the data associated with dependency graph nodes
mod package;

// Contains the `DepGraph` type and most of the graph building / analysis logic
mod graph;
// Contains some auxiliary logic (currently just checking for packages of the same name)
mod dto;
mod util;

// Command-line parsing
mod cli;

// Embeded assets
#[cfg(embed)]
mod assets;

// Backend routes
mod routes;

use self::{
    cli::parse_options,
    graph::{
        dedup_transitive_deps, get_dep_graph, remove_deps, remove_irrelevant_deps, update_dep_info,
    },
    util::set_name_stats,
};

#[derive(Clone)]
struct AppState {
    graph: Arc<DepGraph>,
    depmap: Arc<DepMap>,
}

#[tokio::main(flavor = "current_thread")]
async fn main() -> anyhow::Result<()> {
    let config = parse_options();
    let mut cmd = MetadataCommand::new();

    if let Some(path) = &config.manifest_path {
        cmd.manifest_path(path);
    }

    let mut other_options = Vec::new();
    other_options.extend(config.features.iter().flat_map(|f| cli_args("--features", f)));
    if config.all_features {
        other_options.push("--all-features".into());
    }
    if config.no_default_features {
        other_options.push("--no-default-features".into());
    }
    other_options
        .extend(config.filter_platform.iter().flat_map(|p| cli_args("--filter-platform", p)));
    if config.frozen {
        other_options.push("--frozen".into());
    }
    if config.locked {
        other_options.push("--locked".into());
    }
    if config.offline {
        other_options.push("--offline".into());
    }
    other_options.extend(config.unstable_flags.iter().flat_map(|f| cli_args("-Z", f)));

    let metadata = cmd.other_options(other_options).exec()?;

    let (mut graph, depmap) = get_dep_graph(metadata, &config)?;
    update_dep_info(&mut graph);
    if !config.focus.is_empty() {
        remove_irrelevant_deps(&mut graph, &config.focus);
    }
    if !config.hide.is_empty() {
        remove_deps(&mut graph, &config.hide);
    }
    if config.dedup_transitive_deps {
        dedup_transitive_deps(&mut graph);
    }
    set_name_stats(&mut graph);

    cfg_if! {
        if #[cfg(debug_assertions)] {
            let cors = CorsLayer::permissive();
        } else {
            let cors = CorsLayer::new();
        }
    };

    let mut app = Router::new()
        .route("/package/{id}", get(routes::handler_crate_info))
        .route("/open/{id}/{field}", post(routes::handler_open))
        .route("/nodes", get(routes::handler_nodes))
        .route("/edges", get(routes::handler_edges))
        .route("/graph", get(routes::handler_graph))
        .layer(cors)
        .with_state(AppState { graph: Arc::new(graph), depmap: Arc::new(depmap) });

    cfg_if! {
        if #[cfg(embed)] {
            app = app
                .route("/", get(assets::handler_index))
                .route("/crab.svg", get(assets::static_handler))
                .route("/assets/{*file}", get(assets::static_handler))
        } else {
            app = app.fallback_service(tower_http::services::ServeDir::new("frontend/dist"))
        }
    };

    let listener = if let Some(bind) = config.bind {
        tokio::net::TcpListener::bind(bind).await?
    } else {
        let base_port = 8913;
        let mut port = base_port;
        loop {
            match tokio::net::TcpListener::bind(SocketAddrV4::new(Ipv4Addr::LOCALHOST, port)).await
            {
                Ok(listener) => break Some(listener),
                Err(e) => {
                    eprintln!("Failed to bind to 127.0.0.1:{port}: {e}, trying next port");
                    port += 1;
                    if port > 9913 {
                        break None;
                    }
                    continue;
                }
            };
        }
        .with_context(|| "Failed to find a free port for service in [8913..9913].")?
    };
    println!("Web service available on http://{}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
    return Ok(());
}


fn cli_args(opt_name: &str, val: &str) -> impl Iterator<Item = String> {
    iter::once(opt_name.into()).chain(iter::once(val.into()))
}
