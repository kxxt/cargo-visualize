import './style.css'
import 'bulma/css/bulma.min.css'
import { ExtensionCategory, Graph, GraphEvent, NodeEvent, register } from '@antv/g6';
import { DepNode } from './dep-node';
import layouts from './layouts';
import { DepEdge } from './dep-edge';
import { labelText } from './pure';
import { ENDPOINT, labelFontFamily } from './constants';
import { prepare_info_tab } from './info';

let data = await fetch(`${ENDPOINT}/graph`).then(res => res.json());

const graphWidth = () => window.innerWidth - document.getElementById("sidebar")!.clientWidth;
const graphHeight = () => window.innerHeight - document.getElementById("topbar")!.clientHeight;

const layoutElement = document.getElementById("layout")! as HTMLSelectElement;
const resetElement = document.getElementById("reset")! as HTMLSelectElement;
const degreeElement = document.getElementById("select-degree")! as HTMLSelectElement;
const searchElement = document.getElementById("search")! as HTMLInputElement;
const sideBar = document.getElementById("sidebar")!;
const graphContainer = document.getElementById("graph")!;
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

graph.on(NodeEvent.CLICK, async (e: Event) => {
  let target = e.target as any;
  let meta = crateCache.get(target.id);
  if (!meta) {
    meta = await fetch(`${ENDPOINT}/package/${target.id}`).then(x => x.json());
    crateCache.set(target.id, meta)
  }
  let node = graph.getElementData(target.id);
  let data: any = node.data
  prepare_info_tab(target.id, meta, data)
})

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

function rem2px(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

const resizeData = {
  tracking: false,
  startWidth: 0,
  startCursorScreenX: 0,
  maxWidth: window.innerWidth / 2,
  minWidth: rem2px(20),
};

const resizeHandle = document.getElementById("resize-handle")!;

resizeHandle.addEventListener('mousedown', (e) => {
  if (e.button !== 0)
    return;

  e.preventDefault();
  e.stopPropagation();

  resizeData.startWidth = sideBar.getBoundingClientRect().width;
  resizeData.startCursorScreenX = e.screenX;
  resizeData.tracking = true;
})

window.addEventListener('mousemove', (event) => {
  if (resizeData.tracking) {
    const cursorScreenXDelta = resizeData.startCursorScreenX - event.screenX;
    const newWidth = Math.max(resizeData.minWidth, Math.min(resizeData.startWidth + cursorScreenXDelta, resizeData.maxWidth));
    const graphWidth = window.innerWidth - newWidth;

    sideBar.style.width = `${newWidth}px`;
    graphContainer.style.width = `${graphWidth}px`
    graph.setSize(graphWidth, graphHeight())
  }
});

window.addEventListener('mouseup', () => {
  if (resizeData.tracking) {
    resizeData.tracking = false;
  }
});

window.addEventListener("resize", () => {
  if (graphContainer.style.width) {
    // If we have manually resized the sidebar
    graphContainer.style.width = `${graphWidth()}px`;
  }
  graph.setSize(graphWidth(), 0)
  graph.resize()
  graph.updatePlugin({
    key: 'minimap',
    size: [160 * graphWidth() / graphHeight(), 160],
  })
})
