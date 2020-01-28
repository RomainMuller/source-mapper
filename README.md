# `source-mapper`

As the maintainer of `typescript` projects (and other source-map enabled
software), bug reports often contain stack traces that contain pointers within
the compiled code, not in the source code.

This tool helps make debugging such cases easier by providing a simple tool to
map the compiled pointer to a source pointer:

```shell
$ source-mapper /path/to/file.js:15:30
/path/to/file.ts:12:15
```

This tool supports inline source maps.
