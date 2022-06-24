export type VertexId = string;

export type VertexBody = Record<string, unknown>;

export type VertexDefinition<Body extends VertexBody> = {
  id: VertexId;
  adjacentTo: VertexId[];
  body: Body;
};
