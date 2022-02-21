import { DiGraph } from "../../dist/index.js";

const contentFileA = `
    import FunctionB from 'B.js';
`;

const contentFileB = `
    import FunctionC from 'C.js';
`;

const contentFileC = `
    import FunctionA from 'A.js';
`;

function detectCycleImports() {
  const diGraph = new DiGraph();

  const fileA = {
    id: "A.js",
    adjacentTo: [],
    payload: { fileContent: contentFileA }
  };
  const fileB = {
    id: "B.js",
    adjacentTo: [],
    payload: { fileContent: contentFileB }
  };
  const fileC = {
    id: "C.js",
    adjacentTo: [],
    payload: { fileContent: contentFileC }
  };

  diGraph.addVertices(fileA, fileB, fileC);

  diGraph.addEdge({ from: fileA, to: fileC });
  diGraph.addEdge({ from: fileB, to: fileA });
  diGraph.addEdge({ from: fileC, to: fileB });

  const { hasCycles, cycles } = diGraph.findCycles();
  const prettyPrintCycles = cycles
    .map((cycle, index) => `Cycle n°${index + 1}: [${cycle.join(" --> ")}]`)
    .join("\n");

  console.log("Has cycle dependencies?", hasCycles);
  console.log(prettyPrintCycles);
}

detectCycleImports();
