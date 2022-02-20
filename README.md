  
  # dag-js ♽
  
  Make Directed Graph construction and manipulation easy, including cycle 
  dependency detection and graph traversal.

  **dag-js** allows you to create a directed graph structure with features such as cycle dependency detection 
  and graph introspection (finding ancestors and successors for any given vertices).
  It can be used to model your underlying system (can be a filesystem or simply objects)
  as a graph.
  
  <p align="center">
    <img src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/31qbt7u1mhog516uqlwb.png" alt="dag" />
  </p>

  Examples of use:
  - [affected builds (NX alike)](https://github.com/antoine-coulon/dag-js/tree/master/examples/affected-builds)
  - [detect cyclic imports (eslint-plugin-import alike)](https://github.com/antoine-coulon/dag-js/tree/master/examples/circular-dependencies)
  - Sequential vs Parallel execution of a given set of Nodes (i.e: Vertices)
