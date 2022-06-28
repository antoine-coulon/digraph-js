import { DiGraph } from "../../dist/index.js";

const contentFileA = `
    import FunctionB from 'B.js';
`;

const contentFileB = `
    import FunctionC from 'C.js';
`;

const contentFileC = `
    import FunctionA from 'A.js';
    import FunctionD from 'D.js';
`;

const contentFileD = `
    import FunctionC from 'c.js';
`;

function detectCyclicImports() {
  const diGraph = new DiGraph();

  const fileA = {
    id: "A.js",
    adjacentTo: [],
    // metadata to simulate a real use case, this is not used to detect cycles
    body: { fileContent: contentFileA }
  };
  const fileB = {
    id: "B.js",
    adjacentTo: [],
    // metadata to simulate a real use case, this is not used to detect cycles
    body: { fileContent: contentFileB }
  };
  const fileC = {
    id: "C.js",
    adjacentTo: [],
    // metadata to simulate a real use case, this is not used to detect cycles
    body: { fileContent: contentFileC }
  };
  const fileD = {
    id: "D.js",
    adjacentTo: [],
    // metadata to simulate a real use case, this is not used to detect cycles
    body: { fileContent: contentFileD }
  };

  diGraph.addVertices(fileA, fileB, fileC, fileD);

  diGraph.addEdge({ from: fileA.id, to: fileC.id });
  diGraph.addEdge({ from: fileB.id, to: fileA.id });
  diGraph.addEdge({ from: fileC.id, to: fileB.id });

  diGraph.addEdge({ from: fileC.id, to: fileD.id });
  diGraph.addEdge({ from: fileD.id, to: fileC.id });

  const { hasCycles, cycles } = diGraph.findCycles();
  const prettyPrintCycles = cycles
    .map((cycle, index) => `Cycle n°${index + 1}: [${cycle.join(" --> ")}]`)
    .join("\n");

  console.log("Has cycle dependencies?", hasCycles);
  console.log(prettyPrintCycles);
}

detectCyclicImports();
