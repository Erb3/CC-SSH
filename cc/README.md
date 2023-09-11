# CC-SSH Agent

ComputerCraft agent for the CC-SSH project. It is written in Typescript, for consistency.

## Developing

1. Run `pnpm i` (or npm if you prefer)
2. Develop!
3. Run `pnpm run build` to test your agent

`sourceMapTraceback`: Overrides `debug.traceback` to add TypeScript source line numbers instead of Lua lines. This changes globals, so it's not recommended in production, but it can be useful for debugging.

## Libraries

### Built-in CraftOS APIs

All base CraftOS APIs are available in the global namespace.
Peripherals are also implemented as classes that inherit from the `IPeripheral` interface, so you can call `wrap` and cast it to the desired class to get typings for the peripheral.

### `cc.*` Modules

All modules available in `/rom/modules/main/cc` have typings included. To import them, just use the `import` statement like normal:

```ts
import * as strings from "cc.strings";
// ...
let str = strings.ensure_width(arg, 20);
```

### Events

A library for handling events in a nicer way (e.g. using named properties rather than indexes) is included as a separate source file. The first line in `main.ts` includes the `event` library, which has classes for each event type as well as functions that can automatically or manually pull events with the specified type.

Example:

```ts
import * as event from "./event";

const timer = os.startTimer(5);
while (true) {
  const ev = event.pullEventAs(event.TimerEvent, "timer");
  if (ev.id == timer) break;
}
```

All types are included in the compiled output, even if they were never used. To avoid this, comment out the event class declarations you don't need, and remove the init functions from `eventInitializers`. Do not remove `GenericEvent`, as this is the fallback event type when other types aren't available.
