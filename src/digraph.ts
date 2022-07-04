import { VertexDefinition, VertexId, VertexBody } from "./vertex.js";

export class DiGraph<Vertex extends VertexDefinition<VertexBody>> {
  #vertices: Map<VertexId, Vertex>;

  constructor() {
    this.#vertices = new Map();
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

    for (const vertexDependingOnDeletedVertex of this.getUpperDependencies(
      vertexId
    )) {
      this.deleteEdge({
        from: vertexDependingOnDeletedVertex.id,
        to: vertexId
      });
    }
  }

  public addEdge({ from, to }: { from: VertexId; to: VertexId }): void {
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

  public deleteEdge({ from, to }: { from: VertexId; to: VertexId }): void {
    const fromVertex = this.#vertices.get(from);

    if (fromVertex) {
      fromVertex.adjacentTo = fromVertex.adjacentTo.filter(
        (adjacentVertexId) => adjacentVertexId !== to
      );
    }
  }

  public updateVertexBody<Body extends VertexBody>(
    vertex: VertexDefinition<Body>,
    body: Body
  ): void {
    const rootVertexToMutate = this.#vertices.get(vertex.id);

    if (rootVertexToMutate) {
      rootVertexToMutate.body = body;
    }
  }

  /**
   * Allow top-to-bottom traversal by finding all direct dependencies of a given
   * vertex.
   * @example
   * // given A ---> B, A depends on B hence B is a lower dependency of A
   * getLowerDependencies(A).deepEqual(["B"]) === true
   */
  public getLowerDependencies(rootVertex: Vertex): Vertex[] {
    return [...this.#vertices.values()].filter((vertex) =>
      rootVertex.adjacentTo.includes(vertex.id)
    );
  }

  public getDeepLowerDependencies(rootVertex: Vertex): VertexId[] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    function* getDeepDependencies() {
      for (const adjacentVertexId of rootVertex.adjacentTo) {
        const adjacentVertex = self.#vertices.get(adjacentVertexId);

        if (adjacentVertex) {
          yield* self.findDeepDependencies("lower", rootVertex, adjacentVertex);
        }
      }
    }

    return Array.from(new Set([...getDeepDependencies()]));
  }

  /**
   * In order to allow bottom-to-top traversals, we provide this method allowing
   * us to know all vertices depending on the provided root vertex.
   * @example
   * // given A ---> B, A depends on B hence A is an upper dependency of B
   * getUpperDependencies(B).deepEqual(["A"]) === true
   */
  public getUpperDependencies(rootVertexId: VertexId): Vertex[] {
    return [...this.#vertices.values()].filter((vertex) =>
      vertex.adjacentTo.includes(rootVertexId)
    );
  }

  public getDeepUpperDependencies(rootVertex: Vertex): VertexId[] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    function* getDeepDependencies() {
      for (const adjacentVertex of self.getUpperDependencies(rootVertex.id)) {
        yield* self.findDeepDependencies("upper", rootVertex, adjacentVertex);
      }
    }

