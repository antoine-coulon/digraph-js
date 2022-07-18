/* eslint-disable max-depth */
/* eslint-disable no-inline-comments */
/* eslint-disable line-comment-position */
/* eslint-disable max-nested-callbacks */

import { expect } from "chai";

import { DiGraph } from "./digraph.js";
import { VertexDefinition, VertexId } from "./vertex.js";

type Vertex = VertexDefinition<any>;

function* createRawVertices(...ids: VertexId[]): Generator<Vertex> {
  for (const id of ids) {
    yield {
      id,
      adjacentTo: [],
      body: {}
    };
  }
}

describe("Directed Graph Implementation", () => {
  describe("When managing vertices in the graph", () => {
    describe("When adding vertices", () => {
      it("should add the given vertex to the graph", () => {
        const digraph = new DiGraph();
        const [vertexA] = [...createRawVertices("a")];

        digraph.addVertex(vertexA);

        expect(digraph.hasVertex(vertexA.id)).to.equal(true);
      });

      it("should not add vertices already in the graph", () => {
        const digraph = new DiGraph();

        function expectGraphStructure() {
          expect(Object.keys(digraph.toDict()).length).to.equal(3);
          expect(digraph.toDict()).to.deep.equal({
            a: { id: "a", adjacentTo: [], body: {} },
            b: { id: "b", adjacentTo: [], body: {} },
            c: { id: "c", adjacentTo: [], body: {} }
          });
        }

        const [vertexA, vertexB, vertexBis, vertexC] = [
          ...createRawVertices("a", "b", "b", "c")
        ];

        digraph.addVertices(vertexA, vertexB, vertexBis, vertexC);

        expectGraphStructure();

        const duplicatedVertexB: Vertex = {
          id: "b",
          adjacentTo: [],
          body: { someComponent: "x" }
        };

        digraph.addVertices(duplicatedVertexB);

        expectGraphStructure();

        digraph.addVertex(duplicatedVertexB);

        expectGraphStructure();
      });
    });

    describe("When updating vertices", () => {
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
        digraph.updateVertexBody(vertexB, {
          body: {
            brandNewProp: "newValue"
          }
        });

        expect(vertexB.body).to.deep.equal({
          body: { brandNewProp: "newValue" }
        });
        expect(vertexA.body).to.deep.equal({});
        expect(vertexE.body).to.deep.equal({});
      });
    });

    describe("When deleting vertices", () => {
      describe("When no vertices depends on the deleted one", () => {
        it("should only delete the isolated vertex", () => {
          const digraph = new DiGraph();
          const [vertexA, vertexB, vertexC, vertexD] = [
            ...createRawVertices("a", "b", "c", "d")
          ];

          digraph.addVertices(vertexA, vertexB, vertexC, vertexD);

          expect(digraph.toDict()).to.deep.equal({
            a: vertexA,
            b: vertexB,
            c: vertexC,
            d: vertexD
          });

          digraph.deleteVertex(vertexC.id);

          expect(digraph.toDict()).to.deep.equal({
            a: vertexA,
            b: vertexB,
            d: vertexD
          });
        });
      });

      describe("When one or many vertices directly depends on the deleted one", () => {
        it("should delete the vertex and update the adjacency list of vertices directly depending on it", () => {
          const digraph = new DiGraph();
          const [vertexA, vertexB, vertexC, vertexD] = [
            ...createRawVertices("a", "b", "c", "d")
          ];

          digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
          digraph.addEdge({ from: vertexA.id, to: vertexD.id });
          digraph.addEdge({ from: vertexB.id, to: vertexD.id });
          digraph.addEdge({ from: vertexB.id, to: vertexC.id });
          digraph.addEdge({ from: vertexC.id, to: vertexA.id });

          expect(digraph.toDict()).to.deep.equal({
            a: { ...vertexA, adjacentTo: [vertexD.id] },
            b: { ...vertexB, adjacentTo: [vertexD.id, vertexC.id] },
            c: { ...vertexC, adjacentTo: [vertexA.id] },
            d: { ...vertexD, adjacentTo: [] }
          });

          digraph.deleteVertex(vertexD.id);

          expect(digraph.toDict()).to.deep.equal({
            a: { ...vertexA, adjacentTo: [] },
            b: { ...vertexB, adjacentTo: [vertexC.id] },
            c: { ...vertexC, adjacentTo: [vertexA.id] }
          });
        });
      });
    });
  });

  describe("When managing edges in the graph", () => {
    describe("When adding edges to the graph", () => {
      it("should add edges between vertices", () => {
        const digraph = new DiGraph();
        const [vertexA, vertexB, vertexC] = [
          ...createRawVertices("a", "b", "c")
        ];

        digraph.addVertices(vertexA, vertexB, vertexC);
        digraph.addEdge({ from: vertexB.id, to: vertexA.id });

        expect(vertexB.adjacentTo).deep.equal([vertexA.id]);

        digraph.addEdge({ from: vertexB.id, to: vertexC.id });
        digraph.addVertices(vertexA, vertexB, vertexC);

        expect(vertexB.adjacentTo).deep.equal([vertexA.id, vertexC.id]);
      });

      it("should only add edges for vertices already added in the graph", () => {
        const digraph = new DiGraph();
        const [vertexA, vertexB] = [...createRawVertices("a", "b")];

        digraph.addVertices(vertexA);
        digraph.addEdge({ from: vertexA.id, to: vertexB.id });

        expect(vertexA.adjacentTo).deep.equal([]);
        expect(digraph.toDict()).to.deep.equal({
          a: { id: "a", adjacentTo: [], body: {} }
        });
      });

      it("should not add duplicate edges", () => {
        const digraph = new DiGraph();
        const [vertexA, vertexB, vertexC] = [
          ...createRawVertices("a", "b", "c")
        ];

        digraph.addVertices(vertexA, vertexB, vertexC);
        digraph.addEdge({ from: vertexB.id, to: vertexA.id });
        digraph.addEdge({ from: vertexB.id, to: vertexA.id });

        expect(vertexB.adjacentTo).deep.equal([vertexA.id]);

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
  });

  describe("When traversing the graph", () => {
    describe("When searching for direct (upper or lower) dependencies", () => {
      it("should find all lower adjacent vertices from a given vertex", () => {
        const digraph = new DiGraph();
        const [vertexA, vertexB, vertexC, vertexD] = [
          ...createRawVertices("a", "b", "c", "d")
        ];

        digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
        digraph.addEdge({ from: vertexB.id, to: vertexA.id });

        expect(digraph.getLowerDependencies(vertexB.id)).deep.equal([vertexA]);

        digraph.addEdge({ from: vertexD.id, to: vertexA.id });
        digraph.addEdge({ from: vertexD.id, to: vertexC.id });

        expect(digraph.getLowerDependencies(vertexD.id)).deep.equal([
          vertexA,
          vertexC
        ]);
      });

      it("should find all upper adjacent vertices from a given vertex", () => {
        const digraph = new DiGraph();
        const [vertexA, vertexB, vertexC] = [
          ...createRawVertices("a", "b", "c", "d")
        ];

        digraph.addVertices(vertexA, vertexB, vertexC);
        digraph.addEdge({ from: vertexA.id, to: vertexB.id });

        expect(digraph.getUpperDependencies(vertexB.id)).to.deep.equal([
          vertexA
        ]);

        digraph.addEdge({ from: vertexC.id, to: vertexB.id });

        expect(digraph.getUpperDependencies(vertexB.id)).to.deep.equal([
          vertexA,
          vertexC
        ]);
      });
    });

    describe("When searching for deep (upper or lower) dependencies", () => {
      it("should follow and collect all lower dependencies starting from a root vertex", () => {
        const digraph = new DiGraph();
        const [vertexA, vertexB, vertexC, vertexD, vertexE, vertexF] = [
          ...createRawVertices("a", "b", "c", "d", "e", "f", "g")
        ];

        digraph.addVertices(
          vertexA,
          vertexB,
          vertexC,
          vertexD,
          vertexE,
          vertexF
        );
        digraph.addEdge({ from: vertexA.id, to: vertexB.id });
        digraph.addEdge({ from: vertexB.id, to: vertexC.id });
        digraph.addEdge({ from: vertexA.id, to: vertexD.id });
        digraph.addEdge({ from: vertexD.id, to: vertexE.id });
        digraph.addEdge({ from: vertexE.id, to: vertexF.id });

        expect([...digraph.getDeepLowerDependencies(vertexA.id)]).deep.equal([
          "b",
          "c",
          "d",
          "e",
          "f"
        ]);
      });

      it("should follow and collect all upper dependencies starting from a root vertex", () => {
        const digraph = new DiGraph();
        const [vertexA, vertexB, vertexC, vertexD, vertexE, vertexF] = [
          ...createRawVertices("a", "b", "c", "d", "e", "f", "g")
        ];

        digraph.addVertices(
          vertexF,
          vertexC,
          vertexD,
          vertexA,
          vertexB,
          vertexE
        );
        digraph.addEdge({ from: vertexF.id, to: vertexA.id });
        digraph.addEdge({ from: vertexB.id, to: vertexA.id });
        digraph.addEdge({ from: vertexD.id, to: vertexA.id });
        digraph.addEdge({ from: vertexC.id, to: vertexB.id });
        digraph.addEdge({ from: vertexE.id, to: vertexD.id });

        expect([...digraph.getDeepUpperDependencies(vertexA.id)]).deep.equal([
          "f",
          "d",
          "e",
          "b",
          "c"
        ]);
      });

      describe("When there are cycles in the graph", () => {
        describe("When deeply collecting lower dependencies", () => {
          it("scenario n°1", () => {
            const digraph = new DiGraph();
            const [vertexA, vertexB, vertexC, vertexD, vertexE, vertexF] = [
              ...createRawVertices("a", "b", "c", "d", "e", "f")
            ];

            digraph.addVertices(
              vertexA,
              vertexB,
              vertexC,
              vertexD,
              vertexE,
              vertexF
            );
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexB.id, to: vertexC.id });
            digraph.addEdge({ from: vertexA.id, to: vertexD.id });
            digraph.addEdge({ from: vertexD.id, to: vertexE.id });

            // cycle deep in the graph
            digraph.addEdge({ from: vertexE.id, to: vertexF.id });
            digraph.addEdge({ from: vertexF.id, to: vertexE.id });

            expect([
              ...digraph.getDeepLowerDependencies(vertexA.id)
            ]).deep.equal(["b", "c", "d", "e", "f"]);
          });

          it("scenario n°2", () => {
            const digraph = new DiGraph();
            const [vertexA, vertexB, vertexC, vertexD, vertexE, vertexF] = [
              ...createRawVertices("a", "b", "c", "d", "e", "f")
            ];

            digraph.addVertices(
              vertexA,
              vertexB,
              vertexC,
              vertexD,
              vertexE,
              vertexF
            );
            digraph.addEdge({ from: vertexA.id, to: vertexF.id });
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexA.id, to: vertexD.id });
            digraph.addEdge({ from: vertexD.id, to: vertexE.id });
            digraph.addEdge({ from: vertexB.id, to: vertexC.id });

            // cycle deep in the graph
            digraph.addEdge({ from: vertexC.id, to: vertexF.id });
            digraph.addEdge({ from: vertexF.id, to: vertexC.id });

            expect([
              ...digraph.getDeepLowerDependencies(vertexA.id)
            ]).deep.equal(["f", "c", "b", "d", "e"]);
          });
        });

        describe("When deeply collecting upper dependencies", () => {
          it("should collect all upper dependencies", () => {
            const digraph = new DiGraph();
            const [vertexA, vertexB, vertexC, vertexD, vertexE, vertexF] = [
              ...createRawVertices("a", "b", "c", "d", "e", "f")
            ];

            digraph.addVertices(
              vertexF,
              vertexC,
              vertexD,
              vertexA,
              vertexB,
              vertexE
            );
            digraph.addEdge({ from: vertexF.id, to: vertexA.id });
            digraph.addEdge({ from: vertexB.id, to: vertexA.id });
            digraph.addEdge({ from: vertexD.id, to: vertexA.id });
            digraph.addEdge({ from: vertexC.id, to: vertexB.id });
            digraph.addEdge({ from: vertexE.id, to: vertexD.id });

            // cycle
            digraph.addEdge({ from: vertexC.id, to: vertexF.id });
            digraph.addEdge({ from: vertexF.id, to: vertexC.id });

            expect([
              ...digraph.getDeepUpperDependencies(vertexA.id)
            ]).deep.equal(["f", "c", "d", "e", "b"]);
          });
        });
      });
    });
  });

  describe("When detecting circular dependencies in the graph", () => {
    describe("When there is only once cycle in the graph", () => {
      describe("When the cycle is starting from the root vertex", () => {
        describe("When using infinite depth limit for detection", () => {
          it("should not detect a cycle between vertices with no edges pointing to each other", () => {
            const digraph = new DiGraph();
            const [vertexA, vertexB, vertexC] = [
              ...createRawVertices("a", "b", "c")
            ];

            digraph.addVertices(vertexA, vertexB, vertexC);

            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            expect(digraph.hasCycles()).to.equal(false);

            digraph.addEdge({ from: vertexB.id, to: vertexC.id });
            expect(digraph.hasCycles()).to.equal(false);
          });

          it("should detect a cycle of depth 1 between vertices with edges pointing directly to each other", () => {
            const digraph = new DiGraph();
            const [vertexA, vertexB] = [...createRawVertices("a", "b")];

            digraph.addVertices(vertexB, vertexA);
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });

            expect(digraph.hasCycles()).to.equal(false);

            digraph.addEdge({ from: vertexB.id, to: vertexA.id });

            expect(digraph.hasCycles()).to.equal(true);
            expect(digraph.findCycles()).to.deep.equal([["a", "b"]]);
          });

          it("should detect a cycle of depth 2 with indirect edges pointing to each other", () => {
            const digraph = new DiGraph();
            const [vertexA, vertexB, vertexC, vertexD, vertexE] = [
              ...createRawVertices("a", "b", "c", "d", "e")
            ];

            digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE);
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexB.id, to: vertexC.id });
            digraph.addEdge({ from: vertexC.id, to: vertexD.id });
            expect(digraph.hasCycles()).to.equal(false);

            digraph.addEdge({ from: vertexD.id, to: vertexA.id }); // D ----> A => cycle between A and D traversing B, C
            expect(digraph.hasCycles()).to.equal(true);
            expect(digraph.findCycles()).to.deep.equal([["b", "c", "d", "a"]]);
          });

          it("should detect cyclic paths of any given depth", () => {
            const digraph = new DiGraph();
            const [vertexA, vertexB, vertexC, vertexD] = [
              ...createRawVertices("a", "b", "c", "d")
            ];

            digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
            digraph.addEdge({ from: vertexC.id, to: vertexD.id });
            digraph.addEdge({ from: vertexB.id, to: vertexC.id });
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexD.id, to: vertexA.id }); // D ----> A => cycle between A and D traversing B, C

            expect(digraph.findCycles()).to.deep.equal([["b", "c", "d", "a"]]);
          });

          it("should keep only one occurrence of a same cyclic path", () => {
            const digraph = new DiGraph();

            const [fileA, fileB, fileC] = [
              ...createRawVertices("A.js", "B.js", "C.js")
            ];

            digraph.addVertices(fileA, fileB, fileC);
            digraph.addEdge({ from: fileA.id, to: fileB.id });
            digraph.addEdge({ from: fileB.id, to: fileC.id });
            digraph.addEdge({ from: fileC.id, to: fileA.id });

            expect(digraph.findCycles().length).to.equal(1);
            expect(digraph.findCycles()).to.deep.equal([
              ["B.js", "C.js", "A.js"]
            ]);
          });

          it("should only return nodes involved when dealing with direct circular dependency", () => {
            const digraph = new DiGraph();
            const [vertexA, vertexB, vertexC] = [
              ...createRawVertices("a", "b", "c")
            ];

            digraph.addVertices(vertexC, vertexA, vertexB);
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexB.id, to: vertexC.id });
            expect(digraph.hasCycles()).to.equal(false);

            digraph.addEdge({ from: vertexB.id, to: vertexA.id });

            const cycles = digraph.findCycles();
            expect(digraph.hasCycles()).to.equal(true);
            expect(cycles).to.deep.equal([["b", "a"]]);
          });

          it("should only return nodes involved when dealing with an indirect circular dependency", () => {
            const digraph = new DiGraph();
            const [vertexA, vertexB, vertexC, vertexD, vertexE] = [
              ...createRawVertices("a", "b", "c", "d", "e")
            ];

            digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE);
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexB.id, to: vertexC.id });
            digraph.addEdge({ from: vertexB.id, to: vertexD.id });
            // expect(digraph.hasCycles()).to.equal(false);

            digraph.addEdge({ from: vertexC.id, to: vertexA.id });
            digraph.addEdge({ from: vertexC.id, to: vertexE.id });

            const cycles = digraph.findCycles();
            expect(digraph.hasCycles()).to.equal(true);
            expect(cycles).to.deep.equal([["b", "c", "a"]]);
          });
        });

        describe("When providing a max depth limit for detection", () => {
          it("should not detect any cycle as the specified depth is zero", () => {
            const digraph = new DiGraph();
            const [vertexA, vertexB] = [...createRawVertices("a", "b")];

            digraph.addVertices(vertexA, vertexB);
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexB.id, to: vertexA.id });
            expect(digraph.hasCycles({ maxDepth: 0 })).to.equal(false);
          });

          it("should detect the cycle only when the specified depth is greather than or equal to the depth of the cycle", () => {
            const digraph = new DiGraph();
            const [vertexA, vertexB, vertexC, vertexD] = [
              ...createRawVertices("a", "b", "c", "d")
            ];

            digraph.addVertices(vertexA, vertexB, vertexC, vertexD);
            digraph.addEdge({ from: vertexA.id, to: vertexB.id });
            digraph.addEdge({ from: vertexB.id, to: vertexC.id });
            digraph.addEdge({ from: vertexC.id, to: vertexD.id });
            expect(digraph.hasCycles()).to.equal(false);

            digraph.addEdge({ from: vertexD.id, to: vertexA.id });
            expect(digraph.hasCycles({ maxDepth: 1 })).to.equal(false);
            expect(digraph.hasCycles({ maxDepth: 2 })).to.equal(false);
            expect(digraph.hasCycles({ maxDepth: 3 })).to.equal(false);
            expect(digraph.hasCycles({ maxDepth: 4 })).to.equal(true);
            expect(digraph.hasCycles({ maxDepth: 20 })).to.equal(true);
          });
        });
      });
    });

    describe("When there are many circular dependencies in the graph", () => {
      describe("When any cycle is starting other than from the root vertex", () => {
        describe("When only one direct cycle should be detected", () => {
          it("scenario n°1", () => {
            const digraph = new DiGraph();
            const [vertexA, vertexB, vertexC, vertexD, vertexE] = [
              ...createRawVertices("a", "b", "c", "d", "e")
            ];

            digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE);

            // root node as it was added first in the graph
            digraph.addEdge({ from: vertexA.id, to: vertexE.id });

            // other vertices that should not be included in the cycle
            digraph.addEdge({ from: vertexC.id, to: vertexA.id });
            digraph.addEdge({ from: vertexB.id, to: vertexC.id });

            // cycle here (C <-> D)
            digraph.addEdge({ from: vertexC.id, to: vertexD.id });
            digraph.addEdge({ from: vertexD.id, to: vertexC.id });

            const cycles = digraph.findCycles();
            expect(digraph.hasCycles()).to.equal(true);
            expect(cycles).to.deep.equal([["d", "c"]]);
          });

          it("scenario n°2", () => {
            const digraph = new DiGraph();
            const [vertexA, vertexB, vertexC, vertexD, vertexE, vertexF] = [
              ...createRawVertices("a", "b", "c", "d", "e", "f")
            ];

            digraph.addVertices(
              vertexF,
              vertexC,
              vertexD,
              vertexA,
              vertexB,
              vertexE
            );
            digraph.addEdge({ from: vertexF.id, to: vertexA.id });
            digraph.addEdge({ from: vertexB.id, to: vertexA.id });
            digraph.addEdge({ from: vertexD.id, to: vertexA.id });
            digraph.addEdge({ from: vertexC.id, to: vertexB.id });
            digraph.addEdge({ from: vertexE.id, to: vertexD.id });

            // cycle
            digraph.addEdge({ from: vertexC.id, to: vertexF.id });
            digraph.addEdge({ from: vertexF.id, to: vertexC.id });

            const cycles = digraph.findCycles();
            expect(digraph.hasCycles()).to.equal(true);
            expect(cycles).to.deep.equal([["c", "f"]]);
          });
        });

        it("should detect three cycles including two inner cycles joining to form a global cycle", () => {
          const digraph = new DiGraph();
          const [vertexA, vertexB, vertexC, vertexD] = [
            ...createRawVertices("a", "b", "c", "d")
          ];

          digraph.addVertices(vertexA, vertexB, vertexC, vertexD);

          // first cycle (A -> B -> C -> A)
          digraph.addEdge({ from: vertexA.id, to: vertexB.id });
          digraph.addEdge({ from: vertexB.id, to: vertexC.id });
          digraph.addEdge({ from: vertexC.id, to: vertexA.id });

          // second cycle (C <-> D)
          digraph.addEdge({ from: vertexC.id, to: vertexD.id });
          digraph.addEdge({ from: vertexD.id, to: vertexC.id });

          // third and global cycle (A -> B -> C -> D -> C -> A)

          const cycles = digraph.findCycles();
          expect(digraph.hasCycles()).to.equal(true);
          expect(cycles).to.deep.equal([
            ["b", "c", "a"],
            ["d", "c"],
            ["c", "a", "b", "d"]
          ]);
        });

        it("should detect both independent cycles", () => {
          const digraph = new DiGraph();
          const [vertexA, vertexB, vertexC, vertexD, vertexE] = [
            ...createRawVertices("a", "b", "c", "d", "e")
          ];

          digraph.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE);

          digraph.addEdge({ from: vertexA.id, to: vertexB.id });
          digraph.addEdge({ from: vertexA.id, to: vertexD.id });

          // first cycle (B <-> C)
          digraph.addEdge({ from: vertexC.id, to: vertexB.id });
          digraph.addEdge({ from: vertexB.id, to: vertexC.id });

          // second cycle (D <-> E)
          digraph.addEdge({ from: vertexE.id, to: vertexD.id });
          digraph.addEdge({ from: vertexD.id, to: vertexE.id });

          const cycles = digraph.findCycles();
          expect(digraph.hasCycles()).to.equal(true);
          expect(cycles).to.deep.equal([
            ["c", "b"],
            ["e", "d"]
          ]);
        });
      });
    });
  });
});
