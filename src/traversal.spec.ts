import { describe, expect, test } from "vitest";

import { DiGraph } from "./digraph.js";
import type { VertexBody, VertexDefinition, VertexId } from "./vertex";

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

type VertexBuilder = {
  raw: (adjacentTo?: VertexId[]) => Vertex;
  adjacentTo: (...adjacentTo: VertexId[]) => VertexBuilder;
};

function makeVertex(id: VertexId): VertexBuilder {
  return {
    raw: (adjacentTo = []) => {
      return { id, adjacentTo, body: {} };
    },
    adjacentTo(...adjacentTo: VertexId[]) {
      return {
        raw: () => {
          return {
            id,
            adjacentTo,
            body: {}
          };
        },
        adjacentTo: this.adjacentTo
      };
    }
  };
}

describe("Depth-first Graph traversal", () => {
  test("Should expose a graph traversal method without root vertex", async () => {
    const graph = new DiGraph();
    graph.addVertices(...createRawVertices("a", "b", "c", "d", "e", "f", "g"));
    const vertices = [...graph.traverse()];

    expect(vertices.map(({ id }) => id)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g"
    ]);
  });

  describe("When providing a root vertex", () => {
    test("Should return an empty array or element when the provided vertex does not exists", () => {
      const graph = new DiGraph();
      const vertexB = makeVertex("b").raw();
      const vertexC = makeVertex("c").raw();

      const vertices: VertexDefinition<VertexBody>[] = [vertexB, vertexC];
      graph.addVertices(...vertices);

      const it = graph.traverse("a");
      const { value, done } = it.next();
      expect({ value, done }).toEqual({ value: undefined, done: true });
      expect([...it]).toEqual([]);
    });

    test("Should expose a graph traversal method starting from an existing root vertex", async () => {
      const graph = new DiGraph();
      const vertexA = makeVertex("a").adjacentTo("c", "d").raw();
      const vertexB = makeVertex("b").raw();
      const vertexC = makeVertex("c").raw();
      const vertexD = makeVertex("d").adjacentTo("b").raw();
      graph.addVertices(vertexB, vertexA, vertexC, vertexD);

      const it = graph.traverse("a");

      expect(it.next().value?.id).toEqual(vertexA.id);
      expect(it.next().value?.id).toEqual(vertexC.id);
      expect(it.next().value?.id).toEqual(vertexD.id);
      expect(it.next().value?.id).toEqual(vertexB.id);

      expect(it.next().done).toBeTruthy();
    });
  });

  describe.skip("When multiple vertices are connected to the same vertex", () => {
    test("Should traverse the same vertex only once", async () => {
      const graph = new DiGraph();
      const vertexA = makeVertex("a").adjacentTo("b").raw();
      const vertexB = makeVertex("b").adjacentTo("c").raw();
      const vertexC = makeVertex("c").raw();

      graph.addVertices(vertexB, vertexA, vertexC);

      const it = graph.traverse();

      expect(it.next().value?.id).toEqual(vertexB.id);
      expect(it.next().value?.id).toEqual(vertexC.id);
      expect(it.next().value?.id).toEqual(vertexA.id);

      expect(it.next().done).toBeTruthy();
    });
  });
});
