# Circular dependencies

A Directed Graph can be used to detect cyclic dependencies. Conceptually,
we have a cyclic dependency whenever there is a path from `Vertex X` -passing by 
one or many vertices- to `Vertex X`.

Let's take a very simple example to illustrate a cycle dependency. 
Let's say we have three JavaScript files, **A.js**, **B.js**, **C.js**:

**A.js**
```js
import { doSomethingFromB } from 'B.js';

export function doSomethingFromA() {}
```

**B.js**
```js
import { doSomethingFromC } from 'C.js';

export function doSomethingFromB() {}
```

**C.js**
```js
import { doSomethingFromA } from 'A.js';

export function doSomethingFromC() {}
```

**Cycle spotted**: `A --> B --> C --> A`. If you don't remember the definition, 
there is a cycle because it exists a path from `A` leading to `A`.
Even if some Node.js module systems are able to resolve cyclic imports, 
cycle dependencies often reveal conceptions problems. 

**dag.js** enables effortless cyclic dependencies detection.

## Example simulating cyclic dependencies between JavaScript files

See a very basic implementation of this concept in `index.js`. Be sure to 
build the `/dist` folder using the `build` script.

```bash
$ npm run build
$ node examples/circular-dependencies/index.js
```

