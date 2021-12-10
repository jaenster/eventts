# EventTS

```typescript
import {EventTS} from "@jaenster/events-ts";

interface Foo {
    on<S = this>(event: "bar", cb: (this: S, a: string) => any);
}

class Foo extends EventTS {
    z: string = '';
}

const foo = new Foo;

foo.on('bar', function () {
    // `this` is typed
    if (this.z.length) {
        // something
    }
})
```