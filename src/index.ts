import uniqBy from "lodash.uniqby";

export type Vertex = {
  name: string;
  adjacentTo: Vertex[];
  value: Record<string, unknown>;
};

export class Dag {
  #vertices: Array<Vertex>;

  constructor() {
    this.#vertices = [];
  }

  get vertices(): Array<Vertex> {
    return this.#vertices;
  }

  get asTree(): Record<string, Array<Vertex>> {
    const flattenedVertices: Record<string, Array<Vertex>> = {};

    for (const vertex of this.vertices) {
      flattenedVertices[vertex.name] = vertex.adjacentTo;
    }

    return flattenedVertices;
  }

  addEdge({ from, to }: { from: Vertex; to: Vertex }): void {
    const sourceVertex = this.vertices.find(
      (vertex) => vertex.name === from.name
    );
    const targetVertex = this.vertices.find(
      (vertex) => vertex.name === to.name
    );
    if (sourceVertex && targetVertex) {
      const hasAlreadyAdjacentVertex = !targetVertex.adjacentTo.find(
        (adjacentVertex) => adjacentVertex.name === to.name
      );
      if (hasAlreadyAdjacentVertex) {
        to.adjacentTo = [{ ...from }];
      }
    }
  }

  addVertices(...vertices: Vertex[]): void {
    const verticesWithUniqueName = uniqBy(vertices, "name");
    const graphVerticesNames = this.vertices.map((vertex) => vertex.name);
    const newUniqueVertices = verticesWithUniqueName.filter(
      (vertex) => !graphVerticesNames.includes(vertex.name)
    );

    this.#vertices = this.vertices.concat(newUniqueVertices);
  }

  addMutation<T extends Record<string, unknown>>(
    vertex: Vertex,
    value: T
  ): void {
    const vertexToMutate = this.vertices.find(
      (currentVertex) => currentVertex.name === vertex.name
    );

    if (vertexToMutate) {
      vertexToMutate.value = value;
      vertexToMutate.adjacentTo.forEach((adjacentVertex) =>
        this.addMutation(adjacentVertex, value)
      );
    }
  }

  private *flattenAdjacentVerticesNames(vertex: Vertex): Generator<string> {
    yield vertex.name;
    for (const adjacentVertex of vertex.adjacentTo) {
      yield* this.flattenAdjacentVerticesNames(adjacentVertex);
    }
  }

  hasCycles(): boolean {
    let hasCycles = false;
    /**
     * Using the flattened structure of vertices (from Array to Record),
     * Vertex's name is used to detect cycle dependencies by comparing
     * each children vertex's name with the root vertex name.
     * If any children vertex's name has the name of the root vertex, we
     * consider it as the same Vertex in the DAG hence forming a cycle.
     */
    for (const [rootVertexName, adjacentVertices] of Object.entries(
      this.asTree
    )) {
      for (const adjacentVertex of adjacentVertices) {
        const adjacentVertexNames = [
          ...this.flattenAdjacentVerticesNames(adjacentVertex)
        ];
        if (adjacentVertexNames.includes(rootVertexName)) {
          hasCycles = true;
        }
      }
    }

    return hasCycles;
  }

  hasVertexDependencies(vertex: Vertex): boolean {
    return this.vertices.some((vertice) =>
      vertice.adjacentTo.some((adjacent) => adjacent.name === vertex.name)
    );
  }

  getVertexDependencies<T extends Record<string, unknown>>(
    vertex: Vertex<T>
  ): Vertex<T>[] {
    return this.vertices.filter((currentVertice) =>
      currentVertice.adjacentTo.some(
        (adjacentTo) => adjacentTo.name === vertex.name
      )
    );
  }
}
