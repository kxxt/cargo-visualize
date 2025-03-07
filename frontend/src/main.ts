import './style.css'
import './graph.css'
import { ExtensionCategory, Graph, NodeEvent, register } from '@antv/g6';
import { DepNode } from './dep-node';
import layouts from './layouts';

let loaded = false;

let data = await fetch("http://127.0.0.1:3000/graph").then(res => res.json());

const graphWidth = () => window.innerWidth - document.getElementById("sidebar")!.clientWidth;


register(ExtensionCategory.NODE, 'dep-node', DepNode)

const layoutElement = document.getElementById("layout")! as HTMLSelectElement;

const graph = new Graph({
  container: 'graph',
  width: graphWidth(),
  autoFit: 'view',
  data,
  node: {
    type: "dep-node",
    style: {
      labelText: (d: any) => d.id,
      labelFontSize: 10,
      labelPlacement: 'center',
      fill: "white",
      stroke: "#222",
      lineWidth: 1
    },
    state: {
      "selected": {
        stroke: "orange",
        strokeWidth: 2,
        labelFontSize: 10,
        labelShadowColor: "red",
        labelTextDecorationColor: "red"
      }
    }
  },
  edge: {
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
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element', 'click-select'],
});

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
