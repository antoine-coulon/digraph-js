import difference from "lodash.difference";
import uniqBy from "lodash.uniqby";

import { VertexDefinition, VertexId, VertexPayload } from "./vertex.js";

export class Dag<Vertex extends VertexDefinition<VertexPayload>> {
  #vertices: Map<VertexId, Vertex>;

  constructor() {
    this.#vertices = new Map();
  }

  asObject(): Record<VertexId, Vertex> {
    return Object.fromEntries(this.#vertices.entries());
  }

  addEdge({ from, to }: { from: Vertex; to: Vertex }): void {
    if (from.id === to.id) {
      return;
    }
    const [fromVertex, toVertex] = [
      this.#vertices.get(from.id),
      this.#vertices.get(to.id)
    ];
    if (fromVertex && toVertex) {
      const hasNotSameAdjacentVertex = !fromVertex.adjacentTo.find(
        (adjacentVertex) => adjacentVertex === toVertex.id
      );
      if (hasNotSameAdjacentVertex) {
        fromVertex.adjacentTo = [...fromVertex.adjacentTo, toVertex.id];
      }
    }
  }

  addVertices(...vertices: Vertex[]): void {
    const verticesWithUniqueId = uniqBy(vertices, "id");
    const graphVerticesIds = Object.keys(this.#vertices);
    const newUniqueVertices = verticesWithUniqueId.filter(
      (vertex) => !graphVerticesIds.includes(vertex.id)
    );

    newUniqueVertices.forEach((vertex) =>
      this.#vertices.set(vertex.id, vertex)
    );
  }

  addMutation<V extends VertexPayload>(
    vertex: VertexDefinition<V>,
    value: V
  ): void {
    const rootVertexToMutate = this.#vertices.get(vertex.id);

    if (rootVertexToMutate) {
      rootVertexToMutate.payload = value;
    }
  }

  private *flattenAdjacentVerticesDependencies(
    rootVertex: Vertex,
    traversedVertex: Vertex
  ): Generator<string> {
    yield traversedVertex.id;

    // Cycle reached, we must exit before entering in the infinite loop
    if (rootVertex.id === traversedVertex.id) {
      return;
    }

    for (const adjacentVertexId of traversedVertex.adjacentTo) {
      const adjacentVertex = this.#vertices.get(adjacentVertexId);
      if (adjacentVertex) {
        yield* this.flattenAdjacentVerticesDependencies(
          rootVertex,
          adjacentVertex
        );
      }
    }
  }

  findCycles(): { hasCycles: boolean; cycles: string[][] } {
    let hasCycles = false;
    const cycles: string[][] = [];
    /**
     * Vertex's id is used to detect cycle dependencies by comparing
     * each children vertex's id with the root vertex id.
     * If any children vertex's id has the id of the root vertex, we
     * consider it as the same Vertex in the DAG hence forming a cycle.
     */
    for (const [rootVertexId, rootVertexValue] of this.#vertices.entries()) {
      for (const adjacentVertexId of rootVertexValue.adjacentTo) {
        const adjacentVertex = this.#vertices.get(adjacentVertexId);
        const adjacentVerticesIds: string[] = [];

        if (adjacentVertex) {
          adjacentVerticesIds.push(
            ...this.flattenAdjacentVerticesDependencies(
              rootVertexValue,
              adjacentVertex
            )
          );
        }

        const vertexHasCycleDependency =
          adjacentVerticesIds.includes(rootVertexId);
        if (vertexHasCycleDependency) {
          hasCycles = true;
          const uniqueAdjacentVerticesIds = [...new Set(adjacentVerticesIds)];
          const isCycleAlreadyAdded = cycles.some(
            (cycle) => difference(cycle, uniqueAdjacentVerticesIds).length === 0
          );

          if (!isCycleAlreadyAdded) {
            /**
             * We wan't to reverse so the cycle is in a logic order, otherwise
             * all edges would seem inverted because of the implemented
             * Graph structure.
             */
            cycles.push(uniqueAdjacentVerticesIds.reverse());
          }
        }
      }
    }

    return {
      hasCycles,
      cycles
    };
  }

  getAdjacentVerticesTo(rootVertex: Vertex): Vertex[] {
    return [...this.#vertices.values()].filter((vertex) =>
      rootVertex.adjacentTo.includes(vertex.id)
    );
  }

  /**
   * In order to allow bottom-to-top traversals, we provide this method allowing
   * us to know all vertices depending on the provided rootVertex.
   */
  getAdjacentVerticesFrom(rootVertex: Vertex): Vertex[] {
    return [...this.#vertices.values()].filter((vertex) =>
      vertex.adjacentTo.includes(rootVertex.id)
    );
  }
}
