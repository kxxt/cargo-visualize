use serde::Serialize;

use crate::{dep_info::DepInfo, package::Package};

#[derive(Debug, Clone, Serialize)]
pub struct DepGraphNode {
    #[serde(flatten)]
    pub package: Package,
}

impl From<Package> for DepGraphNode {
    fn from(package: Package) -> Self {
        Self {
            package,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct DepGraphNodes {
    pub values: Vec<DepGraphNode>
}

#[derive(Debug, Clone, Serialize)]
pub struct DepGraphEdges {
    pub values: Vec<DepInfo>,
}
