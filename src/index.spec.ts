/* eslint-disable max-nested-callbacks */
import { expect } from "chai";

import { Dag, Vertex } from "./index.js";

describe("DAG Implementation", () => {
  describe("When traversing the DAG", () => {
    it("should find ancestors and successors for any given vertices", () => {
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

      dag.addVertex(vertexA);
      dag.addVertex(vertexB);
      dag.addVertex(vertexC);
      dag.addVertex(vertexD);
      dag.addVertex(vertexE);

      expect(dag.hasAncestors(vertexB)).equal(true);
      expect(dag.hasSuccessors(vertexB)).equal(false);

      expect(dag.getAncestors(vertexB)).deep.equal([vertexA]);
      expect(dag.getSuccessors(vertexA)).deep.equal([vertexB, vertexD]);
    });
  });

  describe("When updating a vertex", () => {
    describe("With no adjacent vertices (no dependencies)", () => {
      it("should only update one vertex with no dependencies", () => {
        const dag = new Dag();

        const vertexA: Vertex = { name: "a", adjacentTo: [], value: {} };
        const vertexE: Vertex = { name: "e", adjacentTo: [vertexA], value: {} };
        const vertexB: Vertex = { name: "b", adjacentTo: [], value: {} };

        dag.addVertex(vertexA);
        dag.addVertex(vertexB);
        dag.addVertex(vertexE);

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

      dag.addVertex(vertexA);
      dag.addVertex(vertexB);
      dag.addVertex(vertexC);
      dag.addVertex(vertexD);

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
