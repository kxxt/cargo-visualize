import './style.css'
import './graph.css'
import cytoscape from 'cytoscape';

let loaded = false;
const graph = cytoscape({
  container: document.getElementById('graph'),
  style: [
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

// Load nodes and edges
window.addEventListener("load", async () => {
  // Nodes
  var resp = await fetch("http://127.0.0.1:3000/nodes");
  let nodes = (await resp.json()).values;
  for (let node of nodes) {
    graph.add({
      data: node
    })
  }
  // Edges
  var resp = await fetch("http://127.0.0.1:3000/edges");
  let edges = (await resp.json()).values;
  for (let edge of edges) {
    graph.add({
      data: edge
    })
  }
  loaded = true;
}) 