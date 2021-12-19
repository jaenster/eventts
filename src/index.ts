import {MapExt, WeakMapExt} from "map-ext";

// Type S is just so we can tell reference back to what the this type is @ the handler
export type EventHandler<S = any> = (this: S, ...args) => any;


// A WeakMapExt exists out of a map, with a set per key
const [handlers, onceHandlers] = Array.from(Array(2))
    .map(() => new WeakMapExt<EventTS, Map<PropertyKey, Set<[EventHandler, object]>>>(
        // On an instance where the map dont exists, generate one
        () => new MapExt(
            // On a key in the map where the key doesnt exists yet, generate one
            () => new Set()
        )
    ))

export class EventTS {

    // Generic type S to give to EventHandler<S> to typehint this function gets the same this as where the event is registered
    public once<S = this>(key: PropertyKey, handler: EventHandler<S>, self?: object): this {
        return onceHandlers.get(this).get(key).add([handler, self]), this;
    }

    public on<S = this>(key: PropertyKey, handler: EventHandler<S>, self?: object): this {
        return handlers.get(this).get(key).add([handler, self]), this;
    }

    public off(key: PropertyKey, handler: EventHandler): this {
        [handlers, onceHandlers].forEach(handlerType => {
            handlerType.get(this).get(key)
                .forEach((a, i, set) => a[0] === handler && set.delete(a));
        });

        return this;
    }

    public emit(key: PropertyKey, ...args: any): this {
        const onceSet = (onceHandlers.get(this).get(key));
        const restSet = (handlers.get(this).get(key));

        const callbacks = [...onceSet, ...restSet];
        onceSet.clear();

        callbacks.forEach(([cb, self]) => cb.apply(self, args))
        return this;
    }

    public async emitAsync(key: PropertyKey, ...args: any): Promise<this> {
        const [once, rest] = [handlers, onceHandlers].map(a => a.get(this).get(key));

        const callbacks = [...once, ...rest];
        once.clear();

        await Promise.all(callbacks.map(([cb, self]) => cb.apply(self, args)));
        return this;
    }
}