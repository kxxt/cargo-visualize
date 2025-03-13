import './style.css'
import 'bulma/css/bulma.min.css'
import { ExtensionCategory, Graph, GraphEvent, NodeEvent, register } from '@antv/g6';
import { DepNode } from './dep-node';
import layouts from './layouts';
import { DepEdge } from './dep-edge';
import { labelText } from './pure';
import { labelFontFamily } from './constants';
import { clearTags, insertBadge, insertRawTag, insertTag } from './tag';
import { hideElement, showElement } from './dom';

let loaded = false;
const params = new URLSearchParams(window.location.search);
const port = parseInt(params.get("backend") || "8913");
const ENDPOINT = import.meta.env.DEV ? `http://127.0.0.1:${port}` : ""

let data = await fetch(`${ENDPOINT}/graph`).then(res => res.json());

const graphWidth = () => window.innerWidth - document.getElementById("sidebar")!.clientWidth;
const graphHeight = () => window.innerHeight - document.getElementById("topbar")!.clientHeight;

const layoutElement = document.getElementById("layout")! as HTMLSelectElement;
const resetElement = document.getElementById("reset")! as HTMLSelectElement;
const degreeElement = document.getElementById("select-degree")! as HTMLSelectElement;
const searchElement = document.getElementById("search")! as HTMLInputElement;
const infoHeading = document.getElementById("info-heading")!;
const infoSubheading = document.getElementById("info-subheading")!;
const infoTags = document.getElementById("info-tags")!;
const infoDescription = document.getElementById("info-description")!;
const infoLicense = document.getElementById("info-license")!;
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
        else if (data?.dep_info.is_optional) {
          if (data?.dep_info!.is_target_dep) {
            return "#93b48b"
          } else {
            return "#bcebcb"
          }
        }
        else if (data?.dep_info!.is_target_dep)
          return "#aaa"
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
      key: 'minimap',
      type: 'minimap',
      size: [160 * graphWidth() / graphHeight(), 160],
      position: [0, 0],
      containerStyle: {
      }
    },
  ],
});

// @ts-ignore
globalThis.graph = graph;

graph.render();

window.addEventListener("resize", () => {
  graph.setSize(graphWidth(), 0)
  graph.resize()
  graph.updatePlugin({
    key: 'minimap',
    size: [160 * graphWidth() / graphHeight(), 160],
  })
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
  infoHeading.innerText = `${data.name}`
  infoSubheading.innerText = `${data.version}`
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
  handleLicense(meta, target.id)
  handleFeatures(meta)
  handleAuthors(meta)
  handlePlainField(meta, 'source')
  handlePlainField(meta, 'homepage', urlMapField)
  handlePlainField(meta, 'repository', urlMapField)
  handlePlainField(meta, 'documentation', urlMapField)
  handlePlainField(meta, 'keywords', tagsFieldMaper('primary'))
  handlePlainField(meta, 'categories', tagsFieldMaper('warning'))
  handlePlainField(meta, 'links')
  handlePlainField(meta, 'manifest_path', openFieldMapper(target.id))
  handlePlainField(meta, 'readme', openFieldMapper(target.id))
})

function urlMapField(field: string): HTMLElement {
  let ele = document.createElement('a');
  ele.innerText = field
  ele.href = field
  ele.target = '_blank'
  return ele
}

function openFieldMapper(id: string) {
  return (_value: any, field: string) => {
    let ele = document.createElement('a');
    ele.innerText = "Open..."
    ele.href = `javascript:`;
    ele.onclick = () => {
      console.log(`opening ${field} for ${id}`);
      const fail = () => alert(`Failed to open ${field} for ${id}, please check the console of cargo-visualize for more details`);
      const req = new Request(`${ENDPOINT}/open/${id}/${field}`, {
        method: "POST"
      });
      fetch(req).catch(fail).then(
        (resp) => {
          if (!resp?.ok) {
            fail()
          }
        }
      )
    }
    return ele
  }
}

function tagsFieldMaper(kind: string) {
  return (field: [string]) => {
    let ele = document.createElement('div');
    ele.className = 'tags'
    for (const f of field) {
      insertRawTag(`light is-${kind}`, f, ele)
    }
    return ele
  }
}

function handleAuthors(meta: any) {
  handlePlainField(meta, 'authors', (authors: [string]) => {
    let ele = document.createElement('p');
    let text = authors.reduce((acc, x) => `${acc}\n${x}`)
    ele.innerText += text
    return ele
  })
}

function handleFeatures(meta: any) {
  let tr = document.getElementById(`info-features`)!
  if (meta.features && Object.keys(meta.features).length > 0) {
    handlePlainField(meta, 'features', (features: any) => {
      let ele = document.createElement('div');
      ele.className = 'tags'
      for (const f of Object.keys(features)) {
        insertRawTag(`light is-info`, f, ele)
      }
      return ele
    })
  } else {
    hideElement(tr)
  }
}

function handleLicense(meta: any, id: string) {
  let tr = document.getElementById(`info-license`)!
  if (meta.license) {
    handlePlainField(meta, 'license')
  } else if (meta.license_file) {
    handlePlainField(meta, 'license', openFieldMapper(id), 'license_file')
  } else {
    hideElement(tr)
  }
}

function handlePlainField(meta: any, field: string, map?: Function | undefined, manifest_field?: string) {
  let tr = document.getElementById(`info-${field}`)!
  let td = tr.lastElementChild! as HTMLTableCellElement;
  manifest_field = manifest_field ?? field;
  if ((meta[manifest_field] && !Array.isArray(meta[manifest_field])) || (Array.isArray(meta[manifest_field]) && meta[manifest_field].length > 0)) {
    if (map) {
      td.innerHTML = ''
      td.appendChild(map(meta[manifest_field], field))
    } else {
      td.innerText = meta[manifest_field]
    }
    showElement(tr)
  } else {
    hideElement(tr)
  }
}

graph.on(GraphEvent.BEFORE_LAYOUT, () => {
  layoutElement.disabled = true;
  resetElement.disabled = true;
})

graph.on(GraphEvent.AFTER_LAYOUT, () => {
  layoutElement.disabled = false;
  resetElement.disabled = false;
})

document.getElementById("zoom-in")!.addEventListener("click", () => {
  graph.zoomBy(1.25)
})

document.getElementById("zoom-out")!.addEventListener("click", () => {
  graph.zoomBy(0.75)
})

document.getElementById("fit")!.addEventListener("click", () => {
  graph.fitView();
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