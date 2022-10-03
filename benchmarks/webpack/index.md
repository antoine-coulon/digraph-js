To perform benchmarks on a wide graph, we use webpack which is probably one of the largest open source Node.js codebase. `./webpack.json` is the file representing the whole webpack graph, built by [skott](https://github.com/antoine-coulon/skott).

Using an Apple M1, here are the results:

```
----------------------------------------
Started webpack benchmark with cycle detection = INFINITY
935 cycles found
Took 12.144 seconds to find cycles on Webpack
----------------------------------------
Started webpack benchmark with cycle detection = 500
876 cycles found
Took 9.318 seconds to find cycles on Webpack
----------------------------------------
Started webpack benchmark with cycle detection = 100
370 cycles found
Took 0.320 seconds to find cycles on Webpack
----------------------------------------
Started webpack benchmark with cycle detection = 20
30 cycles found
Took 0.038 seconds to find cycles on Webpack
```