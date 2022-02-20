/* eslint-disable no-inline-comments */
/* eslint-disable line-comment-position */
/* eslint-disable max-nested-callbacks */
import { expect } from "chai";

import { Dag, Vertex } from "./index.js";

describe("DAG Implementation", () => {
  describe("When adding and removing vertices or edges in the DAG", () => {
    xit("should allow only unique name for vertices");

    it("should only add edges between vertices already added in the graph", () => {
      const dag = new Dag();
      const vertexA: Vertex = { name: "a", adjacentTo: [], value: {} };
      const vertexB: Vertex = { name: "b", adjacentTo: [], value: {} };

      dag.addVertices(vertexA);
      dag.addEdge({ from: vertexA, to: vertexB });
      expect(dag.vertices[0].adjacentTo).deep.equal([]);
    });

    it("should add edges between vertices", () => {
      const dag = new Dag();
      const vertexA: Vertex = { name: "a", adjacentTo: [], value: {} };
      const vertexB: Vertex = { name: "b", adjacentTo: [], value: {} };

      dag.addVertices(vertexA, vertexB);
      dag.addEdge({ from: vertexB, to: vertexA });
      expect(dag.vertices[0].adjacentTo).deep.equal([vertexB]);
    });

    it("should not add duplicate edges", () => {
      const dag = new Dag();
      const vertexA: Vertex = { name: "a", adjacentTo: [], value: {} };
      const vertexB: Vertex = { name: "b", adjacentTo: [], value: {} };

      dag.addVertices(vertexA, vertexB);
      dag.addEdge({ from: vertexB, to: vertexA });
      dag.addEdge({ from: vertexB, to: vertexA });
      expect(dag.vertices[0].adjacentTo).deep.equal([vertexB]);
    });
  });

  describe("When traversing the DAG", () => {
    it("should find vertex's direct dependencies", () => {
      const dag = new Dag();
      const vertexA: Vertex = { name: "a", adjacentTo: [], value: {} };
      const vertexB: Vertex = { name: "b", adjacentTo: [vertexA], value: {} };
      const vertexC: Vertex = { name: "c", adjacentTo: [], value: {} };
      const vertexD: Vertex = {
        name: "d",
        adjacentTo: [vertexA, vertexC],
        value: {}
      };
      const vertexE: Vertex = { name: "e", adjacentTo: [], value: {} };

      dag.addVertices(vertexA, vertexB, vertexC, vertexD, vertexE);

      expect(dag.hasVertexDependencies(vertexB)).equal(false);
      expect(dag.getVertexDependencies(vertexA)).deep.equal([vertexB, vertexD]);
    });

    it("should find a cycle between vertices with edges towards each other", () => {
      const dag = new Dag();

      const vertexA: Vertex = { name: "a", adjacentTo: [], value: {} };
      const vertexB: Vertex = { name: "b", adjacentTo: [], value: {} };

      dag.addVertices(vertexA, vertexB);
      dag.addEdge({ from: vertexA, to: vertexB }); // A --> B

      expect(dag.hasCycles()).to.equal(false);

      dag.addEdge({ from: vertexB, to: vertexA }); // B --> A => cycle between A and B

      expect(dag.hasCycles()).to.equal(true);
    });

    it("should find a cycle between vertices with edges towards each other", () => {
      const dag = new Dag();

      const vertexA: Vertex = { name: "a", adjacentTo: [], value: {} };
      const vertexB: Vertex = { name: "b", adjacentTo: [], value: {} };
      const vertexC: Vertex = { name: "c", adjacentTo: [], value: {} };
      const vertexD: Vertex = {
        name: "d",
        adjacentTo: [],
        value: {}
      };

      dag.addVertices(vertexA, vertexB, vertexC, vertexD);
      dag.addEdge({ from: vertexA, to: vertexB }); // A ----> B
      dag.addEdge({ from: vertexB, to: vertexC }); // B ----> C
      dag.addEdge({ from: vertexC, to: vertexD }); // C ----> D

      expect(dag.hasCycles()).to.equal(false);

      dag.addEdge({ from: vertexD, to: vertexA }); // D ----> A => cycle between A and D traversing B, C

      expect(dag.hasCycles()).to.equal(true);
    });
  });

  describe("When updating a vertex", () => {
    describe("With no adjacent vertices (no dependencies)", () => {
      it("should only update one vertex with no dependencies", () => {
        const dag = new Dag();
        const vertexA: Vertex = { name: "a", adjacentTo: [], value: {} };
        const vertexE: Vertex = { name: "e", adjacentTo: [vertexA], value: {} };
        const vertexB: Vertex = { name: "b", adjacentTo: [], value: {} };

        dag.addVertices(vertexA, vertexB, vertexE);

        dag.addMutation(vertexA, { newValue: [] });
        expect(dag.vertices[0].value).to.deep.equal({ newValue: [] });
        expect(dag.vertices[1].value).to.deep.equal(vertexE.value);
        expect(dag.vertices[2].value).to.deep.equal(vertexB.value);
      });
    });

    it("should update one vertex and propagate updates to its ancestors", () => {
      const dag = new Dag();
      const vertexA: Vertex = { name: "a", adjacentTo: [], value: {} };
      const vertexB: Vertex = { name: "b", adjacentTo: [vertexA], value: {} };
      const vertexD: Vertex = { name: "d", adjacentTo: [vertexB], value: {} };
      const vertexC: Vertex = { name: "c", adjacentTo: [vertexD], value: {} };

      dag.addVertices(vertexA, vertexB, vertexC, vertexD);
      dag.addMutation(vertexD, { newValue: [] });
      // eslint-disable-next-line id-length
      const [A, B, C, D] = dag.vertices;
      expect(D.value).to.deep.equal({ newValue: [] });

      /**
       * D is mutated and B directly depends on it. A depends on it via B
       */
      expect(A.value).to.deep.equal({ newValue: [] });
      expect(B.value).to.deep.equal({ newValue: [] });
      expect(C.value).to.deep.equal({});
    });
  });
});
