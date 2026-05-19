import { Graph } from "@antv/g6";
import { prepareDetailHeader as prepareDetailHeader } from "./info";
import { insertTag } from "./tag";

export function prepareRelTab(graph: Graph, id: string, meta: any, data: any) {
    prepareDetailHeader(id, meta, data)
    prepareDependencies(graph, id)
    prepareDependents(graph, id)
}

const dependentTable = document.getElementById("rel-rdepend-table")!.children[0];
const dependencyTable = document.getElementById("rel-depend-table")!.children[0];

function prepareDependencies(graph: Graph, id: string) {
    let dependEdges = graph.getRelatedEdgesData(id, 'out')
    dependencyTable.innerHTML = '';
    // TODO: show edge relation (e.g. cfg(windows))
    for (const edge of dependEdges) {
        let tr = document.createElement("tr");
        let td = document.createElement("td");
        tr.appendChild(td);
        let dependency = graph.getElementData(edge.target);
        td.innerText = `${edge.target}`;
        let tags = document.createElement("div");
        tags.className = "field is-grouped is-grouped-multiline";
        if (dependency.data?.is_ws_member) {
            insertTag("primary", "Workspace", tags)
        }
        if (edge.data?.is_dev) {
            insertTag("warning", "Dev", tags)
        }
        if (edge.data?.is_build) {
            insertTag("info", "Build", tags)
        }
        if (edge.data?.is_normal) {
            insertTag("link", "Normal", tags)
        }
        if (edge.data?.is_target_dep) {
            insertTag("success", "Target Specific", tags)
        }
        if (edge.data?.is_optional) {
            insertTag("white", "Optional", tags)
        }
        if (dependency.data?.is_proc_macro) {
            insertTag("danger", "proc-macro", tags)
        }
        td.appendChild(tags)
        dependencyTable.appendChild(
            tr
        )
    }
}

function prepareDependents(graph: Graph, id: string) {
    let rdependEdges = graph.getRelatedEdgesData(id, 'in')
    dependentTable.innerHTML = '';
    // TODO: show edge relation (e.g. cfg(windows))
    for (const edge of rdependEdges) {
        let tr = document.createElement("tr");
        let td = document.createElement("td");
        tr.appendChild(td);
        let dependency = graph.getElementData(edge.source);
        td.innerText = `${edge.source}`;
        let tags = document.createElement("div");
        tags.className = "field is-grouped is-grouped-multiline";
        if (dependency.data?.is_ws_member) {
            insertTag("primary", "Workspace", tags)
        }
        if (edge.data?.is_dev) {
            insertTag("warning", "Dev", tags)
        }
        if (edge.data?.is_build) {
            insertTag("info", "Build", tags)
        }
        if (edge.data?.is_normal) {
            insertTag("link", "Normal", tags)
        }
        if (edge.data?.is_target_dep) {
            insertTag("success", "Target Specific", tags)
        }
        if (edge.data?.is_optional) {
            insertTag("white", "Optional", tags)
        }
        if (dependency.data?.is_proc_macro) {
            insertTag("danger", "proc-macro", tags)
        }
        td.appendChild(tags)
        dependentTable.appendChild(
            tr
        )
    }
}
