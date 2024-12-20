import isEqual from "lodash.isequal";
import uniqWith from "lodash.uniqwith";

import { VertexBody, VertexDefinition, VertexId } from "./vertex.js";

export type Traversal = "bfs" | "dfs";

export class DiGraph<Vertex extends VertexDefinition<VertexBody>> {
  #vertices: Map<VertexId, Vertex>;

  constructor() {
    this.#vertices = new Map();
  }

  static fromRaw(
    raw: Record<VertexId, VertexDefinition<VertexBody>>
  ): DiGraph<VertexDefinition<VertexBody>> {
    const digraph = new DiGraph();

    for (const vertex of Object.values(raw)) {
      digraph.addVertex({
        id: vertex.id,
        adjacentTo: vertex.adjacentTo,
        body: vertex.body
      });
    }

    return digraph;
  }

  public get isAcyclic(): boolean {
    return !this.hasCycles();
  }

  public toDict(): Record<VertexId, Vertex> {
    return Object.fromEntries(this.#vertices.entries());
  }

  public hasVertex(vertexId: VertexId): boolean {
    return this.#vertices.has(vertexId);
  }

  public addVertex(vertex: Vertex): void {
    const graphVerticesIds = [...this.#vertices.keys()];

    if (!graphVerticesIds.includes(vertex.id)) {
      this.#vertices.set(vertex.id, vertex);
    }
  }

  public addVertices(...vertices: Vertex[]): void {
    const graphVerticesIds = [...this.#vertices.keys()];
    for (const uniqueVertex of this.keepUniqueVertices(vertices)) {
      if (!graphVerticesIds.includes(uniqueVertex.id)) {
        this.addVertex(uniqueVertex);
      }
    }
  }

  public deleteVertex(vertexId: VertexId): void {
    this.#vertices.delete(vertexId);

    for (const vertexDependingOnDeletedVertex of this.getParents(vertexId)) {
      this.deleteEdge({
        from: vertexDependingOnDeletedVertex.id,
        to: vertexId
      });
    }
  }

  public addEdge({ from, to }: { from: VertexId; to: VertexId }): void {
    if (from === to) {
      throw new Error('Cannot create a self-referencing edge: "A -> A"');
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

  public deleteEdge({ from, to }: { from: VertexId; to: VertexId }): void {
    const fromVertex = this.#vertices.get(from);

    if (fromVertex) {
      fromVertex.adjacentTo = fromVertex.adjacentTo.filter(
        (adjacentVertexId) => adjacentVertexId !== to
      );
    }
  }

  /**
   * This function updates the vertex's body with the provided value without
   * doing any merging with the previous value. If you want to preserve/update
   * values, check `mergeVertexBody` instead.
   * @example
   * updateVertexBody("Node1", {
   *    // body only contains this property "newProperty" now.
   *    newProperty: []
   * });
   *
   */
  public updateVertexBody(vertexId: VertexId, body: Vertex["body"]): void {
    const rootVertexToMutate = this.#vertices.get(vertexId);

    if (rootVertexToMutate) {
      rootVertexToMutate.body = body;
    }
  }

  /**
   * This function lets you choose the way of merging the vertex's body
   * by providing a callback function with the corresponding vertex instance.
   * @example
   * mergeVertexBody("Node1", (nodeBody) => {
   *    // either by directly mutating the value
   *    nodeBody.someProperty.list[0] = {};
   *    // either by providing a new reference
   *    nodeBody.someProperty.list = newCollection.map(operation);
   * });
   */
  public mergeVertexBody(
    vertexId: VertexId,
    mergeCallback: (vertex: Vertex["body"]) => void
  ): void {
    const rootVertexToMutate = this.#vertices.get(vertexId);

    if (rootVertexToMutate) {
      mergeCallback(rootVertexToMutate.body);
    }
  }

  /**
   * Base API to traverse walk through a DiGraph instance either in a DFS or BFS
   * manner. Providing `rootVertexId` will force the traversal to start from it.
   * If no `rootVertexId` is provided, the traversal will start from the first vertex
   * found in the graph, which will most likely be the first entry that was added
   * in it.
   */
  public *traverse(options?: {
    rootVertexId?: VertexId;
    traversal?: Traversal;
  }): Generator<Vertex, void, void> {
    const { rootVertexId, traversal } = {
      traversal: options?.traversal ?? "bfs",
      rootVertexId: options?.rootVertexId
    };

    if (rootVertexId) {
      if (traversal === "bfs") {
        return yield* this.breadthFirstTraversalFrom(rootVertexId);
      }

      return yield* this.depthFirstTraversalFrom(rootVertexId);
    }

    return yield* this.traverseAll(traversal);
  }

  public traverseEager(options?: {
    rootVertexId?: VertexId;
    traversal?: Traversal;
  }): Vertex[] {
    return Array.from(this.traverse(options));
  }

  /**
   * Allows top-to-bottom traversals by finding only the first relationship level
   * of children dependencies of the provided vertex.
   * @example
   * // given A --> B, A depends on B hence B is a children dependency of A
   * assert.deepEqual(graph.getChildren("A"), [VertexB]) // ok
   */
  public getChildren(rootVertexId: VertexId): Vertex[] {
    return [...this.#vertices.values()].filter((vertex) =>
      this.#vertices.get(rootVertexId)?.adjacentTo.includes(vertex.id)
    );
  }

  /**
   * Same as `getChildren()`, but doesn't stop at the first level hence deeply
   * collects all children dependencies in a Depth-First Search manner.
   * Allows top-to-bottom traversals i.e: which nodes are dependencies of
   * the provided rootVertexId.
   */
  public *getDeepChildren(
    rootVertexId: VertexId,
    depthLimit?: number
  ): Generator<VertexId> {
    const rootVertex = this.#vertices.get(rootVertexId);
    if (!rootVertex) {
      return;
    }

    const visitedVertices: VertexId[] = [];

    for (const adjacentVertexId of rootVertex.adjacentTo) {
      const adjacentVertex = this.#vertices.get(adjacentVertexId);

      if (!adjacentVertex) {
        continue;
      }

      yield* this.findDeepDependencies(
        "top-to-bottom",
        rootVertex,
        adjacentVertex,
        depthLimit,
        visitedVertices
      );
    }
  }

  /**
   * Allows bottom-to-top traversals by finding only the first relationship level
   * of parent dependencies of the provided vertex.
   * @example
   * // given A --> B, A depends on B hence A is a parent dependency of B
   * assert.deepEqual(graph.getParents("B"), [VertexA]) // ok
   */
  public getParents(rootVertexId: VertexId): Vertex[] {
    return [...this.#vertices.values()].filter((vertex) =>
      vertex.adjacentTo.includes(rootVertexId)
    );
  }

  /**
   * Same as `getParents()`, but doesn't stop at the first level hence deeply
   * collects all parent dependencies in a Depth-First Search manner.
   * Allows bottom-to-top traversals i.e: which nodes are depending on
   * the provided rootVertexId.
   */
  public *getDeepParents(
    rootVertexId: VertexId,
    depthLimit?: number
  ): Generator<VertexId> {
    const rootVertex = this.#vertices.get(rootVertexId);
    if (!rootVertex) {
      return;
    }

    const visitedVertices: VertexId[] = [];

    for (const adjacentVertex of this.getParents(rootVertex.id)) {
      yield* this.findDeepDependencies(
        "bottom-to-top",
        rootVertex,
        adjacentVertex,
        depthLimit,
        visitedVertices
      );
    }
  }

  /**
   * Returns `true` if atleast one circular dependency exists in the graph,
   * otherwise, returns `false`.
   * If you want to know precisely what are the circular dependencies and
   * know what vertices are involved, use `findCycles()` instead.
   */
  public hasCycles(
    { maxDepth } = { maxDepth: Number.POSITIVE_INFINITY }
  ): boolean {
    let hasCycles = false;

    if (maxDepth === 0) {
      return hasCycles;
    }

    for (const [
      rootVertex,
      rootAdjacentVertex
    ] of this.collectRootAdjacencyLists()) {
      // early exit as we stop on the first cycle found
      if (hasCycles) {
        break;
      }
      const adjacencyList = new Set<VertexId>();
      for (const deepAdjacentVertexId of this.findDeepDependencies(
        "top-to-bottom",
        rootVertex,
        rootAdjacentVertex,
        maxDepth
      )) {
        adjacencyList.add(deepAdjacentVertexId);

        if (
          deepAdjacentVertexId === rootVertex.id ||
          adjacencyList.has(rootVertex.id)
        ) {
          hasCycles = true;
          break;
        }
      }
    }

    return hasCycles;
  }

  public findCycles(
    { maxDepth } = { maxDepth: Number.POSITIVE_INFINITY }
  ): VertexId[][] {
    const cyclicPathsWithMaybeDuplicates: VertexId[][] = [];

    if (maxDepth === 0) {
      return [];
    }

    for (const [
      rootVertex,
      rootAdjacentVertex
    ] of this.collectRootAdjacencyLists()) {
      const adjacencyList = new Set<VertexId>();

      for (const deepAdjacentVertexId of this.findDeepDependencies(
        "top-to-bottom",
        rootVertex,
        rootAdjacentVertex,
        maxDepth
      )) {
        adjacencyList.add(deepAdjacentVertexId);

        if (
          deepAdjacentVertexId === rootVertex.id ||
          adjacencyList.has(rootVertex.id)
        ) {
          const adjacencyListAsArray = [...adjacencyList];
          /**
           * We found a cycle, the first thing to do is to only keep the segment
           * from X to X with "X" being the root vertex of the current DFS.
           * It allows us to build sub cycles at any point in the path.
           */
          const verticesInBetweenCycle = adjacencyListAsArray.slice(
            0,
            adjacencyListAsArray.indexOf(rootVertex.id) + 1
          );
          cyclicPathsWithMaybeDuplicates.push(
            this.backtrackVerticesInvolvedInCycle([
              rootVertex.id,
              ...verticesInBetweenCycle
            ])
          );
        }
      }
    }

    return this.keepUniqueVerticesPaths([...cyclicPathsWithMaybeDuplicates]);
  }

  private *limitCycleDetectionDepth(
    dependenciesWalker: Generator<VertexId>,
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

  private *collectRootAdjacencyLists(): Generator<[Vertex, Vertex]> {
    for (const rootVertex of this.#vertices.values()) {
      for (const rootAdjacentVertexId of rootVertex.adjacentTo) {
        const rootAdjacentVertex = this.#vertices.get(rootAdjacentVertexId);
        if (!rootAdjacentVertex) {
          continue;
        }

        yield [rootVertex, rootAdjacentVertex];
      }
    }
  }

  /**
   * This method is used to deeply find either all lower dependencies of a given
   * vertex or all its upper dependencies.
   */
  // eslint-disable-next-line max-params
  private *findDeepDependencies(
    dependencyTraversal: "bottom-to-top" | "top-to-bottom",
    rootVertex: Vertex,
    traversedVertex: Vertex,
    depthLimit: number = Number.POSITIVE_INFINITY,
    verticesAlreadyVisited: VertexId[] = []
  ): Generator<VertexId> {
    if (verticesAlreadyVisited.includes(traversedVertex.id)) {
      return;
    }

    yield traversedVertex.id;
    verticesAlreadyVisited.push(traversedVertex.id);

    // Cycle reached, we must exit before entering in the infinite loop
    if (rootVertex.id === traversedVertex.id) {
      return;
    }

    const nextDependencies =
      dependencyTraversal === "top-to-bottom"
        ? traversedVertex.adjacentTo
        : this.getParents(traversedVertex.id).map(({ id }) => id);

    for (const adjacentVertexId of nextDependencies) {
      const adjacentVertex = this.#vertices.get(adjacentVertexId);
      if (adjacentVertex) {
        yield* this.limitCycleDetectionDepth(
          this.findDeepDependencies(
            dependencyTraversal,
            rootVertex,
            adjacentVertex,
            depthLimit,
            verticesAlreadyVisited
          ),
          depthLimit
        );
      }
    }
  }

  private keepUniqueVerticesPaths(paths: VertexId[][]): VertexId[][] {
    return uniqWith(paths, (pathA, pathB) => {
      // Narrow down the comparison to avoid unnecessary operations
      if (pathA.length !== pathB.length) {
        return false;
      }

      /**
       * In order for paths to be compared by values, arrays must be sorted e.g:
       * [a, b] !== [b, a] when strictly comparing values.
       */
      return isEqual(pathA.slice().sort(), pathB.slice().sort());
    });
  }

  /**
   * Once the cycle found, many vertices actually not involved in the cycle
   * might have been visited. To only keep vertices that are effectively involved
   * in the cyclic path, we must check that for any vertex there is an existing
   * path from its ancestor leading to the root node.
   */
  private backtrackVerticesInvolvedInCycle(
    verticesInCyclicPath: VertexId[]
  ): VertexId[] {
    for (let i = verticesInCyclicPath.length; i > 1; i--) {
      const currentNode = verticesInCyclicPath[i - 1];
      // The node just before the current one who is eventually its parent
      const nodeBeforeInPath = this.#vertices.get(verticesInCyclicPath[i - 2]);
      const isCurrentNodeParent =
        nodeBeforeInPath?.adjacentTo.includes(currentNode);
      /**
       * there is no path existing from the node just before to the current node,
       * meaning that the cycle path can't be coming from that path.
       */
      if (!isCurrentNodeParent) {
        // We must remove incrementally vertices that aren't involved in the cycle
        verticesInCyclicPath.splice(i - 2, 1);
      }
    }

    return [...new Set(verticesInCyclicPath)];
  }

  private *keepUniqueVertices(vertices: Vertex[]): Generator<Vertex> {
    const uniqueVerticesIds = new Set<VertexId>();

    for (const vertex of vertices) {
      if (!uniqueVerticesIds.has(vertex.id)) {
        uniqueVerticesIds.add(vertex.id);

        yield vertex;
      }
    }
  }

  private *depthFirstTraversalFrom(
    rootVertexId: VertexId,
    traversedVertices = new Set<VertexId>()
  ): Generator<Vertex, void, void> {
    if (traversedVertices.has(rootVertexId)) {
      return;
    }

    const rootVertex = this.#vertices.get(rootVertexId);

    if (!rootVertex) {
      return;
    }

    yield rootVertex;
    traversedVertices.add(rootVertexId);

    for (const vertexId of rootVertex.adjacentTo) {
      yield* this.depthFirstTraversalFrom(vertexId, traversedVertices);
    }
  }

  private *breadthFirstTraversalFrom(
    rootVertexId: VertexId,
    visitedVerticesIds = new Set<VertexId>()
  ): Generator<Vertex, void, void> {
    const vertex = this.#vertices.get(rootVertexId);

    if (!vertex) return;

    if (!visitedVerticesIds.has(rootVertexId)) {
      visitedVerticesIds.add(rootVertexId);
      yield vertex;
    }

    const nextVerticesToVisit: Vertex[] = [];
    for (const vertexId of vertex.adjacentTo) {
      const adjacentVertex = this.#vertices.get(vertexId);

      if (!adjacentVertex || visitedVerticesIds.has(adjacentVertex.id))
        continue;

      visitedVerticesIds.add(adjacentVertex.id);
      nextVerticesToVisit.push(adjacentVertex);
      yield adjacentVertex;
    }

    for (const nextVertex of nextVerticesToVisit) {
      yield* this.breadthFirstTraversalFrom(nextVertex.id, visitedVerticesIds);
    }
  }

  private *traverseAll(traversal: Traversal) {
    const visitedVertices = new Set<VertexId>();

    for (const vertexId of this.#vertices.keys()) {
      if (traversal === "dfs") {
        yield* this.depthFirstTraversalFrom(vertexId, visitedVertices);
      } else {
        yield* this.breadthFirstTraversalFrom(vertexId, visitedVertices);
      }
    }
  }
}
