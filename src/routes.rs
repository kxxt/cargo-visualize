
use crate::{
    dto::{DepGraphEdges, DepGraphInfo, DepGraphNodes},
    AppState,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use cargo_metadata::Package;


pub async fn handler_open(
    State(state): State<AppState>,
    Path((id, field)): Path<(String, String)>,
) -> StatusCode {
    let Some(pkg) = state.depmap.get(&id) else {
        return StatusCode::NOT_FOUND;
    };
    let Some(basedir) = pkg.manifest_path.parent() else {
        return StatusCode::IM_A_TEAPOT;
    };
    let Some(path) = (match field.as_str() {
        "manifest_path" => Some(basedir.to_owned()),
        "readme" => pkg.readme(),
        "license" => pkg.license_file(),
        _ => return StatusCode::BAD_REQUEST,
    }) else {
        return StatusCode::BAD_REQUEST;
    };
    let path = path.as_std_path();
    match open::that_detached(path) {
        Ok(_) => StatusCode::OK,
        Err(e) => {
            eprintln!("Failed to open {}: {e}", path.display());
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

pub async fn handler_crate_info(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Package>, StatusCode> {
    if let Some(pkg) = state.depmap.get(&id) {
        Ok(Json(pkg.clone()))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

pub async fn handler_graph(
    State(state): State<AppState>,
) -> Result<Json<DepGraphInfo>, StatusCode> {
    Ok(Json(DepGraphInfo {
        nodes: state.graph.node_weights().cloned().map(Into::into).collect(),
        edges: state.graph.edge_weights().cloned().map(Into::into).collect(),
    }))
}

pub async fn handler_nodes(
    State(state): State<AppState>,
) -> Result<Json<DepGraphNodes>, StatusCode> {
    Ok(Json(DepGraphNodes {
        values: state.graph.node_weights().cloned().map(Into::into).collect(),
    }))
}

pub async fn handler_edges(
    State(state): State<AppState>,
) -> Result<Json<DepGraphEdges>, StatusCode> {
    Ok(Json(DepGraphEdges {
        values: state.graph.edge_weights().cloned().map(Into::into).collect(),
    }))
}
