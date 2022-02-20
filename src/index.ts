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
        to.adjacentTo = sourceVertex.adjacentTo.concat(from);
      }
    }
  }

  addVertices(...vertices: Vertex[]): void {
    this.#vertices = this.vertices.concat(vertices);
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

  hasCycles(): boolean {
    const [vertexA, vertexB] = this.vertices;

    const adjacentVerticesOfA = vertexA.adjacentTo;
    const adjacentVerticesOfB = vertexB.adjacentTo;

    if (
      adjacentVerticesOfA.find((adj) => adj.name === vertexB.name) &&
      adjacentVerticesOfB.find((adj) => adj.name === vertexA.name)
    ) {
      return true;
    }

    return false;
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
