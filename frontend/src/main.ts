import './style.css'
import './graph.css'
import 'bulma/css/bulma.min.css'
import { ExtensionCategory, Graph, GraphEvent, NodeEvent, register } from '@antv/g6';
import { DepNode } from './dep-node';
import layouts from './layouts';
import { DepEdge } from './dep-edge';
import { labelText } from './pure';
import { labelFontFamily } from './constants';
import { clearTags, insertBadge, insertTag } from './tag';
import { hideElement, showElement } from './dom';

let loaded = false;

const ENDPOINT = "http://127.0.0.1:3000"

let data = await fetch(`${ENDPOINT}/graph`).then(res => res.json());

const graphWidth = () => window.innerWidth - document.getElementById("sidebar")!.clientWidth;

const layoutElement = document.getElementById("layout")! as HTMLSelectElement;
const resetElement = document.getElementById("reset")! as HTMLSelectElement;
const degreeElement = document.getElementById("select-degree")! as HTMLSelectElement;
const searchElement = document.getElementById("search")! as HTMLInputElement;
const infoHeading = document.getElementById("info-heading")!;
const infoSubheading = document.getElementById("info-subheading")!;
const infoTags = document.getElementById("info-tags")!;
const infoDescription = document.getElementById("info-description")!;
const infoLicehnse = document.getElementById("info-license")!;
const searchResultElements = new Set<string>();

const crateCache = new Map();

register(ExtensionCategory.NODE, 'dep-node', DepNode)
register(ExtensionCategory.EDGE, 'dep-edge', DepEdge)

const graph = new Graph({
  container: 'graph',
  width: graphWidth(),
  autoFit: 'view',
  data,
  node: {
    type: "dep-node",
    style: {
      labelText,
      labelFontSize: 10,
      labelPlacement: 'center',
      fill: (node) => {
        let data: any = node.data
        if (data?.is_ws_member)
          return "cyan"
        else if (data?.dep_info!.is_target_dep)
          return "grey"
        else
          return "white"
      },
      stroke: "#222",
      lineWidth: 1,
      badge: true
    },
    state: {
      "selected": {
        stroke: "orange",
        lineWidth: 4,
        labelFontSize: 10,
        labelFontFamily,
      },
      "search-result": {
        stroke: "green",
        lineWidth: 4,
        labelFontSize: 10,
        labelFontFamily,
      }
    }
  },
  edge: {
    type: "dep-edge",
    style: {
      endArrow: true,
      endArrowSize: 7,
      lineWidth: 2,
    },
    state: {
      "selected": {
        stroke: "orange",
        lineWidth: 3,
      }
    }
  },
  layout: layouts[layoutElement.value],
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element',
    { key: 'click-select', type: 'click-select', degree: parseInt(degreeElement.value) }],
  plugins: [
    {
      type: 'minimap',
      size: [240, 160],
    },
  ],
});

// @ts-ignore
globalThis.graph = graph;

graph.render();

window.addEventListener("resize", (ev) => {
  graph.setSize(graphWidth(), 0)
  graph.resize()
})

graph.on(NodeEvent.CLICK, async (e: Event) => {
  let target = e.target as any;
  let meta = crateCache.get(target.id);
  if (!meta) {
    meta = await fetch(`${ENDPOINT}/package/${target.id}`).then(x => x.json());
    crateCache.set(target.id, meta)
  }
  let node = graph.getElementData(target.id);
  let data: any = node.data
  // Basic
  infoHeading.innerText = `Crate ${data.name}`
  infoSubheading.innerText = `version ${data.version}`
  // Tags
  clearTags(infoTags)
  if (data.is_ws_member) {
    insertTag("primary", "Workspace", infoTags)
  }
  if (data.dep_info.is_dev) {
    insertTag("warning", "Dev", infoTags)
  }
  if (data.dep_info.is_build) {
    insertTag("info", "Build", infoTags)
  }
  if (data.dep_info.is_normal) {
    insertTag("link", "Normal", infoTags)
  }
  if (data.dep_info.is_target_dep) {
    insertTag("success", "Target Specific", infoTags)
  }
  if (data.dep_info.is_optional) {
    insertTag("white", "Optional", infoTags)
  }
  if (data.is_proc_macro) {
    insertTag("danger", "proc-macro", infoTags)
  }
  if (meta.rust_version) {
    insertBadge("warning", "Rust", meta.rust_version, infoTags)
  }
  if (meta.edition) {
    insertBadge("success", "Edition", meta.edition, infoTags)
  }
  // Metadata
  if (meta.description) {
    infoDescription.innerText = meta.description
    showElement(infoDescription)
  } else {
    hideElement(infoDescription)
  }
  console.log(meta);
})

graph.on(GraphEvent.BEFORE_LAYOUT, () => {
  layoutElement.disabled = true;
  resetElement.disabled = true;
})

graph.on(GraphEvent.AFTER_LAYOUT, () => {
  layoutElement.disabled = false;
  resetElement.disabled = false;
})


document.getElementById("reset")!.addEventListener("click", () => {
  graph.layout();
})

document.getElementById("layout")!.addEventListener("change", (e) => {
  let target = e.target as any;
  graph.setLayout(layouts[target.value])
  graph.layout()
  graph.render()
})

document.getElementById("select-degree")!.addEventListener("change", (e) => {
  let target = e.target as any;
  graph.updateBehavior({ key: "click-select", degree: parseInt(target.value) })
})

document.getElementById("search")!.addEventListener("keyup", (e) => {
  let target = e.target as any;
  // Clear states
  for (let id of searchResultElements) {
    graph.setElementState(id, graph.getElementState(id).filter(x => x !== "search-result"))
  }
  if (!target.value)
    return;
  // Update states
  graph.getNodeData().forEach((v) => {
    let name: string = v.data?.name as string;
    if (name.includes(target.value)) {
      searchResultElements.add(v.id);
      const states = graph.getElementState(v.id)
      states.unshift('search-result')
      graph.setElementState(v.id, states)
    }
  })
})

window.addEventListener("load", () => searchElement.value = '')