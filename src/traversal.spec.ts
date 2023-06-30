import { describe, expect, test } from "vitest";

import { DiGraph, Traversal } from "./digraph.js";
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

describe("Graph traversal", () => {
  test("Should expose a graph traversal method without root vertex", () => {
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

      const it = graph.traverse({ rootVertexId: "a" });
      const { value, done } = it.next();
      expect({ value, done }).toEqual({ value: undefined, done: true });
      expect([...it]).toEqual([]);
    });

    test("Should expose a graph DFS traversal method starting from an existing root vertex", () => {
      const graph = new DiGraph();
      const vertexA = makeVertex("a").adjacentTo("d", "c").raw();
      const vertexB = makeVertex("b").raw();
      const vertexC = makeVertex("c").raw();
      const vertexD = makeVertex("d").adjacentTo("b").raw();
      graph.addVertices(vertexB, vertexA, vertexC, vertexD);

      const it = graph.traverse({ rootVertexId: "a", traversal: "dfs" });

      expect(it.next().value?.id).toEqual(vertexA.id);
      expect(it.next().value?.id).toEqual(vertexD.id);
      expect(it.next().value?.id).toEqual(vertexB.id);
      expect(it.next().value?.id).toEqual(vertexC.id);

      expect(it.next().done).toBeTruthy();
    });

    test("Should expose a graph BFS traversal method starting from an existing root vertex", () => {
      const graph = new DiGraph();
      const vertexA = makeVertex("a").adjacentTo("d", "c").raw();
      const vertexB = makeVertex("b").raw();
      const vertexC = makeVertex("c").adjacentTo("e").raw();
      const vertexD = makeVertex("d").adjacentTo("b").raw();
      const vertexE = makeVertex("e").raw();
      graph.addVertices(vertexB, vertexA, vertexC, vertexD, vertexE);

      const it = graph.traverse({ rootVertexId: "a", traversal: "bfs" });

      expect(it.next().value?.id).toEqual(vertexA.id);
      expect(it.next().value?.id).toEqual(vertexD.id);
      expect(it.next().value?.id).toEqual(vertexC.id);
      expect(it.next().value?.id).toEqual(vertexB.id);
      expect(it.next().value?.id).toEqual(vertexE.id);

      expect(it.next().done).toBeTruthy();
    });
  });

  describe("When not providing a root vertex", () => {
    test("Should return an empty array or there are no vertices", () => {
      const graph = new DiGraph();

      const it = graph.traverse();
      const { value, done } = it.next();
      expect({ value, done }).toEqual({ value: undefined, done: true });
      expect([...it]).toEqual([]);
    });

    test("DFS traversal", () => {
      const graph = new DiGraph();
      const vertexA = makeVertex("a").adjacentTo("b", "c").raw();
      const vertexB = makeVertex("b").adjacentTo("d").raw();
      const vertexC = makeVertex("c").raw();
      const vertexD = makeVertex("d").raw();

      graph.addVertices(vertexA, vertexB, vertexC, vertexD);

      const it = graph.traverse({ traversal: "dfs" });

      expect(it.next().value?.id).toEqual(vertexA.id);
      expect(it.next().value?.id).toEqual(vertexB.id);
      expect(it.next().value?.id).toEqual(vertexD.id);
      expect(it.next().value?.id).toEqual(vertexC.id);

      expect(it.next().done).toBeTruthy();
    });

    test("BFS traversal", () => {
      const graph = new DiGraph();
      const vertexA = makeVertex("a").adjacentTo("b", "c").raw();
      const vertexB = makeVertex("b").adjacentTo("d").raw();
      const vertexC = makeVertex("c").raw();
      const vertexD = makeVertex("d").raw();

      graph.addVertices(vertexA, vertexB, vertexC, vertexD);

      const it = graph.traverse({ traversal: "bfs" });

      expect(it.next().value?.id).toEqual(vertexA.id);
      expect(it.next().value?.id).toEqual(vertexB.id);
      expect(it.next().value?.id).toEqual(vertexC.id);
      expect(it.next().value?.id).toEqual(vertexD.id);

      expect(it.next().done).toBeTruthy();
    });
  });

  describe("When multiple vertices are connected to the same vertex", () => {
    test("DFS: Should traverse the same vertex only once", async () => {
      const graph = new DiGraph();
      const vertexA = makeVertex("a").adjacentTo("b").raw();
      const vertexB = makeVertex("b").adjacentTo("c").raw();
      const vertexC = makeVertex("c").raw();

      graph.addVertices(vertexB, vertexA, vertexC);

      const it = graph.traverse({ traversal: "dfs" });

      expect(it.next().value?.id).toEqual(vertexB.id);
      expect(it.next().value?.id).toEqual(vertexC.id);
      expect(it.next().value?.id).toEqual(vertexA.id);

      expect(it.next().done).toBeTruthy();
    });

    test("DFS with root: Should traverse the same vertex only once", async () => {
      const graph = new DiGraph();
      const vertexA = makeVertex("a").adjacentTo("b", "c").raw();
      const vertexB = makeVertex("b").adjacentTo("c").raw();
      const vertexC = makeVertex("c").raw();

      graph.addVertices(vertexB, vertexA, vertexC);

      const it = graph.traverse({ rootVertexId: "a", traversal: "dfs" });

      expect(it.next().value?.id).toEqual(vertexA.id);
      expect(it.next().value?.id).toEqual(vertexB.id);
      expect(it.next().value?.id).toEqual(vertexC.id);

      expect(it.next().done).toBeTruthy();
    });

    test("BFS: Should traverse the same vertex only once", async () => {
      const graph = new DiGraph();
      const vertexA = makeVertex("a").adjacentTo("b", "c").raw();
      const vertexB = makeVertex("b").adjacentTo("c").raw();
      const vertexC = makeVertex("c").raw();

      graph.addVertices(vertexB, vertexA, vertexC);

      const it = graph.traverse({ traversal: "bfs" });

      expect(it.next().value?.id).toEqual(vertexB.id);
      expect(it.next().value?.id).toEqual(vertexC.id);
      expect(it.next().value?.id).toEqual(vertexA.id);

      expect(it.next().done).toBeTruthy();
    });

    test("BFS with root: Should traverse the same vertex only once", async () => {
      const graph = new DiGraph();
      const vertexA = makeVertex("a").adjacentTo("b", "c").raw();
      const vertexB = makeVertex("b").adjacentTo("c").raw();
      const vertexC = makeVertex("c").adjacentTo("d").raw();
      const vertexD = makeVertex("d").raw();

      graph.addVertices(vertexB, vertexA, vertexC, vertexD);

      const it = graph.traverse({ rootVertexId: "a", traversal: "bfs" });

      expect(it.next().value?.id).toEqual(vertexA.id);
      expect(it.next().value?.id).toEqual(vertexB.id);
      expect(it.next().value?.id).toEqual(vertexC.id);
      expect(it.next().value?.id).toEqual(vertexD.id);

      expect(it.next().done).toBeTruthy();
    });
  });

  describe("When the graph is cyclic", () => {
    const traversals = ["dfs", "bfs"];

    test.each(traversals)(
      "%s: Should traverse all vertices in the graph",
      (traversal) => {
        const graph = new DiGraph();
        const vertexA = makeVertex("a").adjacentTo("b", "c").raw();
        const vertexB = makeVertex("b").adjacentTo("a").raw();
        const vertexC = makeVertex("c").adjacentTo("d").raw();
        const vertexD = makeVertex("d").raw();

        graph.addVertices(vertexB, vertexA, vertexC, vertexD);

        const it = graph.traverse({
          rootVertexId: "b",
          traversal: traversal as Traversal
        });

        expect(it.next().value?.id).toEqual(vertexB.id);
        expect(it.next().value?.id).toEqual(vertexA.id);
        expect(it.next().value?.id).toEqual(vertexC.id);
        expect(it.next().value?.id).toEqual(vertexD.id);

        expect(it.next().done).toBeTruthy();
      }
    );
  });
});
