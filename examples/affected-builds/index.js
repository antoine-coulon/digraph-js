import crypto from "node:crypto";

import { DiGraph } from "../../dist/index.js";

const lib1Metadata = {
  id: "lib1",
  adjacentTo: [],
  body: {
    component: `<lib3.MyLib3Component />`
  }
};

const lib2Metadata = {
  id: "lib2",
  adjacentTo: [],
  body: { component: `<div>hello lib2</div>` }
};

const lib3Metadata = {
  id: "lib3",
  adjacentTo: [],
  body: { component: `<MyLib3Component>hello lib3</MyLib3Component>` }
};

/**
 * Simulating a project with three distincts libraries.
 * lib1 depends on lib3 (via the use of lib3.MyLib3Component) while library 2 is
 * independent.
 */
const projectGraph = new DiGraph();

// Update the Graph with detected dependencies
projectGraph.addVertices(lib1Metadata, lib2Metadata, lib3Metadata);

// lib1 depends on lib3 so we need to express this relationship using an edge
projectGraph.addEdge({ from: lib1Metadata.id, to: lib3Metadata.id });

// Simulating a simple cache, persisting an hashed value of the component
const cache = {
  lib1: {},
  lib2: {},
  lib3: {}
};

function isLibraryAffected(library) {
  const libraryHashedContent = crypto
    .createHash("sha1")
    .update(library.body.component)
    .digest("hex");

  return libraryHashedContent !== cache[library.id].component;
}

function buildLibrary(library) {
  const libraryHashedContent = crypto
    .createHash("sha1")
    .update(library.body.component)
    .digest("hex");

  console.log(`Building library: '${library.id}'`);
  // dependencyLib.buildFiles(); <= Webpack or any bundler
  cache[library.id].component = libraryHashedContent;
}

function buildAffected(library) {
  /**
   * If the component is still the same (i.e: hash data hasnt changed), we
   * don't want to rebuild it. If its "Affected", we must invalidate it
   */
  if (isLibraryAffected(library)) {
    // Component's hash changed, meaning we must build the library
    buildLibrary(library);

    return { hasLibraryBeenRebuilt: true };
  }

  // Lib has not changed so does not require a new build
  console.log(`Using cached version of '${library.id}'`);

  return { hasLibraryBeenRebuilt: false };
}

function* buildAllRootLibraryDependencies(rootLibrary) {
  for (const rootLibraryDependency of projectGraph.getLowerDependencies(
    rootLibrary
  )) {
    /**
     * Recursively build affected libraries starting from the deepest dependencies
     * of the root library.
     * N.B: DiGraph could also be used in order to orchestrate parallelization. For
     * example, two dependencies which don't share any dependencies in common
     * could be built in parallel.
     */
    yield* buildAllRootLibraryDependencies(rootLibraryDependency);
  }

  // End up by building the root library once all dependencies are up-to-date
  const { hasLibraryBeenRebuilt } = buildAffected(rootLibrary);

  yield hasLibraryBeenRebuilt;
}

/**
 * Build a library using affected mode (i.e: using DiGraph and cache to skip
 * unnecessary rebuild if possible)
 */
function buildEverythingAffectedIncludingRootLibrary(rootLibrary) {
  const rootLibraryDependencies = projectGraph.getLowerDependencies(
    rootLibrary.id
  );
  const allRebuiltLibraries = [];

  for (const dependencyLibrary of rootLibraryDependencies) {
    allRebuiltLibraries.push([
      ...buildAllRootLibraryDependencies(dependencyLibrary)
    ]);
  }

  /**
   * All root library's dependencies were re-built if necessary (i.e: affected).
   * However, we now need to determine if the root library has to also be
   * rebuilt. There are 2 conditions requiring the root library to be rebuilt:
   * - The root library itself changed
   * - Atleast one of the dependencies of the library changed
   */
  const HAS_LIBRARY_BEEN_REBUILT = true;
  const atleastOneLibraryChanged = allRebuiltLibraries
    .flat()
    .includes(HAS_LIBRARY_BEEN_REBUILT);

  if (atleastOneLibraryChanged) {
    buildLibrary(rootLibrary);
  } else {
    // Check if library itself changed
    buildAffected(rootLibrary);
  }
}

function buildProjectUsingAffectedStrategy() {
  console.log("\n----STEP 1-----");
  // Building for the first time
  buildEverythingAffectedIncludingRootLibrary(lib1Metadata);
  /**
   * Building for the second time but no dependencies of lib1 changed (neither
   * lib3 or lib4) so it remains unaffected (i.e: using cache)
   */
  console.log("\n----STEP 2-----");
  buildEverythingAffectedIncludingRootLibrary(lib1Metadata);

  console.log("\n----STEP 3-----");
  /**
   * Let's now change the content of lib3's component.
   * Remember, lib1 depends on lib3 via the use of lib3.MyLib3Component.
   */
  console.log("Changing lib3's content...");
  projectGraph.updateVertexBody(lib3Metadata.id, {
    // lib3 component is updated
    component: `<MyLib3Component>hello affected lib3!</MyLib3Component>`
  });

  console.log("\n----STEP 4-----");
  /**
   * Now that lib3 (dependency of lib1) changed BOTH lib3 and lib1 are considered
   * affected.
   * It means that we must rebuild both, starting with lib3 (lib1 must build
   * with the latest version of lib3).
   */
  buildEverythingAffectedIncludingRootLibrary(lib1Metadata);

  console.log("\n----STEP 5-----");
  /**
   * Now that everything was rebuilt, we can easily use cached versions once
   * again.
   */
  buildEverythingAffectedIncludingRootLibrary(lib1Metadata);
}

buildProjectUsingAffectedStrategy();
