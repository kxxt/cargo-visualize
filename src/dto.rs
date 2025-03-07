use serde::Serialize;

use crate::{dep_info::DepInfo, package::Package};

#[derive(Debug, Clone, Serialize)]
pub struct DepGraphNode {
    pub id: String,
    pub data: Package,
}

impl From<Package> for DepGraphNode {
    fn from(mut package: Package) -> Self {
        // We do not serialize id in package, instead it is serialized here.
        Self { id: std::mem::replace(&mut package.id, Default::default()), data: package }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DepGraphNodes {
    pub values: Vec<DepGraphNode>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DepGraphEdge {
    pub id: String,
    pub source: String,
    pub target: String,
    pub data: DepInfo,
}

impl From<DepInfo> for DepGraphEdge {
    fn from(mut value: DepInfo) -> Self {
        // We do not serialize id in DepInfo, instead it is serialized here.
        Self {
            id: std::mem::replace(&mut value.id, Default::default()),
            source: value.source.clone(),
            target: value.target.clone(),
            data: value,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DepGraphEdges {
    pub values: Vec<DepGraphEdge>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DepGraphInfo {
    pub nodes: Vec<DepGraphNode>,
    pub edges: Vec<DepGraphEdge>,
}
