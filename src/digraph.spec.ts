/* eslint-disable max-depth */
/* eslint-disable no-inline-comments */
/* eslint-disable line-comment-position */
/* eslint-disable max-nested-callbacks */

import { expect } from "chai";

import { DiGraph } from "./digraph.js";
import { VertexDefinition } from "./vertex.js";

type Vertex = VertexDefinition<any>;

describe("Directed Graph Implementation", () => {
  describe("When adding vertices to the graph", () => {
    it("should add the given vertex to the graph", () => {
      const digraph = new DiGraph();
      const vertexA: Vertex = {
        id: "a",
        adjacentTo: [],
        body: {}
      };

      digraph.addVertex(vertexA);

      expect(digraph.hasVertex(vertexA.id)).to.equal(true);
    });

    it("should avoid duplicates by adding only vertices with unique ids", () => {
      const digraph = new DiGraph();
      const vertexA: Vertex = {
        id: "a",
        adjacentTo: [],
        body: {}
      };
      const vertexB: Vertex = {
        id: "b",
        adjacentTo: [],
        body: {}
      };
      const vertexC: Vertex = {
        id: "c",
        adjacentTo: [],
        body: {}
      };

      digraph.addVertices(vertexA, vertexB, vertexC);
      expect(digraph.toRecord()).to.deep.equal({
        a: { id: "a", adjacentTo: [], body: {} },
        b: { id: "b", adjacentTo: [], body: {} },
        c: { id: "c", adjacentTo: [], body: {} }
      });
      expect(Object.keys(digraph.toRecord()).length).to.equal(3);

      const duplicatedVertexB: Vertex = {
        id: "b",
        adjacentTo: [],
        body: {}
      };
      digraph.addVertices(duplicatedVertexB);
      expect(Object.keys(digraph.toRecord()).length).to.equal(3);
    });
  });

  describe("When adding edges to the graph", () => {
    it("should add edges between vertices", () => {
      const digraph = new DiGraph();
      const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
      const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };
      const vertexC: Vertex = { id: "c", adjacentTo: [], body: {} };

      digraph.addVertices(vertexA, vertexB, vertexC);
      digraph.addEdge({ from: vertexB.id, to: vertexA.id });
      expect(vertexB.adjacentTo).deep.equal([vertexA.id]);

      digraph.addEdge({ from: vertexB.id, to: vertexC.id });
      digraph.addVertices(vertexA, vertexB, vertexC);
      expect(vertexB.adjacentTo).deep.equal([vertexA.id, vertexC.id]);
    });

    it("should only add edges for vertices already added in the graph", () => {
      const digraph = new DiGraph();
      const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
      const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };

      digraph.addVertices(vertexA);
      digraph.addEdge({ from: vertexA.id, to: vertexB.id });

      expect(vertexA.adjacentTo).deep.equal([]);
      expect(digraph.toRecord()).to.deep.equal({
        a: { id: "a", adjacentTo: [], body: {} }
      });
    });

    it("should not add duplicate edges", () => {
      const digraph = new DiGraph();
      const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
      const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };

      digraph.addVertices(vertexA, vertexB);
      digraph.addEdge({ from: vertexB.id, to: vertexA.id });
      digraph.addEdge({ from: vertexB.id, to: vertexA.id });

      expect(vertexB.adjacentTo).deep.equal([vertexA.id]);

      const vertexC: Vertex = { id: "c", adjacentTo: [], body: {} };
      digraph.addVertices(vertexC);
      digraph.addEdge({ from: vertexB.id, to: vertexC.id });
      digraph.addEdge({ from: vertexB.id, to: vertexC.id });
      expect(vertexB.adjacentTo).deep.equal([vertexA.id, vertexC.id]);
    });

    it("should not allow adding an edge from a vertex to the same vertex", () => {
      const digraph = new DiGraph();
      const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };

      digraph.addVertices(vertexA);
      digraph.addEdge({ from: vertexA.id, to: vertexA.id });

      expect(vertexA.adjacentTo).to.deep.equal([]);
    });
  });

  describe("When traversing the graph", () => {
    it("should find all adjacent vertices OF a given vertex", () => {
      const digraph = new DiGraph();
      const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
      const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };
      const vertexC: Vertex = { id: "c", adjacentTo: [], body: {} };
      const vertexD: Vertex = { id: "d", adjacentTo: [], body: {} };

      digraph.addVertices(vertexA, vertexB, vertexC, vertexD);

      digraph.addEdge({ from: vertexB.id, to: vertexA.id });
      expect(digraph.getAdjacentVerticesTo(vertexB)).deep.equal([vertexA]);

      digraph.addEdge({ from: vertexD.id, to: vertexA.id });
      digraph.addEdge({ from: vertexD.id, to: vertexC.id });
      expect(digraph.getAdjacentVerticesTo(vertexD)).deep.equal([
        vertexA,
        vertexC
      ]);
    });

    it("should find all adjacent vertices FROM a given vertex", () => {
      const digraph = new DiGraph();
      const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
      const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };
      const vertexC: Vertex = { id: "c", adjacentTo: [], body: {} };

      digraph.addVertices(vertexA, vertexB, vertexC);

      digraph.addEdge({ from: vertexA.id, to: vertexB.id });
      expect(digraph.getAdjacentVerticesFrom(vertexB)).to.deep.equal([vertexA]);

      digraph.addEdge({ from: vertexC.id, to: vertexB.id });
      expect(digraph.getAdjacentVerticesFrom(vertexB)).to.deep.equal([
        vertexA,
        vertexC
      ]);
    });
  });

  describe("When detecting circular dependencies in the graph", () => {
    describe("When there is only once cycle in the graph", () => {
      describe("When the cycle is starting from the root vertex", () => {
        describe("When using infinite depth limit for detection", () => {
          it("should not detect a cycle between vertices with no edges pointing to each other", () => {
            const digraph = new DiGraph();
            const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
            const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };
            const vertexC: Vertex = { id: "c", adjacentTo: [], body: {} };

            digraph.addVertices(vertexA, vertexB, vertexC);

            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            expect(digraph.findCycles().hasCycles).to.equal(false);

            digraph.addEdge({ from: vertexB.id, to: vertexC.id });
            expect(digraph.findCycles().hasCycles).to.equal(false);
          });

          it("should detect a cycle of depth 1 between vertices with edges pointing to each other", () => {
            const digraph = new DiGraph();
            const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
            const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };

            digraph.addVertices(vertexB, vertexA);

            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            expect(digraph.findCycles().hasCycles).to.equal(false);

            digraph.addEdge({ from: vertexB.id, to: vertexA.id });
            expect(digraph.findCycles().hasCycles).to.equal(true);
            expect(digraph.findCycles().cycles).to.deep.equal(["b", "a"]);
          });

          it("should detect a cycle of depth 2 between vertices with edges pointing to each other", () => {
            const digraph = new DiGraph();
            const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
            const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };
            const vertexC: Vertex = { id: "c", adjacentTo: [], body: {} };
            const vertexD: Vertex = {
              id: "d",
              adjacentTo: [],
              body: {}
            };
            const vertexE: Vertex = { id: "e", adjacentTo: [], body: {} };

            digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE);
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexB.id, to: vertexC.id });
            digraph.addEdge({ from: vertexC.id, to: vertexD.id });
            expect(digraph.findCycles().hasCycles).to.equal(false);

            digraph.addEdge({ from: vertexD.id, to: vertexA.id }); // D ----> A => cycle between A and D traversing B, C
            expect(digraph.findCycles().hasCycles).to.equal(true);
            expect(digraph.findCycles().cycles).to.deep.equal([
              "a",
              "b",
              "c",
              "d"
            ]);
          });

          it("should trace cyclic paths of any given depth", () => {
            const digraph = new DiGraph();
            const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
            const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };
            const vertexC: Vertex = { id: "c", adjacentTo: [], body: {} };
            const vertexD: Vertex = {
              id: "d",
              adjacentTo: [],
              body: {}
            };

            digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
            digraph.addEdge({ from: vertexC.id, to: vertexD.id });
            digraph.addEdge({ from: vertexB.id, to: vertexC.id });
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexD.id, to: vertexA.id }); // D ----> A => cycle between A and D traversing B, C

            expect(digraph.findCycles().cycles).to.deep.equal([
              "a",
              "b",
              "c",
              "d"
            ]);
          });

          it("should keep only one occurrence of a same cyclic path", () => {
            const digraph = new DiGraph();

            const fileA = {
              id: "A.js",
              adjacentTo: [],
              body: { fileContent: "import FunctionB from 'B.js';" }
            };
            const fileB = {
              id: "B.js",
              adjacentTo: [],
              body: { fileContent: "import FunctionC from 'C.js';" }
            };
            const fileC = {
              id: "C.js",
              adjacentTo: [],
              body: { fileContent: "import FunctionA from 'A.js';" }
            };

            digraph.addVertices(fileA, fileB, fileC);
            digraph.addEdge({ from: fileA.id, to: fileB.id });
            digraph.addEdge({ from: fileB.id, to: fileC.id });
            digraph.addEdge({ from: fileC.id, to: fileA.id });

            expect(digraph.findCycles().cycles.length).to.equal(3);
            expect(digraph.findCycles().cycles).to.deep.equal([
              "A.js",
              "B.js",
              "C.js"
            ]);
          });

          it("should only return nodes involved when dealing with direct circular dependency", () => {
            const digraph = new DiGraph();
            const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
            const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };
            const vertexC: Vertex = { id: "c", adjacentTo: [], body: {} };

            digraph.addVertices(vertexC, vertexA, vertexB);
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexB.id, to: vertexC.id });
            expect(digraph.findCycles().hasCycles).to.equal(false);

            digraph.addEdge({ from: vertexB.id, to: vertexA.id });

            const { hasCycles, cycles } = digraph.findCycles();
            expect(hasCycles).to.equal(true);
            expect(cycles).to.deep.equal(["a", "b"]);
          });

          it("should only return nodes involved when dealing with an indirect circular dependency", () => {
            const digraph = new DiGraph();
            const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
            const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };
            const vertexC: Vertex = { id: "c", adjacentTo: [], body: {} };
            const vertexD: Vertex = { id: "d", adjacentTo: [], body: {} };
            const vertexE: Vertex = { id: "e", adjacentTo: [], body: {} };

            digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE);
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexB.id, to: vertexC.id });
            digraph.addEdge({ from: vertexB.id, to: vertexD.id });
            // expect(digraph.findCycles().hasCycles).to.equal(false);

            digraph.addEdge({ from: vertexC.id, to: vertexA.id });
            digraph.addEdge({ from: vertexC.id, to: vertexE.id });

            const { hasCycles, cycles } = digraph.findCycles();
            expect(hasCycles).to.equal(true);
            expect(cycles).to.deep.equal(["a", "b", "c"]);
          });
        });

        describe("When providing a max depth limit for detection", () => {
          it("should not detect any cycle as the specified depth is zero", () => {
            const digraph = new DiGraph();
            const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
            const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };

            digraph.addVertices(vertexA, vertexB);
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexB.id, to: vertexA.id });
            expect(digraph.findCycles({ maxDepth: 0 }).hasCycles).to.equal(
              false
            );
          });

          it("should detect the cycle only when the specified depth is greather than or equal to the depth of the cycle", () => {
            const digraph = new DiGraph();
            const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
            const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };
            const vertexC: Vertex = { id: "c", adjacentTo: [], body: {} };
            const vertexD: Vertex = {
              id: "d",
              adjacentTo: [],
              body: {}
            };

            digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexB.id, to: vertexC.id });
            digraph.addEdge({ from: vertexC.id, to: vertexD.id });
            expect(digraph.findCycles().hasCycles).to.equal(false);

            digraph.addEdge({ from: vertexD.id, to: vertexA.id });
            expect(digraph.findCycles({ maxDepth: 1 }).hasCycles).to.equal(
              false
            );
            expect(digraph.findCycles({ maxDepth: 2 }).hasCycles).to.equal(
              false
            );
            expect(digraph.findCycles({ maxDepth: 3 }).hasCycles).to.equal(
              false
            );
            expect(digraph.findCycles({ maxDepth: 4 }).hasCycles).to.equal(
              true
            );
            expect(digraph.findCycles({ maxDepth: 20 }).hasCycles).to.equal(
              true
            );
          });
        });
      });
    });

    describe("When there are many circular dependencies in the graph", () => {
      describe("When any cycle is starting other than from the root vertex", () => {
        it("should detect the only cycle", () => {
          const digraph = new DiGraph();
          const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
          const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };
          const vertexC: Vertex = { id: "c", adjacentTo: [], body: {} };
          const vertexD: Vertex = { id: "d", adjacentTo: [], body: {} };
          const vertexE: Vertex = { id: "e", adjacentTo: [], body: {} };

          digraph.addVertices(vertexA, vertexB, vertexC, vertexD);

          // root node as it was added first in the graph
          digraph.addEdge({ from: vertexA.id, to: vertexE.id });

          // other vertices that should not be included in the cycle
          digraph.addEdge({ from: vertexC.id, to: vertexA.id });
          digraph.addEdge({ from: vertexB.id, to: vertexC.id });

          // cycle here (C <-> D)
          digraph.addEdge({ from: vertexC.id, to: vertexD.id });
          digraph.addEdge({ from: vertexD.id, to: vertexC.id });

          const { hasCycles, cycles } = digraph.findCycles();
          expect(hasCycles).to.equal(true);
          expect(cycles).to.deep.equal(["c", "d"]);
        });

        it("should detect two inner cycles joining one global cycle", () => {
          const digraph = new DiGraph();
          const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
          const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };
          const vertexC: Vertex = { id: "c", adjacentTo: [], body: {} };
          const vertexD: Vertex = { id: "d", adjacentTo: [], body: {} };

          digraph.addVertices(vertexA, vertexB, vertexC, vertexD);

          // first cycle (A -> B -> C -> A)
          digraph.addEdge({ from: vertexA.id, to: vertexB.id });
          digraph.addEdge({ from: vertexB.id, to: vertexC.id });
          digraph.addEdge({ from: vertexC.id, to: vertexA.id });

          // second cycle (C <-> D)
          digraph.addEdge({ from: vertexC.id, to: vertexD.id });
          digraph.addEdge({ from: vertexD.id, to: vertexC.id });

          const { hasCycles, cycles } = digraph.findCycles();
          expect(hasCycles).to.equal(true);

          expect(cycles).to.deep.equal(["a", "b", "c", "d"]);
        });
      });
    });
  });

  describe("When updating a vertex", () => {
    describe("With no adjacent vertices (no dependencies)", () => {
      it("should only update one vertex with no dependencies", () => {
        const digraph = new DiGraph();
        const vertexA: Vertex = { id: "a", adjacentTo: [], body: {} };
        const vertexE: Vertex = {
          id: "e",
          adjacentTo: [vertexA.id],
          body: {}
        };
        const vertexB: Vertex = { id: "b", adjacentTo: [], body: {} };

        digraph.addVertices(vertexA, vertexB, vertexE);
        digraph.addMutation(vertexB, { body: [] });

        expect(vertexB.body).to.deep.equal({ body: [] });
        expect(vertexA.body).to.deep.equal({});
        expect(vertexE.body).to.deep.equal({});
      });
    });
  });
});
