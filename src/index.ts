export type Vertex = {
  name: string;
  adjacentTo: Vertex[];
  value: Record<string, unknown>;
};

export class Dag {
  public vertices: Array<Vertex>;

  constructor() {
    this.vertices = [];
  }

  addVertex({ name, adjacentTo, value }: any): void {
    this.vertices.push({ name, adjacentTo, value });
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

  hasAncestors(vertex: Vertex): boolean {
    return vertex.adjacentTo.length > 0;
  }

  hasSuccessors(vertex: Vertex): boolean {
    return this.vertices.some((vertice) =>
      vertice.adjacentTo.some((adjacent) => adjacent.name === vertex.name)
    );
  }

  getAncestors(vertex: Vertex): Vertex[] {
    return this.vertices.filter((currentVertice) =>
      vertex.adjacentTo.some(
        (adjacentTo) => adjacentTo.name === currentVertice.name
      )
    );
  }

  getSuccessors(vertex: Vertex): Vertex[] {
    return this.vertices.filter((currentVertice) =>
      currentVertice.adjacentTo.some(
        (adjacentTo) => adjacentTo.name === vertex.name
      )
    );
  }
}
