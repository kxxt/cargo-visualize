use std::{iter, rc::Rc, sync::Arc};

use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use cargo_metadata::MetadataCommand;
use cfg_if::cfg_if;
use dep_info::CrateInfo;
use dto::{DepGraphEdges, DepGraphNodes};
use graph::DepGraph;
use petgraph::visit::IntoEdges;
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

    let mut graph = get_dep_graph(metadata, &config)?;
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
    let app = Router::new()
        .route("/crate/{id}", get(handler_crate_info))
        .route("/nodes", get(handler_nodes))
        .route("/edges", get(handler_edges))
        .layer(cors)
        .with_state(AppState { graph: Arc::new(graph) });

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();

    Ok(())
}

async fn handler_crate_info(Path(id): Path<String>) -> Result<Json<CrateInfo>, StatusCode> {
    todo!()
}

async fn handler_nodes(State(state): State<AppState>) -> Result<Json<DepGraphNodes>, StatusCode> {
    Ok(Json(DepGraphNodes {
        values: state.graph.node_weights().into_iter().cloned().map(Into::into).collect(),
    }))
}

async fn handler_edges(State(state): State<AppState>) -> Result<Json<DepGraphEdges>, StatusCode> {
    Ok(Json(DepGraphEdges {
        values: state.graph.edge_weights().cloned().map(Into::into).collect(),
    }))
}

fn cli_args(opt_name: &str, val: &str) -> impl Iterator<Item = String> {
    iter::once(opt_name.into()).chain(iter::once(val.into()))
}
