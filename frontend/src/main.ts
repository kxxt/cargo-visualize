import './style.css'
import './graph.css'
import { ExtensionCategory, Graph, GraphEvent, NodeEvent, register } from '@antv/g6';
import { DepNode } from './dep-node';
import layouts from './layouts';
import { DepEdge } from './dep-edge';
import { labelText } from './pure';
import { labelFontFamily } from './constants';

let loaded = false;

let data = await fetch("http://127.0.0.1:3000/graph").then(res => res.json());

const graphWidth = () => window.innerWidth - document.getElementById("sidebar")!.clientWidth;

const layoutElement = document.getElementById("layout")! as HTMLSelectElement;
const degreeElement = document.getElementById("select-degree")! as HTMLSelectElement;

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
        if (node.data?.is_ws_member)
          return "cyan"
        else
          return "white"
      },
      stroke: "#222",
      lineWidth: 1
    },
    state: {
      "selected": {
        stroke: "orange",
        strokeWidth: 2,
        labelFontSize: 10,
        labelFontFamily,
        labelShadowColor: "red",
        labelTextDecorationColor: "red"
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
});

// @ts-ignore
globalThis.graph = graph;

graph.render();

window.addEventListener("resize", (ev) => {
  graph.setSize(graphWidth(), 0)
  graph.resize()
})

graph.on(NodeEvent.CLICK, (e: Event) => {
  let target = e.target as any;
  let data = graph.getElementData(target.id);
  console.log(data);
})

graph.on(GraphEvent.BEFORE_LAYOUT, () => {
  layoutElement.disabled = true;
})

graph.on(GraphEvent.AFTER_LAYOUT, () => {
  layoutElement.disabled = false;
})


document.getElementById("reset")!.addEventListener("click", () => {
  graph.layout();
})

document.getElementById("layout")!.addEventListener("change", (e) => {
  let target = e.target as any;
  console.log(target.value)
  graph.setLayout(layouts[target.value])
  graph.layout()
  graph.render()
})

document.getElementById("select-degree")!.addEventListener("change", (e) => {
  let target = e.target as any;
  graph.updateBehavior({ key: "click-select", degree: parseInt(target.value) })
})