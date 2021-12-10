// Type S is just so we can tell reference back to what the this type is @ the handler
export type EventHandler<S = any> = (this: S, ...args) => any;

type SetType = Set<[EventHandler, object]>;
type MapType = Map<PropertyKey, SetType>;
const handlers = new WeakMap<EventTS, MapType>();
const onceHandlers = new WeakMap<EventTS, MapType>();

function getMap(events: EventTS, handlerType = handlers) {
    let map: MapType;
    return !handlerType.has(events) ? handlerType.set(events, map = new Map) : map = handlerType.get(events), map;
}

function getSet(events: EventTS, key: PropertyKey, handlerType = handlers) {
    const map = getMap(events, handlerType);

    let set: SetType;
    return !map.has(key) ? map.set(key, set = new Set()) : set = map.get(key), set;
}

function internalOn(events: EventTS, key: PropertyKey, handler: EventHandler, handlerType, self: object = events): EventTS {
    const set = getSet(events, key, handlerType);

    // Add this handler, since it has to be unique we dont need to check if it exists
    set.add([handler, self]);

    return events;
}

export class EventTS {

    // Generic type S to give to EventHandler<S> to typehint this function gets the same this as where the event is registered
    public once<S = this>(key: PropertyKey, handler: EventHandler<S>, self?: object): this {
        return internalOn(this, key, handler, onceHandlers, self) as this;
    }

    public on<S = this>(key: PropertyKey, handler: EventHandler<S>, self?: object): this {
        return internalOn(this, key, handler, handlers, self) as this;
    }

    public off(key: PropertyKey, handler: EventHandler): this {
        [handlers, onceHandlers].forEach(handlerType => {
            const set = getSet(this, key, handlerType);

            set.forEach((a) => a[0] === handler && set.delete(a));
        });

        return this;
    }

    public emit(key: PropertyKey, ...args: any): this {
        const onceSet = (onceHandlers.get(this)?.get(key));
        const restSet = (handlers.get(this)?.get(key));


        const callbacks = [
            ...onceSet ?? [],
            ...restSet ?? [],
        ];

        onceSet?.clear();

        callbacks.forEach(([cb, self]) => cb.apply(self, args))
        return this;
    }
}