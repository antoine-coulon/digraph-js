import { readFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { DiGraph } from "../../dist/index.js";

{
  console.log("----------------------------------------");
  const data = await readFile(path.join(process.cwd(), "./webpack.json"));
  const graph = new DiGraph();
  for (const [nodeId, nodeValue] of Object.entries(JSON.parse(data))) {
    graph.addVertex({ id: nodeId, adjacentTo: nodeValue.adjacentTo, body: {} });
  }
  const start = performance.now();
  console.log("Started webpack benchmark with cycle detection = INFINITY");
  const cycles = graph.findCycles();
  const end = performance.now() - start;
  console.log(`${cycles.length} cycles found`);
  console.log(
    `Took ${(end / 1000).toFixed(3)} seconds to find cycles on Webpack`
  );
}

{
  console.log("----------------------------------------");
  const data = await readFile(path.join(process.cwd(), "./webpack.json"));
  const graph = new DiGraph();
  for (const [nodeId, nodeValue] of Object.entries(JSON.parse(data))) {
    graph.addVertex({ id: nodeId, adjacentTo: nodeValue.adjacentTo, body: {} });
  }
  const start = performance.now();
  console.log("Started webpack benchmark with cycle detection = 500");
  const cycles = graph.findCycles({ maxDepth: 500 });
  const end = performance.now() - start;
  console.log(`${cycles.length} cycles found`);
  console.log(
    `Took ${(end / 1000).toFixed(3)} seconds to find cycles on Webpack`
  );
}

{
  console.log("----------------------------------------");
  const data = await readFile(path.join(process.cwd(), "./webpack.json"));
  const graph = new DiGraph();
  for (const [nodeId, nodeValue] of Object.entries(JSON.parse(data))) {
    graph.addVertex({ id: nodeId, adjacentTo: nodeValue.adjacentTo, body: {} });
  }
  const start = performance.now();
  console.log("Started webpack benchmark with cycle detection = 100");
  const cycles = graph.findCycles({ maxDepth: 100 });
  const end = performance.now() - start;
  console.log(`${cycles.length} cycles found`);
  console.log(
    `Took ${(end / 1000).toFixed(3)} seconds to find cycles on Webpack`
  );
}

{
  console.log("----------------------------------------");
  const data = await readFile(path.join(process.cwd(), "./webpack.json"));
  const graph = new DiGraph();
  for (const [nodeId, nodeValue] of Object.entries(JSON.parse(data))) {
    graph.addVertex({ id: nodeId, adjacentTo: nodeValue.adjacentTo, body: {} });
  }
  const start = performance.now();
  console.log("Started webpack benchmark with cycle detection = 20");
  const cycles = graph.findCycles({ maxDepth: 20 });
  const end = performance.now() - start;
  console.log(`${cycles.length} cycles found`);
  console.log(
    `Took ${(end / 1000).toFixed(3)} seconds to find cycles on Webpack`
  );
}
