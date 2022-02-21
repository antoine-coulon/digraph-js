export type VertexId = string;

export type VertexPayload = Record<string, unknown>;

export type VertexDefinition<Payload extends VertexPayload> = {
  id: VertexId;
  adjacentTo: VertexId[];
  payload: Payload;
};