    return Array.from(new Set([...getDeepDependencies()]));
  }

  public *findDeepAdjacencyList(rootVertex: Vertex): Generator<VertexId> {
    for (const adjacentVertexId of rootVertex.adjacentTo) {
      const adjacentVertex = this.#vertices.get(adjacentVertexId);
      if (!adjacentVertex) {
        continue;
      }

      yield* this.findDeepDependencies("lower", rootVertex, adjacentVertex);
    }
  }

  public mutualPathExistsBetweenVertices(a: VertexId, b: VertexId): boolean {
    const rootVertexA = this.#vertices.get(a);
    const rootVertexB = this.#vertices.get(b);

    if (!rootVertexA || !rootVertexB) {
      return false;
    }

    const rootAdjacencyListOfA = rootVertexA.adjacentTo;
    const rootAdjacencyListOfB = rootVertexB.adjacentTo;

    if (rootAdjacencyListOfA.includes(b) && rootAdjacencyListOfB.includes(a)) {
      // At root adjacency level (without checking in depth adjacent nodes),
      // it exists a path from A to B and B to A, meaning there is a cycle
      return true;
    }

    const deepAdjacencyListA = [...this.findDeepAdjacencyList(rootVertexA)];
    const deepAdjacencyListB = [...this.findDeepAdjacencyList(rootVertexB)];

    if (deepAdjacencyListA.includes(b) && deepAdjacencyListB.includes(a)) {
      // At some depth in the graph (by checking in depth adjacent nodes),
      // it exists a path from A to B and B to A, meaning there is a cycle
      return true;
    }

    return false;
  }

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
      const adjacencyList = [];
      for (const deepAdjacentVertexId of this.findDeepDependencies(
        "lower",
        rootVertex,
        rootAdjacentVertex,
        maxDepth
      )) {
        adjacencyList.push(deepAdjacentVertexId);

        if (
          deepAdjacentVertexId === rootVertex.id ||
          adjacencyList.includes(rootVertex.id)
        ) {
          hasCycles = true;
        }
      }
    }

    return hasCycles;
  }

  public findCycles(
    { maxDepth } = { maxDepth: Number.POSITIVE_INFINITY }
  ): VertexId[][] {
    const cycles: VertexId[][] = [];

    if (maxDepth === 0) {
      return cycles;
    }

    /**
     * In order to detect circular dependencies, we compare
     * each adjacent vertex's id with the root vertex (first added in the graph) id.
     * If any adjacent vertex's id has the id of the root vertex, we can assert
     * that the traversed path forms a cycle.
     * While traversing the graph in a top-to-bottom maneer, we also check
     * that there is no inner cycle from any vertex to any other vertex.
     */
    const cyclicPathsWithMaybeDuplicates = [];
    for (const [
      rootVertex,
      rootAdjacentVertex
    ] of this.collectRootAdjacencyLists()) {
      const adjacencyList = [];
      for (const deepAdjacentVertexId of this.findDeepDependencies(
        "lower",
        rootVertex,
        rootAdjacentVertex,
        maxDepth
      )) {
        adjacencyList.push(deepAdjacentVertexId);

        if (
          deepAdjacentVertexId === rootVertex.id ||
          adjacencyList.includes(rootVertex.id)
        ) {
          const cyclePath = adjacencyList.slice(
            0,
            adjacencyList.indexOf(rootVertex.id) + 1
          );

          // eslint-disable-next-line max-depth
          if (cyclePath.includes(deepAdjacentVertexId)) {
            const verticesInvolvedInTheCycle =
              this.keepOnlyVerticesInvolvedInTheCycle(cyclePath);

            cyclicPathsWithMaybeDuplicates.push(verticesInvolvedInTheCycle);
          }
        }
      }
    }

    return this.unifyCyclicPaths(cyclicPathsWithMaybeDuplicates);
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
    dependencyTraversal: "upper" | "lower",
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
      dependencyTraversal === "lower"
        ? traversedVertex.adjacentTo
        : this.getUpperDependencies(traversedVertex.id).map(({ id }) => id);

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

  /**
   * During the circular dependency detecting, cycles can be duplicated as
   * the same cycle can be found in different paths or from starting from
   * different vertices.
   * This method unifies the duplicated cycles by keeping only one occurrence
   * of a cyclic path e.g: [ ["d", "a", "b"], ["b", "a", "d"] ] are both
   * representing the same cycle. Once we are sure about the fact that they
   * are strictly equal, we can just keep one of the occurrences.
   */
  private unifyCyclicPaths(cyclicPaths: VertexId[][]): VertexId[][] {
    const cyclicPathsAsSets = cyclicPaths.map(
      (cyclicPath) => new Set(cyclicPath)
    );

    for (let i = 0; i < cyclicPathsAsSets.length; i++) {
      for (let j = i + 1; j < cyclicPathsAsSets.length; j++) {
        if (cyclicPathsAsSets[i].size === cyclicPathsAsSets[j].size) {
          for (const vertex of cyclicPathsAsSets[j]) {
            // eslint-disable-next-line max-depth
            if (cyclicPathsAsSets[i].has(vertex)) {
              cyclicPathsAsSets[j].delete(vertex);
            }
          }
        }
      }
    }

    return cyclicPathsAsSets
      .map((cyclicPathAsSet) => Array.from(cyclicPathAsSet))
      .filter((cyclicPath) => cyclicPath.length > 0);
  }

  /**
   * Given a cyclic path (created from circular dependencies), we can check
   * if each vertex is involved in it by verifying that it exists a path starting
   * from it allowing to reach any other vertex in the list of vertices.
   * For instance take the cyclic path ["a", "b", "c", "d"] in which the
   * cycle is only involving "a", "b", "c":
   * To filter out the vertices, we can check that "d" can reach "a", "b", "c".
   * If that's not the case, "a" is surely not involved in the cycle.
   */
  private keepOnlyVerticesInvolvedInTheCycle(
    verticesIdsInPath: VertexId[]
  ): VertexId[] {
    // const numberOfVerticesThatShouldBeMatched = verticesIdsInPath.length - 1;
    const verticesReallyInvolvedInTheCycle = [];
    const matchesByVertex: Record<VertexId, number> = {};

    for (let index = 0; index < verticesIdsInPath.length; index++) {
      const currentVertexId = verticesIdsInPath[index];
      const everyVerticesExceptCurrentOne = verticesIdsInPath.filter(
        (_, idx) => idx !== index
      );

      if (!matchesByVertex[currentVertexId]) {
        matchesByVertex[currentVertexId] = 0;
      }

      for (const otherVertexId of everyVerticesExceptCurrentOne) {
        /**
         * Given ["a", "b"], if we can go from "a" to "b" and back to "a",
         * it means that it exists a cycle between the two vertices.
         * Consequently, we can check if there is a "mutual path" between
         * these two vertices.
         */
        if (
          this.mutualPathExistsBetweenVertices(currentVertexId, otherVertexId)
        ) {
          matchesByVertex[currentVertexId]++;
        }
      }

      /**
       * Any vertex involved in the cyclic path should be able to find atleast
       * a path to another vertex involved in the cycle. Vertices that are not able
       * to do that are probably not involved in the cycle.
       */
      if (matchesByVertex[currentVertexId] >= 1) {
        // We found paths from currentVertexId to every other vertex in the cycle.
        verticesReallyInvolvedInTheCycle.push(currentVertexId);
      }
    }

    return verticesReallyInvolvedInTheCycle;
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
}
