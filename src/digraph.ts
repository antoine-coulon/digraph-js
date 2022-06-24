import difference from "lodash.difference";
import uniqBy from "lodash.uniqby";

import { VertexDefinition, VertexId, VertexBody } from "./vertex.js";

export class DiGraph<Vertex extends VertexDefinition<VertexBody>> {
  #vertices: Map<VertexId, Vertex>;

  constructor() {
    this.#vertices = new Map();
  }

  public get isAcyclic(): boolean {
    return !this.findCycles().hasCycles;
  }

  public toRecord(): Record<VertexId, Vertex> {
    return Object.fromEntries(this.#vertices.entries());
  }

  public hasVertex(vertexId: string): boolean {
    return this.#vertices.has(vertexId);
  }

  public addVertex(vertex: Vertex): void {
    this.#vertices.set(vertex.id, vertex);
  }

  public addVertices(...vertices: Vertex[]): void {
    const verticesWithUniqueId = uniqBy(vertices, "id");
    const graphVerticesIds = Object.keys(this.#vertices);
    const newUniqueVertices = verticesWithUniqueId.filter(
      (vertex) => !graphVerticesIds.includes(vertex.id)
    );

    newUniqueVertices.forEach(this.addVertex.bind(this));
  }

  public addEdge({ from, to }: { from: string; to: string }): void {
    if (from === to) {
      return;
    }

    const [fromVertex, toVertex] = [
      this.#vertices.get(from),
      this.#vertices.get(to)
    ];

    if (fromVertex && toVertex) {
      const hasNotSameAdjacentVertex = !fromVertex.adjacentTo.find(
        (adjacentVertex) => adjacentVertex === toVertex.id
      );
      if (hasNotSameAdjacentVertex) {
        fromVertex.adjacentTo = fromVertex.adjacentTo.concat(toVertex.id);
      }
    }
  }

  public addMutation<V extends VertexBody>(
    vertex: VertexDefinition<V>,
    value: V
  ): void {
    const rootVertexToMutate = this.#vertices.get(vertex.id);

    if (rootVertexToMutate) {
      rootVertexToMutate.body = value;
    }
  }

  /**
   * Allow top-to-bottom traversal by finding all direct dependencies of a given
   * vertex.
   * @example
   * // given A ---> B (i.e: A depends on B)
   * getAdjacentVerticesTo(A) === [ B ]
   */
  public getAdjacentVerticesTo(rootVertex: Vertex): Vertex[] {
    return [...this.#vertices.values()].filter((vertex) =>
      rootVertex.adjacentTo.includes(vertex.id)
    );
  }

  /**
   * In order to allow bottom-to-top traversals, we provide this method allowing
   * us to know all vertices depending on the provided root vertex.
   * @example
   * // given A ---> B (i.e: A depends on B)
   * getAdjacentVerticesTo(B) === [ A ]
   */
  public getAdjacentVerticesFrom(rootVertex: Vertex): Vertex[] {
    return [...this.#vertices.values()].filter((vertex) =>
      vertex.adjacentTo.includes(rootVertex.id)
    );
  }

  public findCycles(
    { maxDepth }: { maxDepth: number } = { maxDepth: Number.POSITIVE_INFINITY }
  ): {
    hasCycles: boolean;
    cycles: VertexId[][];
  } {
    let hasCycles = false;
    const cycles: VertexId[][] = [];

    if (maxDepth && maxDepth === 0) {
      return {
        hasCycles,
        cycles
      };
    }
    /**
     * Vertex's id is used to detect cycle dependencies by comparing
     * each children vertex's id with the root vertex id.
     * If any children vertex's id has the id of the root vertex, we
     * consider it as the same Vertex in the DAG hence forming a cycle.
     */
    for (const [rootVertexId, rootVertexValue] of this.#vertices.entries()) {
      for (const adjacentVertexId of rootVertexValue.adjacentTo) {
        const adjacentVertex = this.#vertices.get(adjacentVertexId);
        const adjacentVerticesIds: VertexId[] = [];

        if (adjacentVertex) {
          adjacentVerticesIds.push(
            ...this.findDeepAdjacentVerticesDependencies(
              rootVertexValue,
              adjacentVertex,
              maxDepth
            )
          );
        }

        const vertexHasCycleDependency =
          adjacentVerticesIds.includes(rootVertexId);

        if (vertexHasCycleDependency) {
          hasCycles = true;
          const isCycleAlreadyAdded = cycles.some(
            (cycle) => difference(cycle, adjacentVerticesIds).length === 0
          );

          if (!isCycleAlreadyAdded) {
            cycles.push(adjacentVerticesIds);
          }
        }
      }
    }

    return {
      hasCycles,
      cycles
    };
  }

  private *limitCycleDetectionDepth(
    dependenciesWalker: Generator<string>,
    maxDepth: number
  ) {
    /**
     * At this point, we already traversed 2 levels of depth dependencies by:
     * - accessing the root's node adjacency list (depth === 1)
     * - then we continue by accessing the adjacent's node adjacency list (depth === 2)
     * Consequently we start recursing using the limit only at depth 2 already
     */
    const TRAVERSAL_STEPS_ALREADY_DONE = 2;
    for (
      let depth = 0;
      depth <= maxDepth - TRAVERSAL_STEPS_ALREADY_DONE;
      depth++
    ) {
      const { done, value } = dependenciesWalker.next();
      if (done) {
        return;
      }
      yield value;
    }
  }

  private *findDeepAdjacentVerticesDependencies(
    rootVertex: Vertex,
    traversedVertex: Vertex,
    depthLimit: number
  ): Generator<string> {
    yield traversedVertex.id;

    // Cycle reached, we must exit before entering in the infinite loop
    if (rootVertex.id === traversedVertex.id) {
      return;
    }

    for (const adjacentVertexId of traversedVertex.adjacentTo) {
      const adjacentVertex = this.#vertices.get(adjacentVertexId);
      if (adjacentVertex) {
        yield* this.limitCycleDetectionDepth(
          this.findDeepAdjacentVerticesDependencies(
            rootVertex,
            adjacentVertex,
            depthLimit
          ),
          depthLimit
        );
      }
    }
  }
}
