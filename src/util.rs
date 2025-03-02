use std::{collections::HashMap, sync::{atomic::{AtomicU16, Ordering}, Arc}};

use cargo_metadata::{Package as MetaPackage, TargetKind};

use crate::graph::DepGraph;

pub(crate) fn set_name_stats(graph: &mut DepGraph) {
    let mut name_uses_map = HashMap::<String, Arc<AtomicU16>>::new();
    for pkg in graph.node_weights_mut() {
        let name_uses = name_uses_map.entry(pkg.name.clone()).or_default();
        name_uses.fetch_add(1, Ordering::SeqCst);

        pkg.name_uses = Some(name_uses.clone());
    }
}

pub(crate) fn is_proc_macro(pkg: &MetaPackage) -> bool {
    let res = pkg.targets.iter().any(|t| t.kind.iter().any(|k| k == &TargetKind::ProcMacro));
    if res && pkg.targets.iter().any(|t| t.kind.iter().any(|k| k == &TargetKind::Lib)) {
        eprintln!("encountered a crate that is both a regular library and a proc-macro");
    }

    res
}
