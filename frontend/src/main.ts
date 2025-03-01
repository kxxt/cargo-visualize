import './style.css'
import './graph.css'
import cytoscape from 'cytoscape';

// document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
//     <div id="topbar"></div>
//     <div id="graph"></div>
//     <div id="sidebar"></div>
// `

const graph = cytoscape({
  container: document.getElementById('graph'),
  elements: [ // list of graph elements to start with
    { // node a
      data: { id: 'tokio-1.0.0', package: "tokio", version: "1.0.0" },
    },
    { // node b
      data: { id: 'rand-0.9.0', package: "rand", version: "0.9.0" }
    },
    { // node a
      data: { id: 'tokio-1.1.0', package: "tokio", version: "1.0.0" },
    },
    { // node b
      data: { id: 'rand-1.0.0', package: "rand", version: "0.9.0" }
    },
    { // edge ab
      data: { id: 'tokio-1.0.0 depends on rand-0.9.0', source: 'tokio-1.0.0', target: 'rand-0.9.0' }
    },
    { // edge ab
      data: { id: 'tokio-1.1.0 depends on rand-1.0.0', source: 'tokio-1.1.0', target: 'rand-1.0.0' }
    }
  ],
  style: [ // the stylesheet for the graph
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(id)'
      }
    },
  ]
});

graph.on('select', 'node', (event) => {
  const data = event.target.data();
  document.getElementById("sidebar")!.innerHTML = `
    <p>name: ${data.package}</p>
    <p>version: ${data.version}</p>
  `
});

document.getElementById("reset")!.addEventListener("click", () => {
  graph.reset()
})

document.getElementById("layout")!.addEventListener("click", () => {
  const layout = graph.layout({ name: "random" });
  layout.run()
})

