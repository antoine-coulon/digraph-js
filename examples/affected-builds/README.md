# Affected behavior

One of the strengths of the Directed Acyclic Graph is its ability to model dependencies
between ressources. Take for instance a project with multiple libs that are independently 
built each time we want to ship the main app. 

```
project
│
└───lib1
|   |   dist/
│   │   component1.jsx
│   
└───lib2
    |   dist/
    │   component2.jsx
    │   component3.jsx
|
|   package.json    
|   app.js
```

Our `app.js` represents our entry file and uses components from both `lib1` and `lib2`.
Now imagine you only change the `component1.jsx` but you have to build your whole 
app using a script such as:

```bash
# 'build' is a script which builds lib1 and lib2 each time no matter what
$ npm run build 
```

You might wonder what is the problem with this approach. The answer is that
its probably fine most of the time for small to medium sized projects.
However if your `lib1` and `lib2` end up growing (more components, but also 
including assets such as images, fonts etc) you might encounter performance issues 
for building your whole app.

## Affected projects/packages detection

The whole idea of detecting affected projects/packages is to only re-build
what change in your project. The tool in charge of that can introspect your 
project, and internally emit a Directed Acyclic Graph responsible for establishing
dependencies between pieces of your project. By using the emitted graph 
and a persisted cache (also handle by the tool), this enables smart builds and
many other tasks that depends on the state of the project (linting, testing, etc).

These concepts are very widely implement in Monorepo tools such as NX, Rush, Turborepo...
See more here: https://monorepo.tools/#detecting-affected-projects-packages 


## Example simulating affected build for a multi-libs project

See a very basic implementation of this concept in `index.js`. Be sure to 
build the `/dist` folder using the `build` script.

```bash
$ npm run build
$ node examples/affected-builds/index.js
```

