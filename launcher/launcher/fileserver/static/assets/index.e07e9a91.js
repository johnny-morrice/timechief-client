true&&(function polyfill() {
    const relList = document.createElement('link').relList;
    if (relList && relList.supports && relList.supports('modulepreload')) {
        return;
    }
    for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
        processPreload(link);
    }
    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') {
                continue;
            }
            for (const node of mutation.addedNodes) {
                if (node.tagName === 'LINK' && node.rel === 'modulepreload')
                    processPreload(node);
            }
        }
    }).observe(document, { childList: true, subtree: true });
    function getFetchOpts(script) {
        const fetchOpts = {};
        if (script.integrity)
            fetchOpts.integrity = script.integrity;
        if (script.referrerpolicy)
            fetchOpts.referrerPolicy = script.referrerpolicy;
        if (script.crossorigin === 'use-credentials')
            fetchOpts.credentials = 'include';
        else if (script.crossorigin === 'anonymous')
            fetchOpts.credentials = 'omit';
        else
            fetchOpts.credentials = 'same-origin';
        return fetchOpts;
    }
    function processPreload(link) {
        if (link.ep)
            // ep marker = processed
            return;
        link.ep = true;
        // prepopulate the load record
        const fetchOpts = getFetchOpts(link);
        fetch(link.href, fetchOpts);
    }
}());

const sharedConfig = {
  context: undefined,
  registry: undefined
};

const equalFn = (a, b) => a === b;
const $PROXY = Symbol("solid-proxy");
const $TRACK = Symbol("solid-track");
const $DEVCOMP = Symbol("solid-dev-component");
const signalOptions = {
  equals: equalFn
};
let runEffects = runQueue;
const STALE = 1;
const PENDING = 2;
const UNOWNED = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var Owner = null;
let Transition$1 = null;
let ExternalSourceConfig = null;
let Listener = null;
let Updates = null;
let Effects = null;
let ExecCount = 0;
function createRoot(fn, detachedOwner) {
  const listener = Listener,
    owner = Owner,
    unowned = fn.length === 0,
    current = detachedOwner === undefined ? owner : detachedOwner,
    root = unowned
      ? {
          owned: null,
          cleanups: null,
          context: null,
          owner: null
        }
      : {
          owned: null,
          cleanups: null,
          context: current ? current.context : null,
          owner: current
        },
    updateFn = unowned
      ? () =>
          fn(() => {
            throw new Error("Dispose method must be an explicit argument to createRoot function");
          })
      : () => fn(() => untrack(() => cleanNode(root)));
  Owner = root;
  Listener = null;
  try {
    return runUpdates(updateFn, true);
  } finally {
    Listener = listener;
    Owner = owner;
  }
}
function createSignal(value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const s = {
    value,
    observers: null,
    observerSlots: null,
    comparator: options.equals || undefined
  };
  {
    if (options.name) s.name = options.name;
    if (!options.internal) registerGraph(s);
  }
  const setter = value => {
    if (typeof value === "function") {
      value = value(s.value);
    }
    return writeSignal(s, value);
  };
  return [readSignal.bind(s), setter];
}
function createComputed(fn, value, options) {
  const c = createComputation(fn, value, true, STALE, options);
  updateComputation(c);
}
function createRenderEffect(fn, value, options) {
  const c = createComputation(fn, value, false, STALE, options);
  updateComputation(c);
}
function createEffect(fn, value, options) {
  runEffects = runUserEffects;
  const c = createComputation(fn, value, false, STALE, options);
  if (!options || !options.render) c.user = true;
  Effects ? Effects.push(c) : updateComputation(c);
}
function createMemo(fn, value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const c = createComputation(fn, value, true, 0, options);
  c.observers = null;
  c.observerSlots = null;
  c.comparator = options.equals || undefined;
  updateComputation(c);
  return readSignal.bind(c);
}
function untrack(fn) {
  if (Listener === null) return fn();
  const listener = Listener;
  Listener = null;
  try {
    if (ExternalSourceConfig) ;
    return fn();
  } finally {
    Listener = listener;
  }
}
function on(deps, fn, options) {
  const isArray = Array.isArray(deps);
  let prevInput;
  let defer = options && options.defer;
  return prevValue => {
    let input;
    if (isArray) {
      input = Array(deps.length);
      for (let i = 0; i < deps.length; i++) input[i] = deps[i]();
    } else input = deps();
    if (defer) {
      defer = false;
      return undefined;
    }
    const result = untrack(() => fn(input, prevInput, prevValue));
    prevInput = input;
    return result;
  };
}
function onMount(fn) {
  createEffect(() => untrack(fn));
}
function onCleanup(fn) {
  if (Owner === null)
    console.warn("cleanups created outside a `createRoot` or `render` will never be run");
  else if (Owner.cleanups === null) Owner.cleanups = [fn];
  else Owner.cleanups.push(fn);
  return fn;
}
function getOwner() {
  return Owner;
}
function runWithOwner(o, fn) {
  const prev = Owner;
  const prevListener = Listener;
  Owner = o;
  Listener = null;
  try {
    return runUpdates(fn, true);
  } catch (err) {
    handleError(err);
  } finally {
    Owner = prev;
    Listener = prevListener;
  }
}
function startTransition(fn) {
  const l = Listener;
  const o = Owner;
  return Promise.resolve().then(() => {
    Listener = l;
    Owner = o;
    let t;
    runUpdates(fn, false);
    Listener = Owner = null;
    return t ? t.done : undefined;
  });
}
function devComponent(Comp, props) {
  const c = createComputation(
    () =>
      untrack(() => {
        Object.assign(Comp, {
          [$DEVCOMP]: true
        });
        return Comp(props);
      }),
    undefined,
    true,
    0
  );
  c.props = props;
  c.observers = null;
  c.observerSlots = null;
  c.name = Comp.name;
  c.component = Comp;
  updateComputation(c);
  return c.tValue !== undefined ? c.tValue : c.value;
}
function registerGraph(value) {
  if (!Owner) return;
  if (Owner.sourceMap) Owner.sourceMap.push(value);
  else Owner.sourceMap = [value];
  value.graph = Owner;
}
function createContext(defaultValue, options) {
  const id = Symbol("context");
  return {
    id,
    Provider: createProvider(id, options),
    defaultValue
  };
}
function useContext(context) {
  return Owner && Owner.context && Owner.context[context.id] !== undefined
    ? Owner.context[context.id]
    : context.defaultValue;
}
function children(fn) {
  const children = createMemo(fn);
  const memo = createMemo(() => resolveChildren(children()), undefined, {
    name: "children"
  });
  memo.toArray = () => {
    const c = memo();
    return Array.isArray(c) ? c : c != null ? [c] : [];
  };
  return memo;
}
function readSignal() {
  if (this.sources && (this.state)) {
    if ((this.state) === STALE) updateComputation(this);
    else {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(this), false);
      Updates = updates;
    }
  }
  if (Listener) {
    const sSlot = this.observers ? this.observers.length : 0;
    if (!Listener.sources) {
      Listener.sources = [this];
      Listener.sourceSlots = [sSlot];
    } else {
      Listener.sources.push(this);
      Listener.sourceSlots.push(sSlot);
    }
    if (!this.observers) {
      this.observers = [Listener];
      this.observerSlots = [Listener.sources.length - 1];
    } else {
      this.observers.push(Listener);
      this.observerSlots.push(Listener.sources.length - 1);
    }
  }
  return this.value;
}
function writeSignal(node, value, isComp) {
  let current =
    node.value;
  if (!node.comparator || !node.comparator(current, value)) {
    node.value = value;
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i = 0; i < node.observers.length; i += 1) {
          const o = node.observers[i];
          const TransitionRunning = Transition$1 && Transition$1.running;
          if (TransitionRunning && Transition$1.disposed.has(o)) ;
          if (TransitionRunning ? !o.tState : !o.state) {
            if (o.pure) Updates.push(o);
            else Effects.push(o);
            if (o.observers) markDownstream(o);
          }
          if (!TransitionRunning) o.state = STALE;
        }
        if (Updates.length > 10e5) {
          Updates = [];
          if (true) throw new Error("Potential Infinite Loop Detected.");
          throw new Error();
        }
      }, false);
    }
  }
  return value;
}
function updateComputation(node) {
  if (!node.fn) return;
  cleanNode(node);
  const time = ExecCount;
  runComputation(
    node,
    node.value,
    time
  );
}
function runComputation(node, value, time) {
  let nextValue;
  const owner = Owner,
    listener = Listener;
  Listener = Owner = node;
  try {
    nextValue = node.fn(value);
  } catch (err) {
    if (node.pure) {
      {
        node.state = STALE;
        node.owned && node.owned.forEach(cleanNode);
        node.owned = null;
      }
    }
    node.updatedAt = time + 1;
    return handleError(err);
  } finally {
    Listener = listener;
    Owner = owner;
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && "observers" in node) {
      writeSignal(node, nextValue);
    } else node.value = nextValue;
    node.updatedAt = time;
  }
}
function createComputation(fn, init, pure, state = STALE, options) {
  const c = {
    fn,
    state: state,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init,
    owner: Owner,
    context: Owner ? Owner.context : null,
    pure
  };
  if (Owner === null)
    console.warn("computations created outside a `createRoot` or `render` will never be disposed");
  else if (Owner !== UNOWNED) {
    {
      if (!Owner.owned) Owner.owned = [c];
      else Owner.owned.push(c);
    }
  }
  if (options && options.name) c.name = options.name;
  return c;
}
function runTop(node) {
  if ((node.state) === 0) return;
  if ((node.state) === PENDING) return lookUpstream(node);
  if (node.suspense && untrack(node.suspense.inFallback)) return node.suspense.effects.push(node);
  const ancestors = [node];
  while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
    if (node.state) ancestors.push(node);
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    node = ancestors[i];
    if ((node.state) === STALE) {
      updateComputation(node);
    } else if ((node.state) === PENDING) {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(node, ancestors[0]), false);
      Updates = updates;
    }
  }
}
function runUpdates(fn, init) {
  if (Updates) return fn();
  let wait = false;
  if (!init) Updates = [];
  if (Effects) wait = true;
  else Effects = [];
  ExecCount++;
  try {
    const res = fn();
    completeUpdates(wait);
    return res;
  } catch (err) {
    if (!wait) Effects = null;
    Updates = null;
    handleError(err);
  }
}
function completeUpdates(wait) {
  if (Updates) {
    runQueue(Updates);
    Updates = null;
  }
  if (wait) return;
  const e = Effects;
  Effects = null;
  if (e.length) runUpdates(() => runEffects(e), false);
}
function runQueue(queue) {
  for (let i = 0; i < queue.length; i++) runTop(queue[i]);
}
function runUserEffects(queue) {
  let i,
    userLength = 0;
  for (i = 0; i < queue.length; i++) {
    const e = queue[i];
    if (!e.user) runTop(e);
    else queue[userLength++] = e;
  }
  for (i = 0; i < userLength; i++) runTop(queue[i]);
}
function lookUpstream(node, ignore) {
  node.state = 0;
  for (let i = 0; i < node.sources.length; i += 1) {
    const source = node.sources[i];
    if (source.sources) {
      const state = source.state;
      if (state === STALE) {
        if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount))
          runTop(source);
      } else if (state === PENDING) lookUpstream(source, ignore);
    }
  }
}
function markDownstream(node) {
  for (let i = 0; i < node.observers.length; i += 1) {
    const o = node.observers[i];
    if (!o.state) {
      o.state = PENDING;
      if (o.pure) Updates.push(o);
      else Effects.push(o);
      o.observers && markDownstream(o);
    }
  }
}
function cleanNode(node) {
  let i;
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(),
        index = node.sourceSlots.pop(),
        obs = source.observers;
      if (obs && obs.length) {
        const n = obs.pop(),
          s = source.observerSlots.pop();
        if (index < obs.length) {
          n.sourceSlots[s] = index;
          obs[index] = n;
          source.observerSlots[index] = s;
        }
      }
    }
  }
  if (node.owned) {
    for (i = node.owned.length - 1; i >= 0; i--) cleanNode(node.owned[i]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (i = node.cleanups.length - 1; i >= 0; i--) node.cleanups[i]();
    node.cleanups = null;
  }
  node.state = 0;
  delete node.sourceMap;
}
function castError(err) {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : "Unknown error", {
    cause: err
  });
}
function handleError(err, owner = Owner) {
  const error = castError(err);
  throw error;
}
function resolveChildren(children) {
  if (typeof children === "function" && !children.length) return resolveChildren(children());
  if (Array.isArray(children)) {
    const results = [];
    for (let i = 0; i < children.length; i++) {
      const result = resolveChildren(children[i]);
      Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
    }
    return results;
  }
  return children;
}
function createProvider(id, options) {
  return function provider(props) {
    let res;
    createRenderEffect(
      () =>
        (res = untrack(() => {
          Owner.context = {
            ...Owner.context,
            [id]: props.value
          };
          return children(() => props.children);
        })),
      undefined,
      options
    );
    return res;
  };
}

const FALLBACK = Symbol("fallback");
function dispose(d) {
  for (let i = 0; i < d.length; i++) d[i]();
}
function mapArray(list, mapFn, options = {}) {
  let items = [],
    mapped = [],
    disposers = [],
    len = 0,
    indexes = mapFn.length > 1 ? [] : null;
  onCleanup(() => dispose(disposers));
  return () => {
    let newItems = list() || [],
      i,
      j;
    newItems[$TRACK];
    return untrack(() => {
      let newLen = newItems.length,
        newIndices,
        newIndicesNext,
        temp,
        tempdisposers,
        tempIndexes,
        start,
        end,
        newEnd,
        item;
      if (newLen === 0) {
        if (len !== 0) {
          dispose(disposers);
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          indexes && (indexes = []);
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot(disposer => {
            disposers[0] = disposer;
            return options.fallback();
          });
          len = 1;
        }
      } else if (len === 0) {
        mapped = new Array(newLen);
        for (j = 0; j < newLen; j++) {
          items[j] = newItems[j];
          mapped[j] = createRoot(mapper);
        }
        len = newLen;
      } else {
        temp = new Array(newLen);
        tempdisposers = new Array(newLen);
        indexes && (tempIndexes = new Array(newLen));
        for (
          start = 0, end = Math.min(len, newLen);
          start < end && items[start] === newItems[start];
          start++
        );
        for (
          end = len - 1, newEnd = newLen - 1;
          end >= start && newEnd >= start && items[end] === newItems[newEnd];
          end--, newEnd--
        ) {
          temp[newEnd] = mapped[end];
          tempdisposers[newEnd] = disposers[end];
          indexes && (tempIndexes[newEnd] = indexes[end]);
        }
        newIndices = new Map();
        newIndicesNext = new Array(newEnd + 1);
        for (j = newEnd; j >= start; j--) {
          item = newItems[j];
          i = newIndices.get(item);
          newIndicesNext[j] = i === undefined ? -1 : i;
          newIndices.set(item, j);
        }
        for (i = start; i <= end; i++) {
          item = items[i];
          j = newIndices.get(item);
          if (j !== undefined && j !== -1) {
            temp[j] = mapped[i];
            tempdisposers[j] = disposers[i];
            indexes && (tempIndexes[j] = indexes[i]);
            j = newIndicesNext[j];
            newIndices.set(item, j);
          } else disposers[i]();
        }
        for (j = start; j < newLen; j++) {
          if (j in temp) {
            mapped[j] = temp[j];
            disposers[j] = tempdisposers[j];
            if (indexes) {
              indexes[j] = tempIndexes[j];
              indexes[j](j);
            }
          } else mapped[j] = createRoot(mapper);
        }
        mapped = mapped.slice(0, (len = newLen));
        items = newItems.slice(0);
      }
      return mapped;
    });
    function mapper(disposer) {
      disposers[j] = disposer;
      if (indexes) {
        const [s, set] = createSignal(j, {
          name: "index"
        });
        indexes[j] = set;
        return mapFn(newItems[j], s);
      }
      return mapFn(newItems[j]);
    }
  };
}
function createComponent(Comp, props) {
  return devComponent(Comp, props || {});
}
function trueFn() {
  return true;
}
const propTraps = {
  get(_, property, receiver) {
    if (property === $PROXY) return receiver;
    return _.get(property);
  },
  has(_, property) {
    if (property === $PROXY) return true;
    return _.has(property);
  },
  set: trueFn,
  deleteProperty: trueFn,
  getOwnPropertyDescriptor(_, property) {
    return {
      configurable: true,
      enumerable: true,
      get() {
        return _.get(property);
      },
      set: trueFn,
      deleteProperty: trueFn
    };
  },
  ownKeys(_) {
    return _.keys();
  }
};
function resolveSource(s) {
  return !(s = typeof s === "function" ? s() : s) ? {} : s;
}
function resolveSources() {
  for (let i = 0, length = this.length; i < length; ++i) {
    const v = this[i]();
    if (v !== undefined) return v;
  }
}
function mergeProps(...sources) {
  let proxy = false;
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];
    proxy = proxy || (!!s && $PROXY in s);
    sources[i] = typeof s === "function" ? ((proxy = true), createMemo(s)) : s;
  }
  if (proxy) {
    return new Proxy(
      {
        get(property) {
          for (let i = sources.length - 1; i >= 0; i--) {
            const v = resolveSource(sources[i])[property];
            if (v !== undefined) return v;
          }
        },
        has(property) {
          for (let i = sources.length - 1; i >= 0; i--) {
            if (property in resolveSource(sources[i])) return true;
          }
          return false;
        },
        keys() {
          const keys = [];
          for (let i = 0; i < sources.length; i++)
            keys.push(...Object.keys(resolveSource(sources[i])));
          return [...new Set(keys)];
        }
      },
      propTraps
    );
  }
  const sourcesMap = {};
  const defined = Object.create(null);
  for (let i = sources.length - 1; i >= 0; i--) {
    const source = sources[i];
    if (!source) continue;
    const sourceKeys = Object.getOwnPropertyNames(source);
    for (let i = sourceKeys.length - 1; i >= 0; i--) {
      const key = sourceKeys[i];
      if (key === "__proto__" || key === "constructor") continue;
      const desc = Object.getOwnPropertyDescriptor(source, key);
      if (!defined[key]) {
        defined[key] = desc.get
          ? {
              enumerable: true,
              configurable: true,
              get: resolveSources.bind((sourcesMap[key] = [desc.get.bind(source)]))
            }
          : desc.value !== undefined
          ? desc
          : undefined;
      } else {
        const sources = sourcesMap[key];
        if (sources) {
          if (desc.get) sources.push(desc.get.bind(source));
          else if (desc.value !== undefined) sources.push(() => desc.value);
        }
      }
    }
  }
  const target = {};
  const definedKeys = Object.keys(defined);
  for (let i = definedKeys.length - 1; i >= 0; i--) {
    const key = definedKeys[i],
      desc = defined[key];
    if (desc && desc.get) Object.defineProperty(target, key, desc);
    else target[key] = desc ? desc.value : undefined;
  }
  return target;
}
function splitProps(props, ...keys) {
  if ($PROXY in props) {
    const blocked = new Set(keys.length > 1 ? keys.flat() : keys[0]);
    const res = keys.map(k => {
      return new Proxy(
        {
          get(property) {
            return k.includes(property) ? props[property] : undefined;
          },
          has(property) {
            return k.includes(property) && property in props;
          },
          keys() {
            return k.filter(property => property in props);
          }
        },
        propTraps
      );
    });
    res.push(
      new Proxy(
        {
          get(property) {
            return blocked.has(property) ? undefined : props[property];
          },
          has(property) {
            return blocked.has(property) ? false : property in props;
          },
          keys() {
            return Object.keys(props).filter(k => !blocked.has(k));
          }
        },
        propTraps
      )
    );
    return res;
  }
  const otherObject = {};
  const objects = keys.map(() => ({}));
  for (const propName of Object.getOwnPropertyNames(props)) {
    const desc = Object.getOwnPropertyDescriptor(props, propName);
    const isDefaultDesc =
      !desc.get && !desc.set && desc.enumerable && desc.writable && desc.configurable;
    let blocked = false;
    let objectIndex = 0;
    for (const k of keys) {
      if (k.includes(propName)) {
        blocked = true;
        isDefaultDesc
          ? (objects[objectIndex][propName] = desc.value)
          : Object.defineProperty(objects[objectIndex], propName, desc);
      }
      ++objectIndex;
    }
    if (!blocked) {
      isDefaultDesc
        ? (otherObject[propName] = desc.value)
        : Object.defineProperty(otherObject, propName, desc);
    }
  }
  return [...objects, otherObject];
}

const narrowedError = name =>
  `Attempting to access a stale value from <${name}> that could possibly be undefined. This may occur because you are reading the accessor returned from the component at a time where it has already been unmounted. We recommend cleaning up any stale timers or async, or reading from the initial condition.`;
function For(props) {
  const fallback = "fallback" in props && {
    fallback: () => props.fallback
  };
  return createMemo(
    mapArray(() => props.each, props.children, fallback || undefined),
    undefined,
    {
      name: "value"
    }
  );
}
function Show(props) {
  const keyed = props.keyed;
  const condition = createMemo(() => props.when, undefined, {
    equals: (a, b) => (keyed ? a === b : !a === !b),
    name: "condition"
  });
  return createMemo(
    () => {
      const c = condition();
      if (c) {
        const child = props.children;
        const fn = typeof child === "function" && child.length > 0;
        return fn
          ? untrack(() =>
              child(
                keyed
                  ? c
                  : () => {
                      if (!untrack(condition)) throw narrowedError("Show");
                      return props.when;
                    }
              )
            )
          : child;
      }
      return props.fallback;
    },
    undefined,
    {
      name: "value"
    }
  );
}
function resetErrorBoundaries() {
}
if (globalThis) {
  if (!globalThis.Solid$$) globalThis.Solid$$ = true;
  else
    console.warn(
      "You appear to have multiple instances of Solid. This can lead to unexpected behavior."
    );
}

const booleans = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "hidden",
  "indeterminate",
  "inert",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "seamless",
  "selected"
];
const Properties = /*#__PURE__*/ new Set([
  "className",
  "value",
  "readOnly",
  "formNoValidate",
  "isMap",
  "noModule",
  "playsInline",
  ...booleans
]);
const ChildProperties = /*#__PURE__*/ new Set([
  "innerHTML",
  "textContent",
  "innerText",
  "children"
]);
const Aliases = /*#__PURE__*/ Object.assign(Object.create(null), {
  className: "class",
  htmlFor: "for"
});
const PropAliases = /*#__PURE__*/ Object.assign(Object.create(null), {
  class: "className",
  formnovalidate: {
    $: "formNoValidate",
    BUTTON: 1,
    INPUT: 1
  },
  ismap: {
    $: "isMap",
    IMG: 1
  },
  nomodule: {
    $: "noModule",
    SCRIPT: 1
  },
  playsinline: {
    $: "playsInline",
    VIDEO: 1
  },
  readonly: {
    $: "readOnly",
    INPUT: 1,
    TEXTAREA: 1
  }
});
function getPropAlias(prop, tagName) {
  const a = PropAliases[prop];
  return typeof a === "object" ? (a[tagName] ? a["$"] : undefined) : a;
}
const DelegatedEvents = /*#__PURE__*/ new Set([
  "beforeinput",
  "click",
  "dblclick",
  "contextmenu",
  "focusin",
  "focusout",
  "input",
  "keydown",
  "keyup",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "pointerdown",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointerup",
  "touchend",
  "touchmove",
  "touchstart"
]);
const SVGElements = /*#__PURE__*/ new Set([
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animate",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "color-profile",
  "cursor",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "font",
  "font-face",
  "font-face-format",
  "font-face-name",
  "font-face-src",
  "font-face-uri",
  "foreignObject",
  "g",
  "glyph",
  "glyphRef",
  "hkern",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "missing-glyph",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "set",
  "stop",
  "svg",
  "switch",
  "symbol",
  "text",
  "textPath",
  "tref",
  "tspan",
  "use",
  "view",
  "vkern"
]);
const SVGNamespace = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
};

function reconcileArrays(parentNode, a, b) {
  let bLength = b.length,
    aEnd = a.length,
    bEnd = bLength,
    aStart = 0,
    bStart = 0,
    after = a[aEnd - 1].nextSibling,
    map = null;
  while (aStart < aEnd || bStart < bEnd) {
    if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
      continue;
    }
    while (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    }
    if (aEnd === aStart) {
      const node = bEnd < bLength ? (bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart]) : after;
      while (bStart < bEnd) parentNode.insertBefore(b[bStart++], node);
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart])) a[aStart].remove();
        aStart++;
      }
    } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      const node = a[--aEnd].nextSibling;
      parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
      parentNode.insertBefore(b[--bEnd], node);
      a[aEnd] = b[bEnd];
    } else {
      if (!map) {
        map = new Map();
        let i = bStart;
        while (i < bEnd) map.set(b[i], i++);
      }
      const index = map.get(a[aStart]);
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i = aStart,
            sequence = 1,
            t;
          while (++i < aEnd && i < bEnd) {
            if ((t = map.get(a[i])) == null || t !== index + sequence) break;
            sequence++;
          }
          if (sequence > index - bStart) {
            const node = a[aStart];
            while (bStart < index) parentNode.insertBefore(b[bStart++], node);
          } else parentNode.replaceChild(b[bStart++], a[aStart++]);
        } else aStart++;
      } else a[aStart++].remove();
    }
  }
}

const $$EVENTS = "_$DX_DELEGATE";
function render(code, element, init, options = {}) {
  if (!element) {
    throw new Error(
      "The `element` passed to `render(..., element)` doesn't exist. Make sure `element` exists in the document."
    );
  }
  let disposer;
  createRoot(dispose => {
    disposer = dispose;
    element === document
      ? code()
      : insert(element, code(), element.firstChild ? null : undefined, init);
  }, options.owner);
  return () => {
    disposer();
    element.textContent = "";
  };
}
function template(html, isCE, isSVG) {
  let node;
  const create = () => {
    const t = document.createElement("template");
    t.innerHTML = html;
    return isSVG ? t.content.firstChild.firstChild : t.content.firstChild;
  };
  const fn = isCE
    ? () => untrack(() => document.importNode(node || (node = create()), true))
    : () => (node || (node = create())).cloneNode(true);
  fn.cloneNode = fn;
  return fn;
}
function delegateEvents(eventNames, document = window.document) {
  const e = document[$$EVENTS] || (document[$$EVENTS] = new Set());
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i];
    if (!e.has(name)) {
      e.add(name);
      document.addEventListener(name, eventHandler);
    }
  }
}
function setAttribute(node, name, value) {
  if (value == null) node.removeAttribute(name);
  else node.setAttribute(name, value);
}
function setAttributeNS(node, namespace, name, value) {
  if (value == null) node.removeAttributeNS(namespace, name);
  else node.setAttributeNS(namespace, name, value);
}
function className(node, value) {
  if (value == null) node.removeAttribute("class");
  else node.className = value;
}
function addEventListener$1(node, name, handler, delegate) {
  if (delegate) {
    if (Array.isArray(handler)) {
      node[`$$${name}`] = handler[0];
      node[`$$${name}Data`] = handler[1];
    } else node[`$$${name}`] = handler;
  } else if (Array.isArray(handler)) {
    const handlerFn = handler[0];
    node.addEventListener(name, (handler[0] = e => handlerFn.call(node, handler[1], e)));
  } else node.addEventListener(name, handler);
}
function classList(node, value, prev = {}) {
  const classKeys = Object.keys(value || {}),
    prevKeys = Object.keys(prev);
  let i, len;
  for (i = 0, len = prevKeys.length; i < len; i++) {
    const key = prevKeys[i];
    if (!key || key === "undefined" || value[key]) continue;
    toggleClassKey(node, key, false);
    delete prev[key];
  }
  for (i = 0, len = classKeys.length; i < len; i++) {
    const key = classKeys[i],
      classValue = !!value[key];
    if (!key || key === "undefined" || prev[key] === classValue || !classValue) continue;
    toggleClassKey(node, key, true);
    prev[key] = classValue;
  }
  return prev;
}
function style$1(node, value, prev) {
  if (!value) return prev ? setAttribute(node, "style") : value;
  const nodeStyle = node.style;
  if (typeof value === "string") return (nodeStyle.cssText = value);
  typeof prev === "string" && (nodeStyle.cssText = prev = undefined);
  prev || (prev = {});
  value || (value = {});
  let v, s;
  for (s in prev) {
    value[s] == null && nodeStyle.removeProperty(s);
    delete prev[s];
  }
  for (s in value) {
    v = value[s];
    if (v !== prev[s]) {
      nodeStyle.setProperty(s, v);
      prev[s] = v;
    }
  }
  return prev;
}
function spread(node, props = {}, isSVG, skipChildren) {
  const prevProps = {};
  if (!skipChildren) {
    createRenderEffect(
      () => (prevProps.children = insertExpression(node, props.children, prevProps.children))
    );
  }
  createRenderEffect(() => props.ref && props.ref(node));
  createRenderEffect(() => assign(node, props, isSVG, true, prevProps, true));
  return prevProps;
}
function use(fn, element, arg) {
  return untrack(() => fn(element, arg));
}
function insert(parent, accessor, marker, initial) {
  if (marker !== undefined && !initial) initial = [];
  if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
  createRenderEffect(current => insertExpression(parent, accessor(), current, marker), initial);
}
function assign(node, props, isSVG, skipChildren, prevProps = {}, skipRef = false) {
  props || (props = {});
  for (const prop in prevProps) {
    if (!(prop in props)) {
      if (prop === "children") continue;
      prevProps[prop] = assignProp(node, prop, null, prevProps[prop], isSVG, skipRef);
    }
  }
  for (const prop in props) {
    if (prop === "children") {
      if (!skipChildren) insertExpression(node, props.children);
      continue;
    }
    const value = props[prop];
    prevProps[prop] = assignProp(node, prop, value, prevProps[prop], isSVG, skipRef);
  }
}
function toPropertyName(name) {
  return name.toLowerCase().replace(/-([a-z])/g, (_, w) => w.toUpperCase());
}
function toggleClassKey(node, key, value) {
  const classNames = key.trim().split(/\s+/);
  for (let i = 0, nameLen = classNames.length; i < nameLen; i++)
    node.classList.toggle(classNames[i], value);
}
function assignProp(node, prop, value, prev, isSVG, skipRef) {
  let isCE, isProp, isChildProp, propAlias, forceProp;
  if (prop === "style") return style$1(node, value, prev);
  if (prop === "classList") return classList(node, value, prev);
  if (value === prev) return prev;
  if (prop === "ref") {
    if (!skipRef) value(node);
  } else if (prop.slice(0, 3) === "on:") {
    const e = prop.slice(3);
    prev && node.removeEventListener(e, prev);
    value && node.addEventListener(e, value);
  } else if (prop.slice(0, 10) === "oncapture:") {
    const e = prop.slice(10);
    prev && node.removeEventListener(e, prev, true);
    value && node.addEventListener(e, value, true);
  } else if (prop.slice(0, 2) === "on") {
    const name = prop.slice(2).toLowerCase();
    const delegate = DelegatedEvents.has(name);
    if (!delegate && prev) {
      const h = Array.isArray(prev) ? prev[0] : prev;
      node.removeEventListener(name, h);
    }
    if (delegate || value) {
      addEventListener$1(node, name, value, delegate);
      delegate && delegateEvents([name]);
    }
  } else if (prop.slice(0, 5) === "attr:") {
    setAttribute(node, prop.slice(5), value);
  } else if (
    (forceProp = prop.slice(0, 5) === "prop:") ||
    (isChildProp = ChildProperties.has(prop)) ||
    (!isSVG &&
      ((propAlias = getPropAlias(prop, node.tagName)) || (isProp = Properties.has(prop)))) ||
    (isCE = node.nodeName.includes("-"))
  ) {
    if (forceProp) {
      prop = prop.slice(5);
      isProp = true;
    }
    if (prop === "class" || prop === "className") className(node, value);
    else if (isCE && !isProp && !isChildProp) node[toPropertyName(prop)] = value;
    else node[propAlias || prop] = value;
  } else {
    const ns = isSVG && prop.indexOf(":") > -1 && SVGNamespace[prop.split(":")[0]];
    if (ns) setAttributeNS(node, ns, prop, value);
    else setAttribute(node, Aliases[prop] || prop, value);
  }
  return value;
}
function eventHandler(e) {
  const key = `$$${e.type}`;
  let node = (e.composedPath && e.composedPath()[0]) || e.target;
  if (e.target !== node) {
    Object.defineProperty(e, "target", {
      configurable: true,
      value: node
    });
  }
  Object.defineProperty(e, "currentTarget", {
    configurable: true,
    get() {
      return node || document;
    }
  });
  while (node) {
    const handler = node[key];
    if (handler && !node.disabled) {
      const data = node[`${key}Data`];
      data !== undefined ? handler.call(node, data, e) : handler.call(node, e);
      if (e.cancelBubble) return;
    }
    node = node._$host || node.parentNode || node.host;
  }
}
function insertExpression(parent, value, current, marker, unwrapArray) {
  while (typeof current === "function") current = current();
  if (value === current) return current;
  const t = typeof value,
    multi = marker !== undefined;
  parent = (multi && current[0] && current[0].parentNode) || parent;
  if (t === "string" || t === "number") {
    if (t === "number") value = value.toString();
    if (multi) {
      let node = current[0];
      if (node && node.nodeType === 3) {
        node.data !== value && (node.data = value);
      } else node = document.createTextNode(value);
      current = cleanChildren(parent, current, marker, node);
    } else {
      if (current !== "" && typeof current === "string") {
        current = parent.firstChild.data = value;
      } else current = parent.textContent = value;
    }
  } else if (value == null || t === "boolean") {
    current = cleanChildren(parent, current, marker);
  } else if (t === "function") {
    createRenderEffect(() => {
      let v = value();
      while (typeof v === "function") v = v();
      current = insertExpression(parent, v, current, marker);
    });
    return () => current;
  } else if (Array.isArray(value)) {
    const array = [];
    const currentArray = current && Array.isArray(current);
    if (normalizeIncomingArray(array, value, current, unwrapArray)) {
      createRenderEffect(() => (current = insertExpression(parent, array, current, marker, true)));
      return () => current;
    }
    if (array.length === 0) {
      current = cleanChildren(parent, current, marker);
      if (multi) return current;
    } else if (currentArray) {
      if (current.length === 0) {
        appendNodes(parent, array, marker);
      } else reconcileArrays(parent, current, array);
    } else {
      current && cleanChildren(parent);
      appendNodes(parent, array);
    }
    current = array;
  } else if (value.nodeType) {
    if (Array.isArray(current)) {
      if (multi) return (current = cleanChildren(parent, current, marker, value));
      cleanChildren(parent, current, null, value);
    } else if (current == null || current === "" || !parent.firstChild) {
      parent.appendChild(value);
    } else parent.replaceChild(value, parent.firstChild);
    current = value;
  } else console.warn(`Unrecognized value. Skipped inserting`, value);
  return current;
}
function normalizeIncomingArray(normalized, array, current, unwrap) {
  let dynamic = false;
  for (let i = 0, len = array.length; i < len; i++) {
    let item = array[i],
      prev = current && current[normalized.length],
      t;
    if (item == null || item === true || item === false);
    else if ((t = typeof item) === "object" && item.nodeType) {
      normalized.push(item);
    } else if (Array.isArray(item)) {
      dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
    } else if (t === "function") {
      if (unwrap) {
        while (typeof item === "function") item = item();
        dynamic =
          normalizeIncomingArray(
            normalized,
            Array.isArray(item) ? item : [item],
            Array.isArray(prev) ? prev : [prev]
          ) || dynamic;
      } else {
        normalized.push(item);
        dynamic = true;
      }
    } else {
      const value = String(item);
      if (prev && prev.nodeType === 3 && prev.data === value) normalized.push(prev);
      else normalized.push(document.createTextNode(value));
    }
  }
  return dynamic;
}
function appendNodes(parent, array, marker = null) {
  for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
}
function cleanChildren(parent, current, marker, replacement) {
  if (marker === undefined) return (parent.textContent = "");
  const node = replacement || document.createTextNode("");
  if (current.length) {
    let inserted = false;
    for (let i = current.length - 1; i >= 0; i--) {
      const el = current[i];
      if (node !== el) {
        const isParent = el.parentNode === parent;
        if (!inserted && !i)
          isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
        else isParent && el.remove();
      } else inserted = true;
    }
  } else parent.insertBefore(node, marker);
  return [node];
}

const isServer = false;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
function createElement(tagName, isSVG = false) {
  return isSVG ? document.createElementNS(SVG_NAMESPACE, tagName) : document.createElement(tagName);
}
function Portal(props) {
  const { useShadow } = props,
    marker = document.createTextNode(""),
    mount = () => props.mount || document.body,
    owner = getOwner();
  let content;
  let hydrating = !!sharedConfig.context;
  createEffect(
    () => {
      content || (content = runWithOwner(owner, () => createMemo(() => props.children)));
      const el = mount();
      if (el instanceof HTMLHeadElement) {
        const [clean, setClean] = createSignal(false);
        const cleanup = () => setClean(true);
        createRoot(dispose => insert(el, () => (!clean() ? content() : dispose()), null));
        onCleanup(cleanup);
      } else {
        const container = createElement(props.isSVG ? "g" : "div", props.isSVG),
          renderRoot =
            useShadow && container.attachShadow
              ? container.attachShadow({
                  mode: "open"
                })
              : container;
        Object.defineProperty(container, "_$host", {
          get() {
            return marker.parentNode;
          },
          configurable: true
        });
        insert(renderRoot, content);
        el.appendChild(container);
        props.ref && props.ref(container);
        onCleanup(() => el.removeChild(container));
      }
    },
    undefined,
    {
      render: !hydrating
    }
  );
  return marker;
}
function Dynamic(props) {
  const [p, others] = splitProps(props, ["component"]);
  const cached = createMemo(() => p.component);
  return createMemo(() => {
    const component = cached();
    switch (typeof component) {
      case "function":
        Object.assign(component, {
          [$DEVCOMP]: true
        });
        return untrack(() => component(others));
      case "string":
        const isSvg = SVGElements.has(component);
        const el = createElement(component, isSvg);
        spread(el, others, isSvg);
        return el;
    }
  });
}

function bindEvent(target, type, handler) {
    target.addEventListener(type, handler);
    return () => target.removeEventListener(type, handler);
}
function intercept([value, setValue], get, set) {
    return [get ? () => get(value()) : value, set ? (v) => setValue(set(v)) : setValue];
}
function querySelector(selector) {
    if (selector === "#") {
        return null;
    }
    // Guard against selector being an invalid CSS selector
    try {
        return document.querySelector(selector);
    }
    catch (e) {
        return null;
    }
}
function scrollToHash(hash, fallbackTop) {
    const el = querySelector(`#${hash}`);
    if (el) {
        el.scrollIntoView();
    }
    else if (fallbackTop) {
        window.scrollTo(0, 0);
    }
}
function createIntegration(get, set, init, utils) {
    let ignore = false;
    const wrap = (value) => (typeof value === "string" ? { value } : value);
    const signal = intercept(createSignal(wrap(get()), { equals: (a, b) => a.value === b.value }), undefined, next => {
        !ignore && set(next);
        return next;
    });
    init &&
        onCleanup(init((value = get()) => {
            ignore = true;
            signal[1](wrap(value));
            ignore = false;
        }));
    return {
        signal,
        utils
    };
}
function normalizeIntegration(integration) {
    if (!integration) {
        return {
            signal: createSignal({ value: "" })
        };
    }
    else if (Array.isArray(integration)) {
        return {
            signal: integration
        };
    }
    return integration;
}
function pathIntegration() {
    return createIntegration(() => ({
        value: window.location.pathname + window.location.search + window.location.hash,
        state: history.state
    }), ({ value, replace, scroll, state }) => {
        if (replace) {
            window.history.replaceState(state, "", value);
        }
        else {
            window.history.pushState(state, "", value);
        }
        scrollToHash(window.location.hash.slice(1), scroll);
    }, notify => bindEvent(window, "popstate", () => notify()), {
        go: delta => window.history.go(delta)
    });
}
function hashIntegration() {
    return createIntegration(() => window.location.hash.slice(1), ({ value, replace, scroll, state }) => {
        if (replace) {
            window.history.replaceState(state, "", "#" + value);
        }
        else {
            window.location.hash = value;
        }
        const hashIndex = value.indexOf("#");
        const hash = hashIndex >= 0 ? value.slice(hashIndex + 1) : "";
        scrollToHash(hash, scroll);
    }, notify => bindEvent(window, "hashchange", () => notify()), {
        go: delta => window.history.go(delta),
        renderPath: path => `#${path}`,
        parsePath: str => {
            const to = str.replace(/^.*?#/, "");
            // Hash-only hrefs like `#foo` from plain anchors will come in as `/#foo` whereas a link to
            // `/foo` will be `/#/foo`. Check if the to starts with a `/` and if not append it as a hash
            // to the current path so we can handle these in-page anchors correctly.
            if (!to.startsWith("/")) {
                const [, path = "/"] = window.location.hash.split("#", 2);
                return `${path}#${to}`;
            }
            return to;
        }
    });
}

function createBeforeLeave() {
    let listeners = new Set();
    function subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
    let ignore = false;
    function confirm(to, options) {
        if (ignore)
            return !(ignore = false);
        const e = {
            to,
            options,
            defaultPrevented: false,
            preventDefault: () => (e.defaultPrevented = true)
        };
        for (const l of listeners)
            l.listener({
                ...e,
                from: l.location,
                retry: (force) => {
                    force && (ignore = true);
                    l.navigate(to, options);
                }
            });
        return !e.defaultPrevented;
    }
    return {
        subscribe,
        confirm
    };
}

const hasSchemeRegex = /^(?:[a-z0-9]+:)?\/\//i;
const trimPathRegex = /^\/+|(\/)\/+$/g;
function normalizePath(path, omitSlash = false) {
    const s = path.replace(trimPathRegex, "$1");
    return s ? (omitSlash || /^[?#]/.test(s) ? s : "/" + s) : "";
}
function resolvePath(base, path, from) {
    if (hasSchemeRegex.test(path)) {
        return undefined;
    }
    const basePath = normalizePath(base);
    const fromPath = from && normalizePath(from);
    let result = "";
    if (!fromPath || path.startsWith("/")) {
        result = basePath;
    }
    else if (fromPath.toLowerCase().indexOf(basePath.toLowerCase()) !== 0) {
        result = basePath + fromPath;
    }
    else {
        result = fromPath;
    }
    return (result || "/") + normalizePath(path, !result);
}
function invariant(value, message) {
    if (value == null) {
        throw new Error(message);
    }
    return value;
}
function joinPaths(from, to) {
    return normalizePath(from).replace(/\/*(\*.*)?$/g, "") + normalizePath(to);
}
function extractSearchParams(url) {
    const params = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}
function createMatcher(path, partial, matchFilters) {
    const [pattern, splat] = path.split("/*", 2);
    const segments = pattern.split("/").filter(Boolean);
    const len = segments.length;
    return (location) => {
        const locSegments = location.split("/").filter(Boolean);
        const lenDiff = locSegments.length - len;
        if (lenDiff < 0 || (lenDiff > 0 && splat === undefined && !partial)) {
            return null;
        }
        const match = {
            path: len ? "" : "/",
            params: {}
        };
        const matchFilter = (s) => matchFilters === undefined ? undefined : matchFilters[s];
        for (let i = 0; i < len; i++) {
            const segment = segments[i];
            const locSegment = locSegments[i];
            const dynamic = segment[0] === ":";
            const key = dynamic ? segment.slice(1) : segment;
            if (dynamic && matchSegment(locSegment, matchFilter(key))) {
                match.params[key] = locSegment;
            }
            else if (dynamic || !matchSegment(locSegment, segment)) {
                return null;
            }
            match.path += `/${locSegment}`;
        }
        if (splat) {
            const remainder = lenDiff ? locSegments.slice(-lenDiff).join("/") : "";
            if (matchSegment(remainder, matchFilter(splat))) {
                match.params[splat] = remainder;
            }
            else {
                return null;
            }
        }
        return match;
    };
}
function matchSegment(input, filter) {
    const isEqual = (s) => s.localeCompare(input, undefined, { sensitivity: "base" }) === 0;
    if (filter === undefined) {
        return true;
    }
    else if (typeof filter === "string") {
        return isEqual(filter);
    }
    else if (typeof filter === "function") {
        return filter(input);
    }
    else if (Array.isArray(filter)) {
        return filter.some(isEqual);
    }
    else if (filter instanceof RegExp) {
        return filter.test(input);
    }
    return false;
}
function scoreRoute(route) {
    const [pattern, splat] = route.pattern.split("/*", 2);
    const segments = pattern.split("/").filter(Boolean);
    return segments.reduce((score, segment) => score + (segment.startsWith(":") ? 2 : 3), segments.length - (splat === undefined ? 0 : 1));
}
function createMemoObject(fn) {
    const map = new Map();
    const owner = getOwner();
    return new Proxy({}, {
        get(_, property) {
            if (!map.has(property)) {
                runWithOwner(owner, () => map.set(property, createMemo(() => fn()[property])));
            }
            return map.get(property)();
        },
        getOwnPropertyDescriptor() {
            return {
                enumerable: true,
                configurable: true
            };
        },
        ownKeys() {
            return Reflect.ownKeys(fn());
        }
    });
}
function expandOptionals(pattern) {
    let match = /(\/?\:[^\/]+)\?/.exec(pattern);
    if (!match)
        return [pattern];
    let prefix = pattern.slice(0, match.index);
    let suffix = pattern.slice(match.index + match[0].length);
    const prefixes = [prefix, (prefix += match[1])];
    // This section handles adjacent optional params. We don't actually want all permuations since
    // that will lead to equivalent routes which have the same number of params. For example
    // `/:a?/:b?/:c`? only has the unique expansion: `/`, `/:a`, `/:a/:b`, `/:a/:b/:c` and we can
    // discard `/:b`, `/:c`, `/:b/:c` by building them up in order and not recursing. This also helps
    // ensure predictability where earlier params have precidence.
    while ((match = /^(\/\:[^\/]+)\?/.exec(suffix))) {
        prefixes.push((prefix += match[1]));
        suffix = suffix.slice(match[0].length);
    }
    return expandOptionals(suffix).reduce((results, expansion) => [...results, ...prefixes.map(p => p + expansion)], []);
}

const MAX_REDIRECTS = 100;
const RouterContextObj = createContext();
const RouteContextObj = createContext();
const useRouter = () => invariant(useContext(RouterContextObj), "Make sure your app is wrapped in a <Router />");
let TempRoute;
const useRoute = () => TempRoute || useContext(RouteContextObj) || useRouter().base;
function createRoutes(routeDef, base = "", fallback) {
    const { component, data, children } = routeDef;
    const isLeaf = !children || (Array.isArray(children) && !children.length);
    const shared = {
        key: routeDef,
        element: component
            ? () => createComponent(component, {})
            : () => {
                const { element } = routeDef;
                return element === undefined && fallback
                    ? createComponent(fallback, {})
                    : element;
            },
        preload: routeDef.component
            ? component.preload
            : routeDef.preload,
        data
    };
    return asArray(routeDef.path).reduce((acc, path) => {
        for (const originalPath of expandOptionals(path)) {
            const path = joinPaths(base, originalPath);
            const pattern = isLeaf ? path : path.split("/*", 1)[0];
            acc.push({
                ...shared,
                originalPath,
                pattern,
                matcher: createMatcher(pattern, !isLeaf, routeDef.matchFilters)
            });
        }
        return acc;
    }, []);
}
function createBranch(routes, index = 0) {
    return {
        routes,
        score: scoreRoute(routes[routes.length - 1]) * 10000 - index,
        matcher(location) {
            const matches = [];
            for (let i = routes.length - 1; i >= 0; i--) {
                const route = routes[i];
                const match = route.matcher(location);
                if (!match) {
                    return null;
                }
                matches.unshift({
                    ...match,
                    route
                });
            }
            return matches;
        }
    };
}
function asArray(value) {
    return Array.isArray(value) ? value : [value];
}
function createBranches(routeDef, base = "", fallback, stack = [], branches = []) {
    const routeDefs = asArray(routeDef);
    for (let i = 0, len = routeDefs.length; i < len; i++) {
        const def = routeDefs[i];
        if (def && typeof def === "object" && def.hasOwnProperty("path")) {
            const routes = createRoutes(def, base, fallback);
            for (const route of routes) {
                stack.push(route);
                const isEmptyArray = Array.isArray(def.children) && def.children.length === 0;
                if (def.children && !isEmptyArray) {
                    createBranches(def.children, route.pattern, fallback, stack, branches);
                }
                else {
                    const branch = createBranch([...stack], branches.length);
                    branches.push(branch);
                }
                stack.pop();
            }
        }
    }
    // Stack will be empty on final return
    return stack.length ? branches : branches.sort((a, b) => b.score - a.score);
}
function getRouteMatches(branches, location) {
    for (let i = 0, len = branches.length; i < len; i++) {
        const match = branches[i].matcher(location);
        if (match) {
            return match;
        }
    }
    return [];
}
function createLocation(path, state) {
    const origin = new URL("http://sar");
    const url = createMemo(prev => {
        const path_ = path();
        try {
            return new URL(path_, origin);
        }
        catch (err) {
            console.error(`Invalid path ${path_}`);
            return prev;
        }
    }, origin, {
        equals: (a, b) => a.href === b.href
    });
    const pathname = createMemo(() => url().pathname);
    const search = createMemo(() => url().search, true);
    const hash = createMemo(() => url().hash);
    const key = createMemo(() => "");
    return {
        get pathname() {
            return pathname();
        },
        get search() {
            return search();
        },
        get hash() {
            return hash();
        },
        get state() {
            return state();
        },
        get key() {
            return key();
        },
        query: createMemoObject(on(search, () => extractSearchParams(url())))
    };
}
function createRouterContext(integration, base = "", data, out) {
    const { signal: [source, setSource], utils = {} } = normalizeIntegration(integration);
    const parsePath = utils.parsePath || (p => p);
    const renderPath = utils.renderPath || (p => p);
    const beforeLeave = utils.beforeLeave || createBeforeLeave();
    const basePath = resolvePath("", base);
    const output = undefined;
    if (basePath === undefined) {
        throw new Error(`${basePath} is not a valid base path`);
    }
    else if (basePath && !source().value) {
        setSource({ value: basePath, replace: true, scroll: false });
    }
    const [isRouting, setIsRouting] = createSignal(false);
    const start = async (callback) => {
        setIsRouting(true);
        try {
            await startTransition(callback);
        }
        finally {
            setIsRouting(false);
        }
    };
    const [reference, setReference] = createSignal(source().value);
    const [state, setState] = createSignal(source().state);
    const location = createLocation(reference, state);
    const referrers = [];
    const baseRoute = {
        pattern: basePath,
        params: {},
        path: () => basePath,
        outlet: () => null,
        resolvePath(to) {
            return resolvePath(basePath, to);
        }
    };
    if (data) {
        try {
            TempRoute = baseRoute;
            baseRoute.data = data({
                data: undefined,
                params: {},
                location,
                navigate: navigatorFactory(baseRoute)
            });
        }
        finally {
            TempRoute = undefined;
        }
    }
    function navigateFromRoute(route, to, options) {
        // Untrack in case someone navigates in an effect - don't want to track `reference` or route paths
        untrack(() => {
            if (typeof to === "number") {
                if (!to) {
                    // A delta of 0 means stay at the current location, so it is ignored
                }
                else if (utils.go) {
                    beforeLeave.confirm(to, options) && utils.go(to);
                }
                else {
                    console.warn("Router integration does not support relative routing");
                }
                return;
            }
            const { replace, resolve, scroll, state: nextState } = {
                replace: false,
                resolve: true,
                scroll: true,
                ...options
            };
            const resolvedTo = resolve ? route.resolvePath(to) : resolvePath("", to);
            if (resolvedTo === undefined) {
                throw new Error(`Path '${to}' is not a routable path`);
            }
            else if (referrers.length >= MAX_REDIRECTS) {
                throw new Error("Too many redirects");
            }
            const current = reference();
            if (resolvedTo !== current || nextState !== state()) {
                if (isServer) ;
                else if (beforeLeave.confirm(resolvedTo, options)) {
                    const len = referrers.push({ value: current, replace, scroll, state: state() });
                    start(() => {
                        setReference(resolvedTo);
                        setState(nextState);
                        resetErrorBoundaries();
                    }).then(() => {
                        if (referrers.length === len) {
                            navigateEnd({
                                value: resolvedTo,
                                state: nextState
                            });
                        }
                    });
                }
            }
        });
    }
    function navigatorFactory(route) {
        // Workaround for vite issue (https://github.com/vitejs/vite/issues/3803)
        route = route || useContext(RouteContextObj) || baseRoute;
        return (to, options) => navigateFromRoute(route, to, options);
    }
    function navigateEnd(next) {
        const first = referrers[0];
        if (first) {
            if (next.value !== first.value || next.state !== first.state) {
                setSource({
                    ...next,
                    replace: first.replace,
                    scroll: first.scroll
                });
            }
            referrers.length = 0;
        }
    }
    createRenderEffect(() => {
        const { value, state } = source();
        // Untrack this whole block so `start` doesn't cause Solid's Listener to be preserved
        untrack(() => {
            if (value !== reference()) {
                start(() => {
                    setReference(value);
                    setState(state);
                });
            }
        });
    });
    {
        function handleAnchorClick(evt) {
            if (evt.defaultPrevented ||
                evt.button !== 0 ||
                evt.metaKey ||
                evt.altKey ||
                evt.ctrlKey ||
                evt.shiftKey)
                return;
            const a = evt
                .composedPath()
                .find(el => el instanceof Node && el.nodeName.toUpperCase() === "A");
            if (!a || !a.hasAttribute("link"))
                return;
            const href = a.href;
            if (a.target || (!href && !a.hasAttribute("state")))
                return;
            const rel = (a.getAttribute("rel") || "").split(/\s+/);
            if (a.hasAttribute("download") || (rel && rel.includes("external")))
                return;
            const url = new URL(href);
            if (url.origin !== window.location.origin ||
                (basePath && url.pathname && !url.pathname.toLowerCase().startsWith(basePath.toLowerCase())))
                return;
            const to = parsePath(url.pathname + url.search + url.hash);
            const state = a.getAttribute("state");
            evt.preventDefault();
            navigateFromRoute(baseRoute, to, {
                resolve: false,
                replace: a.hasAttribute("replace"),
                scroll: !a.hasAttribute("noscroll"),
                state: state && JSON.parse(state)
            });
        }
        // ensure delegated events run first
        delegateEvents(["click"]);
        document.addEventListener("click", handleAnchorClick);
        onCleanup(() => document.removeEventListener("click", handleAnchorClick));
    }
    return {
        base: baseRoute,
        out: output,
        location,
        isRouting,
        renderPath,
        parsePath,
        navigatorFactory,
        beforeLeave
    };
}
function createRouteContext(router, parent, child, match, params) {
    const { base, location, navigatorFactory } = router;
    const { pattern, element: outlet, preload, data } = match().route;
    const path = createMemo(() => match().path);
    preload && preload();
    const route = {
        parent,
        pattern,
        get child() {
            return child();
        },
        path,
        params,
        data: parent.data,
        outlet,
        resolvePath(to) {
            return resolvePath(base.path(), to, path());
        }
    };
    if (data) {
        try {
            TempRoute = route;
            route.data = data({ data: parent.data, params, location, navigate: navigatorFactory(route) });
        }
        finally {
            TempRoute = undefined;
        }
    }
    return route;
}

const Router = (props) => {
  const {
    source,
    url,
    base,
    data,
    out
  } = props;
  const integration = source || (pathIntegration());
  const routerState = createRouterContext(integration, base, data);
  return createComponent(RouterContextObj.Provider, {
    value: routerState,
    get children() {
      return props.children;
    }
  });
};
const Routes = (props) => {
  const router = useRouter();
  const parentRoute = useRoute();
  const routeDefs = children(() => props.children);
  const branches = createMemo(() => createBranches(routeDefs(), joinPaths(parentRoute.pattern, props.base || ""), Outlet));
  const matches = createMemo(() => getRouteMatches(branches(), router.location.pathname));
  const params = createMemoObject(() => {
    const m = matches();
    const params2 = {};
    for (let i = 0; i < m.length; i++) {
      Object.assign(params2, m[i].params);
    }
    return params2;
  });
  if (router.out) {
    router.out.matches.push(matches().map(({
      route,
      path,
      params: params2
    }) => ({
      originalPath: route.originalPath,
      pattern: route.pattern,
      path,
      params: params2
    })));
  }
  const disposers = [];
  let root;
  const routeStates = createMemo(on(matches, (nextMatches, prevMatches, prev) => {
    let equal = prevMatches && nextMatches.length === prevMatches.length;
    const next = [];
    for (let i = 0, len = nextMatches.length; i < len; i++) {
      const prevMatch = prevMatches && prevMatches[i];
      const nextMatch = nextMatches[i];
      if (prev && prevMatch && nextMatch.route.key === prevMatch.route.key) {
        next[i] = prev[i];
      } else {
        equal = false;
        if (disposers[i]) {
          disposers[i]();
        }
        createRoot((dispose) => {
          disposers[i] = dispose;
          next[i] = createRouteContext(router, next[i - 1] || parentRoute, () => routeStates()[i + 1], () => matches()[i], params);
        });
      }
    }
    disposers.splice(nextMatches.length).forEach((dispose) => dispose());
    if (prev && equal) {
      return prev;
    }
    root = next[0];
    return next;
  }));
  return createComponent(Show, {
    get when() {
      return routeStates() && root;
    },
    keyed: true,
    children: (route) => createComponent(RouteContextObj.Provider, {
      value: route,
      get children() {
        return route.outlet();
      }
    })
  });
};
const Route = (props) => {
  const childRoutes = children(() => props.children);
  return mergeProps(props, {
    get children() {
      return childRoutes();
    }
  });
};
const Outlet = () => {
  const route = useRoute();
  return createComponent(Show, {
    get when() {
      return route.child;
    },
    keyed: true,
    children: (child) => createComponent(RouteContextObj.Provider, {
      value: child,
      get children() {
        return child.outlet();
      }
    })
  });
};

// Source: https://github.com/lukeed/clsx/blob/master/src/index.js
function toVal(mix) {
    var k, y, str = "";
    if (typeof mix === "string" || typeof mix === "number") {
        str += mix;
    }
    else if (typeof mix === "object") {
        if (Array.isArray(mix)) {
            for (k = 0; k < mix.length; k++) {
                if (mix[k]) {
                    if ((y = toVal(mix[k]))) {
                        str && (str += " ");
                        str += y;
                    }
                }
            }
        }
        else {
            for (k in mix) {
                if (mix[k]) {
                    str && (str += " ");
                    str += k;
                }
            }
        }
    }
    return str;
}
function classNames (...classes) {
    var i = 0, tmp, x, str = "";
    while (i < classes.length) {
        if ((tmp = classes[i++])) {
            if ((x = toVal(tmp))) {
                str && (str += " ");
                str += x;
            }
        }
    }
    return str;
}

/**
 * Solid event handlers can be a plain callback OR a tuple [handler, item].
 * This function calls the handler appropriately (if defined).
 */
function callEventHandler(h, e) {
    // capture if propagationStopped
    let isPropagationStopped = false;
    const defaultFn = e.stopPropagation;
    e.stopPropagation = () => {
        isPropagationStopped = true;
        defaultFn();
    };
    // call Solid handler appropriately
    if (typeof h === "function") {
        h(e);
    }
    else if (Array.isArray(h)) {
        h[0](h[1], e);
    }
    e.stopPropagation = defaultFn;
    return {
        isPropagationStopped,
    };
}
function resolveClasses(el, prev, now) {
    const p = prev ? prev.split(" ") : [];
    const n = now ? now.split(" ") : [];
    el.classList?.remove(...p.filter((s) => n.indexOf(s) === -1));
    el.classList?.add(...n.filter((s) => p.indexOf(s) === -1));
}

function isTrivialHref(href) {
  return !href || href.trim() === "#";
}
const defaultOptions = {
  tabIndex: 0
};
function useButtonProps(o) {
  const options = mergeProps(defaultOptions, o);
  const tagName = createMemo(() => {
    if (!options.tagName) {
      if (options.href != null || options.target != null || options.rel != null) {
        return "a";
      } else {
        return "button";
      }
    }
    return options.tagName;
  });
  const meta = {
    get tagName() {
      return tagName();
    }
  };
  if (tagName() === "button") {
    return [{
      get type() {
        return options.type || "button";
      },
      get disabled() {
        return options.disabled;
      }
    }, meta];
  }
  const getClickHandler = createMemo(() => (event) => {
    if (options.disabled || tagName() === "a" && isTrivialHref(options.href)) {
      event.preventDefault();
    }
    if (options.disabled) {
      event.stopPropagation();
      return;
    }
    callEventHandler(options.onClick, event);
  });
  const getKeyDownHandler = createMemo(() => (event) => {
    if (event.key === " ") {
      event.preventDefault();
      getClickHandler()(event);
    }
  });
  const getHref = () => {
    if (tagName() === "a") {
      return options.disabled ? void 0 : options.href || "#";
    }
    return options.href;
  };
  return [{
    role: "button",
    disabled: void 0,
    get tabIndex() {
      return options.disabled ? void 0 : options.tabIndex;
    },
    get href() {
      return getHref();
    },
    get target() {
      return tagName() === "a" ? options.target : void 0;
    },
    get "aria-disabled"() {
      return !options.disabled ? void 0 : options.disabled;
    },
    get rel() {
      return tagName() === "a" ? options.rel : void 0;
    },
    get onClick() {
      return getClickHandler();
    },
    get onKeyDown() {
      return getKeyDownHandler();
    }
  }, meta];
}

var toArray = Function.prototype.bind.call(Function.prototype.call, [].slice);
/**
 * Runs `querySelectorAll` on a given element.
 * 
 * @param element the element
 * @param selector the selector
 */

function qsa(element, selector) {
  return toArray(element.querySelectorAll(selector));
}

const canUseDOM = !!(typeof window !== 'undefined' && window.document && window.document.createElement);

/* eslint-disable no-return-assign */
var optionsSupported = false;
var onceSupported = false;

try {
  var options = {
    get passive() {
      return optionsSupported = true;
    },

    get once() {
      // eslint-disable-next-line no-multi-assign
      return onceSupported = optionsSupported = true;
    }

  };

  if (canUseDOM) {
    window.addEventListener('test', options, options);
    window.removeEventListener('test', options, true);
  }
} catch (e) {
  /* */
}

/**
 * An `addEventListener` ponyfill, supports the `once` option
 * 
 * @param node the element
 * @param eventName the event name
 * @param handle the handler
 * @param options event options
 */
function addEventListener(node, eventName, handler, options) {
  if (options && typeof options !== 'boolean' && !onceSupported) {
    var once = options.once,
        capture = options.capture;
    var wrappedHandler = handler;

    if (!onceSupported && once) {
      wrappedHandler = handler.__once || function onceHandler(event) {
        this.removeEventListener(eventName, onceHandler, capture);
        handler.call(this, event);
      };

      handler.__once = wrappedHandler;
    }

    node.addEventListener(eventName, wrappedHandler, optionsSupported ? options : capture);
  }

  node.addEventListener(eventName, handler, options);
}

/* eslint-disable no-bitwise, no-cond-assign */

/**
 * Checks if an element contains another given element.
 * 
 * @param context the context element
 * @param node the element to check
 */
function contains(context, node) {
  // HTML DOM and SVG DOM may have different support levels,
  // so we need to check on context instead of a document root element.
  if (context.contains) return context.contains(node);
  if (context.compareDocumentPosition) return context === node || !!(context.compareDocumentPosition(node) & 16);
}

/**
 * A `removeEventListener` ponyfill
 * 
 * @param node the element
 * @param eventName the event name
 * @param handle the handler
 * @param options event options
 */
function removeEventListener(node, eventName, handler, options) {
  var capture = options && typeof options !== 'boolean' ? options.capture : options;
  node.removeEventListener(eventName, handler, capture);

  if (handler.__once) {
    node.removeEventListener(eventName, handler.__once, capture);
  }
}

function listen(node, eventName, handler, options) {
  addEventListener(node, eventName, handler, options);
  return function () {
    removeEventListener(node, eventName, handler, options);
  };
}

/**
 * Returns the owner document of a given element.
 * 
 * @param node the element
 */
function ownerDocument(node) {
  return node && node.ownerDocument || document;
}

const SelectableContext = createContext(null);
const SelectableContext$1 = SelectableContext;

const ATTRIBUTE_PREFIX = `data-rr-ui-`;
function dataAttr(property) {
    return `${ATTRIBUTE_PREFIX}${property}`;
}

const Context = createContext(canUseDOM ? window : undefined);
Context.Provider;
/**
 * The document "window" placed in context. Helpful for determining
 * SSR context, or when rendering into an iframe.
 *
 * @returns the current window
 */
function useWindow() {
    return useContext(Context);
}

/**
 * Either returns passed in [value, handler] or creates a signal to control value.
 *
 * @param propValue if controlled
 * @param defaultValue optional default if value not controlled
 * @param handler called in both modes
 * @returns
 */
function createControlledProp(propValue, defaultValue, handler) {
    const [stateValue, setState] = createSignal(defaultValue());
    const isControlled = createMemo(() => propValue() !== undefined);
    /**
     * If a prop switches from controlled to Uncontrolled
     * reset its value to the defaultValue
     */
    createComputed(on(isControlled, (is, was) => {
        if (!is && was && stateValue() !== defaultValue()) {
            setState(() => defaultValue());
        }
    }));
    const getValue = () => (isControlled() ? propValue() : stateValue());
    const setValue = ((value, ...args) => {
        if (handler)
            handler(value, ...args);
        setState(() => value);
    });
    return [getValue, setValue];
}

/**
 * Returns the actively focused element safely.
 *
 * @param doc the document to check
 */

function activeElement(doc) {
  if (doc === void 0) {
    doc = ownerDocument();
  }

  // Support: IE 9 only
  // IE9 throws an "Unspecified error" accessing document.activeElement from an <iframe>
  try {
    var active = doc.activeElement; // IE11 returns a seemingly empty object in some cases when accessing
    // document.activeElement from an <iframe>

    if (!active || !active.nodeName) return null;
    return active;
  } catch (e) {
    /* ie throws if no active element */
    return doc.body;
  }
}

/**
 * Returns the owner window of a given element.
 * 
 * @param node the element
 */

function ownerWindow(node) {
  var doc = ownerDocument(node);
  return doc && doc.defaultView || window;
}

/**
 * Returns one or all computed style properties of an element.
 * 
 * @param node the element
 * @param psuedoElement the style property
 */

function getComputedStyle(node, psuedoElement) {
  return ownerWindow(node).getComputedStyle(node, psuedoElement);
}

var rUpper = /([A-Z])/g;
function hyphenate(string) {
  return string.replace(rUpper, '-$1').toLowerCase();
}

/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 * https://github.com/facebook/react/blob/2aeb8a2a6beb00617a4217f7f8284924fa2ad819/src/vendor/core/hyphenateStyleName.js
 */
var msPattern = /^ms-/;
function hyphenateStyleName(string) {
  return hyphenate(string).replace(msPattern, '-ms-');
}

var supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i;
function isTransform(value) {
  return !!(value && supportedTransforms.test(value));
}

function style(node, property) {
  var css = '';
  var transforms = '';

  if (typeof property === 'string') {
    return node.style.getPropertyValue(hyphenateStyleName(property)) || getComputedStyle(node).getPropertyValue(hyphenateStyleName(property));
  }

  Object.keys(property).forEach(function (key) {
    var value = property[key];

    if (!value && value !== 0) {
      node.style.removeProperty(hyphenateStyleName(key));
    } else if (isTransform(key)) {
      transforms += key + "(" + value + ") ";
    } else {
      css += hyphenateStyleName(key) + ": " + value + ";";
    }
  });

  if (transforms) {
    css += "transform: " + transforms + ";";
  }

  node.style.cssText += ";" + css;
}

/**
 * Get the width of the vertical window scrollbar if it's visible
 */
function getBodyScrollbarWidth(ownerDocument = document) {
    const window = ownerDocument.defaultView;
    return Math.abs(window.innerWidth - ownerDocument.documentElement.clientWidth);
}

const OPEN_DATA_ATTRIBUTE = dataAttr("modal-open");
/**
 * Manages a stack of Modals as well as ensuring
 * body scrolling is is disabled and padding accounted for
 */
class ModalManager {
    handleContainerOverflow;
    isRTL;
    modals;
    state;
    ownerDocument;
    constructor({ ownerDocument, handleContainerOverflow = true, isRTL = false, } = {}) {
        this.handleContainerOverflow = handleContainerOverflow;
        this.isRTL = isRTL;
        this.modals = [];
        this.ownerDocument = ownerDocument;
    }
    getScrollbarWidth() {
        return getBodyScrollbarWidth(this.ownerDocument);
    }
    getElement() {
        return (this.ownerDocument || document).body;
    }
    setModalAttributes(_modal) {
        // For overriding
    }
    removeModalAttributes(_modal) {
        // For overriding
    }
    setContainerStyle(containerState) {
        const style$1 = { overflow: "hidden" };
        // we are only interested in the actual `style` here
        // because we will override it
        const paddingProp = this.isRTL ? "paddingLeft" : "paddingRight";
        const container = this.getElement();
        containerState.style = {
            overflow: container.style.overflow,
            [paddingProp]: container.style[paddingProp],
        };
        if (containerState.scrollBarWidth) {
            // use computed style, here to get the real padding
            // to add our scrollbar width
            style$1[paddingProp] = `${parseInt(style(container, paddingProp) || "0", 10) + containerState.scrollBarWidth}px`;
        }
        container.setAttribute(OPEN_DATA_ATTRIBUTE, "");
        style(container, style$1);
    }
    reset() {
        [...this.modals].forEach((m) => this.remove(m));
    }
    removeContainerStyle(containerState) {
        const container = this.getElement();
        container.removeAttribute(OPEN_DATA_ATTRIBUTE);
        Object.assign(container.style, containerState.style);
    }
    add(modal) {
        let modalIdx = this.modals.indexOf(modal);
        if (modalIdx !== -1) {
            return modalIdx;
        }
        modalIdx = this.modals.length;
        this.modals.push(modal);
        this.setModalAttributes(modal);
        if (modalIdx !== 0) {
            return modalIdx;
        }
        this.state = {
            scrollBarWidth: this.getScrollbarWidth(),
            style: {},
        };
        if (this.handleContainerOverflow) {
            this.setContainerStyle(this.state);
        }
        return modalIdx;
    }
    remove(modal) {
        const modalIdx = this.modals.indexOf(modal);
        if (modalIdx === -1) {
            return;
        }
        this.modals.splice(modalIdx, 1);
        // if that was the last modal in a container,
        // clean up the container
        if (!this.modals.length && this.handleContainerOverflow) {
            this.removeContainerStyle(this.state);
        }
        this.removeModalAttributes(modal);
    }
    isTopModal(modal) {
        return !!this.modals.length && this.modals[this.modals.length - 1] === modal;
    }
}
const ModalManager$1 = ModalManager;

const resolveContainerRef = (ref, document) => {
    if (!canUseDOM)
        return null;
    if (ref == null)
        return (document || ownerDocument()).body;
    if (typeof ref === "function")
        ref = ref();
    if (ref?.nodeType)
        return ref || null;
    return null;
};
function useWaitForDOMRef(props) {
    const window = useWindow();
    const [resolvedRef, setRef] = createSignal(resolveContainerRef(props.ref, window?.document));
    createEffect(() => {
        if (props.onResolved && resolvedRef()) {
            props.onResolved(resolvedRef());
        }
    });
    createEffect(() => {
        const nextRef = resolveContainerRef(props.ref);
        if (nextRef !== resolvedRef()) {
            setRef(nextRef);
        }
    });
    return resolvedRef;
}

var _tmpl$$e = /* @__PURE__ */ template(`<div>`);
let manager;
function getManager(window) {
  if (!manager)
    manager = new ModalManager$1({
      ownerDocument: window?.document
    });
  return manager;
}
function useModalManager(provided) {
  const window = useWindow();
  const modalManager = provided || getManager(window);
  const modal = {
    dialog: null,
    backdrop: null
  };
  return Object.assign(modal, {
    add: () => modalManager.add(modal),
    remove: () => modalManager.remove(modal),
    isTopModal: () => modalManager.isTopModal(modal),
    setDialogRef: (ref) => {
      modal.dialog = ref;
    },
    setBackdropRef: (ref) => {
      modal.backdrop = ref;
    }
  });
}
const defaultProps$C = {
  show: false,
  role: "dialog",
  backdrop: true,
  keyboard: true,
  autoFocus: true,
  enforceFocus: true,
  restoreFocus: true,
  renderBackdrop: (props) => (() => {
    var _el$ = _tmpl$$e();
    spread(_el$, props, false, false);
    return _el$;
  })(),
  onHide: () => {
  }
};
const Modal = (p) => {
  const [local, props] = splitProps(
    mergeProps(defaultProps$C, p),
    ["show", "role", "class", "style", "children", "backdrop", "keyboard", "onBackdropClick", "onEscapeKeyDown", "transition", "backdropTransition", "autoFocus", "enforceFocus", "restoreFocus", "restoreFocusOptions", "renderDialog", "renderBackdrop", "manager", "container", "onShow", "onHide", "onExit", "onExited", "onExiting", "onEnter", "onEntering", "onEntered", "ref"]
  );
  const container = useWaitForDOMRef({
    get ref() {
      return local.container;
    }
  });
  const modal = useModalManager(local.manager);
  const owner = getOwner();
  const [isMounted, setIsMounted] = createSignal(false);
  onMount(() => setIsMounted(true));
  onCleanup(() => setIsMounted(false));
  const [exited, setExited] = createSignal(!local.show);
  let lastFocusRef = null;
  local.ref?.(modal);
  createComputed(on(() => local.show, (show, prevShow) => {
    if (canUseDOM && !prevShow && show) {
      lastFocusRef = activeElement();
    }
  }));
  createComputed(() => {
    if (!local.transition && !local.show && !exited()) {
      setExited(true);
    } else if (local.show && exited()) {
      setExited(false);
    }
  });
  const handleShow = () => {
    modal.add();
    removeKeydownListenerRef = listen(document, "keydown", handleDocumentKeyDown);
    removeFocusListenerRef = listen(
      document,
      "focus",
      () => setTimeout(handleEnforceFocus),
      true
    );
    if (local.onShow) {
      local.onShow();
    }
    if (local.autoFocus) {
      const currentActiveElement = activeElement(document);
      if (modal.dialog && currentActiveElement && !contains(modal.dialog, currentActiveElement)) {
        lastFocusRef = currentActiveElement;
        modal.dialog.focus();
      }
    }
  };
  const handleHide = () => {
    modal.remove();
    removeKeydownListenerRef?.();
    removeFocusListenerRef?.();
    if (local.restoreFocus) {
      lastFocusRef?.focus?.(local.restoreFocusOptions);
      lastFocusRef = null;
    }
  };
  createEffect(() => {
    if (!local.show || !container?.())
      return;
    handleShow();
  });
  createEffect(on(exited, (exited2, prev) => {
    if (exited2 && !(prev ?? exited2)) {
      handleHide();
    }
  }));
  onCleanup(() => {
    handleHide();
  });
  const handleEnforceFocus = () => {
    if (!local.enforceFocus || !isMounted() || !modal.isTopModal()) {
      return;
    }
    const currentActiveElement = activeElement();
    if (modal.dialog && currentActiveElement && !contains(modal.dialog, currentActiveElement)) {
      modal.dialog.focus();
    }
  };
  const handleBackdropClick = (e) => {
    if (e.target !== e.currentTarget) {
      return;
    }
    local.onBackdropClick?.(e);
    if (local.backdrop === true) {
      local.onHide?.();
    }
  };
  const handleDocumentKeyDown = (e) => {
    if (local.keyboard && e.keyCode === 27 && modal.isTopModal()) {
      local.onEscapeKeyDown?.(e);
      if (!e.defaultPrevented) {
        local.onHide?.();
      }
    }
  };
  let removeFocusListenerRef;
  let removeKeydownListenerRef;
  const handleHidden = (...args) => {
    setExited(true);
    local.onExited?.(...args);
  };
  const dialogVisible = createMemo(() => !!(local.show || local.transition && !exited()));
  const dialogProps = mergeProps({
    get role() {
      return local.role;
    },
    get ref() {
      return modal.setDialogRef;
    },
    get "aria-modal"() {
      return local.role === "dialog" ? true : void 0;
    }
  }, props, {
    get style() {
      return local.style;
    },
    get class() {
      return local.class;
    },
    tabIndex: -1
  });
  const getChildAsDocument = () => {
    const c = children(() => local.children);
    c()?.setAttribute?.("role", "document");
    return c;
  };
  let innerDialog = () => runWithOwner(owner, () => local.renderDialog ? local.renderDialog(dialogProps) : (() => {
    var _el$2 = _tmpl$$e();
    spread(_el$2, dialogProps, false, true);
    insert(_el$2, getChildAsDocument);
    return _el$2;
  })());
  const Dialog = () => {
    const Transition = local.transition;
    return !Transition ? innerDialog : createComponent(Transition, {
      appear: true,
      unmountOnExit: true,
      get ["in"]() {
        return !!local.show;
      },
      get onExit() {
        return local.onExit;
      },
      get onExiting() {
        return local.onExiting;
      },
      onExited: handleHidden,
      get onEnter() {
        return local.onEnter;
      },
      get onEntering() {
        return local.onEntering;
      },
      get onEntered() {
        return local.onEntered;
      },
      children: innerDialog
    });
  };
  const Backdrop = () => {
    let backdropElement = null;
    if (local.backdrop) {
      const BackdropTransition = local.backdropTransition;
      backdropElement = local.renderBackdrop({
        ref: modal.setBackdropRef,
        onClick: handleBackdropClick
      });
      if (BackdropTransition) {
        backdropElement = createComponent(BackdropTransition, {
          appear: true,
          get ["in"]() {
            return !!local.show;
          },
          children: backdropElement
        });
      }
    }
    return backdropElement;
  };
  return createComponent(Show, {
    get when() {
      return createMemo(() => !!container())() && dialogVisible();
    },
    get children() {
      return createComponent(Portal, {
        get mount() {
          return container();
        },
        get children() {
          return [createComponent(Backdrop, {}), createComponent(Dialog, {})];
        }
      });
    }
  });
};
const BaseModal = Object.assign(Modal, {
  Manager: ModalManager$1
});

const TransitionGroupContext = createContext(null);
const TransitionGroupContext$1 = TransitionGroupContext;

function nextFrame(fn) {
    requestAnimationFrame(() => {
        requestAnimationFrame(fn);
    });
}

const UNMOUNTED = "unmounted";
const EXITED = "exited";
const ENTERING = "entering";
const ENTERED = "entered";
const EXITING = "exiting";
function noop() {
}
const defaultProps$B = {
  in: false,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
  enter: true,
  exit: true,
  onEnter: noop,
  onEntering: noop,
  onEntered: noop,
  onExit: noop,
  onExiting: noop,
  onExited: noop
};
const Transition = (p) => {
  const [local, childProps] = splitProps(mergeProps(defaultProps$B, p), ["in", "children", "mountOnEnter", "unmountOnExit", "appear", "enter", "exit", "timeout", "addEndListener", "onEnter", "onEntering", "onEntered", "onExit", "onExiting", "onExited", "nodeRef"]);
  let context = useContext(TransitionGroupContext$1);
  let childRef;
  let appear = context && !context.isMounting ? local.enter : local.appear;
  let initialStatus;
  let appearStatus = null;
  if (local.in) {
    if (appear) {
      initialStatus = EXITED;
      appearStatus = ENTERING;
    } else {
      initialStatus = ENTERED;
    }
  } else {
    if (local.unmountOnExit || local.mountOnEnter) {
      initialStatus = UNMOUNTED;
    } else {
      initialStatus = EXITED;
    }
  }
  const [status, setStatus] = createSignal(initialStatus);
  let nextCallback = null;
  const [mounted, setMounted] = createSignal(false);
  const notUnmounted = createMemo(() => status() !== UNMOUNTED);
  onMount(() => {
    updateStatus(true, appearStatus);
    setMounted(true);
  });
  const inMemo = createMemo(() => local.in);
  createComputed(on(inMemo, () => {
    if (!mounted())
      return;
    const prevStatus = status();
    if (inMemo() && prevStatus === UNMOUNTED) {
      setStatus(EXITED);
    }
    let nextStatus = null;
    if (inMemo()) {
      if (prevStatus !== ENTERING && prevStatus !== ENTERED) {
        nextStatus = ENTERING;
      }
    } else {
      if (prevStatus === ENTERING || prevStatus === ENTERED) {
        nextStatus = EXITING;
      }
    }
    updateStatus(false, nextStatus ?? EXITED);
  }));
  onCleanup(() => {
    cancelNextCallback();
  });
  function getTimeouts() {
    const {
      timeout
    } = local;
    let exit, enter, appear2;
    if (typeof timeout === "number") {
      exit = enter = appear2 = timeout;
    } else if (timeout != null) {
      exit = timeout.exit;
      enter = timeout.enter;
      appear2 = timeout.appear !== void 0 ? timeout.appear : enter;
    }
    return {
      exit,
      enter,
      appear: appear2
    };
  }
  function updateStatus(mounting = false, nextStatus) {
    if (nextStatus !== null) {
      cancelNextCallback();
      if (nextStatus === ENTERING) {
        performEnter(mounting);
      } else {
        performExit();
      }
    } else if (local.unmountOnExit && status() === EXITED) {
      setStatus(UNMOUNTED);
    }
  }
  function performEnter(mounting) {
    const {
      enter
    } = local;
    const appearing = context ? context.isMounting : mounting;
    const [maybeNode, maybeAppearing] = local.nodeRef ? [appearing] : [childRef, appearing];
    const timeouts = getTimeouts();
    const enterTimeout = appearing ? timeouts.appear : timeouts.enter;
    if (!mounting && !enter) {
      safeSetState(ENTERED, () => {
        local.onEntered(maybeNode);
      });
      return;
    }
    local.onEnter(maybeNode, maybeAppearing);
    nextFrame(() => safeSetState(ENTERING, () => {
      local.onEntering(maybeNode, maybeAppearing);
      onTransitionEnd(enterTimeout, () => {
        safeSetState(ENTERED, () => {
          local.onEntered(maybeNode, maybeAppearing);
        });
      });
    }));
  }
  function performExit() {
    const {
      exit
    } = local;
    const timeouts = getTimeouts();
    const maybeNode = local.nodeRef ? void 0 : childRef;
    if (!exit) {
      safeSetState(EXITED, () => {
        local.onExited(maybeNode);
      });
      return;
    }
    local.onExit(maybeNode);
    nextFrame(() => safeSetState(EXITING, () => {
      local.onExiting(maybeNode);
      onTransitionEnd(timeouts.exit, () => {
        safeSetState(EXITED, () => {
          local.onExited(maybeNode);
        });
        if (local.unmountOnExit) {
          nextFrame(() => {
            setStatus(UNMOUNTED);
          });
        }
      });
    }));
  }
  function cancelNextCallback() {
    if (nextCallback !== null) {
      nextCallback?.cancel();
      nextCallback = null;
    }
  }
  function safeSetState(nextState, callback) {
    callback = setNextCallback(callback);
    setStatus(nextState);
    callback();
  }
  function setNextCallback(callback) {
    let active = true;
    nextCallback = (...args) => {
      if (active) {
        active = false;
        nextCallback = null;
        callback(...args);
      }
    };
    nextCallback.cancel = () => {
      active = false;
    };
    return nextCallback;
  }
  function onTransitionEnd(timeout, handler) {
    setNextCallback(handler);
    const node = local.nodeRef ? local.nodeRef : childRef;
    const doesNotHaveTimeoutOrListener = timeout == null && !local.addEndListener;
    if (!node || doesNotHaveTimeoutOrListener) {
      nextCallback && setTimeout(nextCallback, 0);
      return;
    }
    if (local.addEndListener) {
      const [maybeNode, maybeNextCallback] = local.nodeRef ? [nextCallback] : [node, nextCallback];
      local.addEndListener(maybeNode, maybeNextCallback);
    }
    if (timeout != null && nextCallback) {
      setTimeout(nextCallback, timeout);
    }
  }
  let resolvedChildren;
  function renderChild() {
    if (!resolvedChildren)
      resolvedChildren = children(() => local.children);
    const c = resolvedChildren();
    return typeof c === "function" ? c(status(), childProps) : c;
  }
  return createComponent(TransitionGroupContext$1.Provider, {
    value: null,
    get children() {
      return createComponent(Show, {
        get when() {
          return notUnmounted();
        },
        get children() {
          return renderChild();
        }
      });
    }
  });
};

const DEFAULT_BREAKPOINTS = ["xxl", "xl", "lg", "md", "sm", "xs"];
const ThemeContext = createContext({
  prefixes: {},
  breakpoints: DEFAULT_BREAKPOINTS
});
function useBootstrapPrefix(prefix, defaultPrefix) {
  const themeContext = useContext(ThemeContext);
  return prefix || themeContext.prefixes[defaultPrefix] || defaultPrefix;
}
function useBootstrapBreakpoints() {
  const ctx = useContext(ThemeContext);
  return () => ctx.breakpoints;
}

function triggerBrowserReflow(node) {
  node.offsetHeight;
}

/**
 * Triggers an event on a given element.
 * 
 * @param node the element
 * @param eventName the event name to trigger
 * @param bubbles whether the event should bubble up
 * @param cancelable whether the event should be cancelable
 */
function triggerEvent(node, eventName, bubbles, cancelable) {
  if (bubbles === void 0) {
    bubbles = false;
  }

  if (cancelable === void 0) {
    cancelable = true;
  }

  if (node) {
    var event = document.createEvent('HTMLEvents');
    event.initEvent(eventName, bubbles, cancelable);
    node.dispatchEvent(event);
  }
}

function parseDuration$1(node) {
  var str = style(node, 'transitionDuration') || '';
  var mult = str.indexOf('ms') === -1 ? 1000 : 1;
  return parseFloat(str) * mult;
}

function emulateTransitionEnd(element, duration, padding) {
  if (padding === void 0) {
    padding = 5;
  }

  var called = false;
  var handle = setTimeout(function () {
    if (!called) triggerEvent(element, 'transitionend', true);
  }, duration + padding);
  var remove = listen(element, 'transitionend', function () {
    called = true;
  }, {
    once: true
  });
  return function () {
    clearTimeout(handle);
    remove();
  };
}

function transitionEnd(element, handler, duration, padding) {
  if (duration == null) duration = parseDuration$1(element) || 0;
  var removeEmulate = emulateTransitionEnd(element, duration, padding);
  var remove = listen(element, 'transitionend', handler);
  return function () {
    removeEmulate();
    remove();
  };
}

// source https://github.com/react-bootstrap/react-bootstrap/blob/f11723114d532cfce840417834a73733a8436414/src/transitionEndListener.ts
function parseDuration(node, property) {
    const str = style(node, property) || "";
    const mult = str.indexOf("ms") === -1 ? 1000 : 1;
    return parseFloat(str) * mult;
}
function transitionEndListener(element, handler) {
    const duration = parseDuration(element, "transitionDuration");
    const delay = parseDuration(element, "transitionDelay");
    const remove = transitionEnd(element, (e) => {
        if (e.target === element) {
            remove();
            handler(e);
        }
    }, duration + delay);
}

const defaultProps$A = {};
const TransitionWrapper = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$A, p), ["onEnter", "onEntering", "onEntered", "onExit", "onExiting", "onExited", "addEndListener", "children", "childRef"]);
  let [nodeRef, setNodeRef] = createSignal();
  const mergedRef = (ref) => {
    setNodeRef(ref);
    local.childRef?.(ref);
  };
  function normalize(callback) {
    return (param) => {
      if (callback && nodeRef()) {
        callback(nodeRef(), param);
      }
    };
  }
  const handlers = {
    get onEnter() {
      return normalize(local.onEnter);
    },
    get onEntering() {
      return normalize(local.onEntering);
    },
    get onEntered() {
      return normalize(local.onEntered);
    },
    get onExit() {
      return normalize(local.onExit);
    },
    get onExiting() {
      return normalize(local.onExiting);
    },
    get onExited() {
      return normalize(local.onExited);
    },
    get addEndListener() {
      return normalize(local.addEndListener);
    }
  };
  const resolvedChildren = children(() => local.children);
  function renderChild() {
    const child = resolvedChildren();
    if (typeof child === "function") {
      return (status, innerProps) => child(status, {
        ...innerProps,
        ref: mergedRef
      });
    } else {
      mergedRef(child);
      return child;
    }
  }
  return createComponent(Transition, mergeProps(props, handlers, {
    get nodeRef() {
      return nodeRef();
    },
    get children() {
      return renderChild();
    }
  }));
};
const TransitionWrapper$1 = TransitionWrapper;

const MARGINS = {
  height: ["marginTop", "marginBottom"],
  width: ["marginLeft", "marginRight"]
};
function getDefaultDimensionValue(dimension, elem) {
  const offset = `offset${dimension[0].toUpperCase()}${dimension.slice(1)}`;
  const value = elem[offset];
  const margins = MARGINS[dimension];
  return value + parseInt(style(elem, margins[0]), 10) + parseInt(style(elem, margins[1]), 10);
}
const collapseStyles = {
  [EXITED]: "collapse",
  [EXITING]: "collapsing",
  [ENTERING]: "collapsing",
  [ENTERED]: "collapse show",
  [UNMOUNTED]: ""
};
const defaultProps$z = {
  in: false,
  dimension: "height",
  timeout: 300,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
  getDimensionValue: getDefaultDimensionValue
};
const Collapse = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$z, p), ["onEnter", "onEntering", "onEntered", "onExit", "onExiting", "class", "children", "dimension", "getDimensionValue"]);
  const computedDimension = () => typeof local.dimension === "function" ? local.dimension() : local.dimension;
  const handleEnter = (elem) => {
    elem.style[computedDimension()] = "0";
    local.onEnter?.(elem);
  };
  const handleEntering = (elem) => {
    const scroll = `scroll${computedDimension()[0].toUpperCase()}${computedDimension().slice(1)}`;
    elem.style[computedDimension()] = `${elem[scroll]}px`;
    local.onEntering?.(elem);
  };
  const handleEntered = (elem) => {
    elem.style[computedDimension()] = null;
    local.onEntered?.(elem);
  };
  const handleExit = (elem) => {
    elem.style[computedDimension()] = `${local.getDimensionValue(computedDimension(), elem)}px`;
    triggerBrowserReflow(elem);
    local.onExit?.(elem);
  };
  const handleExiting = (elem) => {
    elem.style[computedDimension()] = null;
    local.onExiting?.(elem);
  };
  const resolvedChildren = children(() => local.children);
  let prevClasses;
  return createComponent(TransitionWrapper$1, mergeProps({
    addEndListener: transitionEndListener
  }, props, {
    get ["aria-expanded"]() {
      return props.role ? props.in : null;
    },
    onEnter: handleEnter,
    onEntering: handleEntering,
    onEntered: handleEntered,
    onExit: handleExit,
    onExiting: handleExiting,
    children: (state, innerProps) => {
      const el = resolvedChildren();
      innerProps.ref(el);
      const newClasses = classNames(local.class, collapseStyles[state], computedDimension() === "width" && "collapse-horizontal");
      resolveClasses(el, prevClasses, newClasses);
      prevClasses = newClasses;
      return el;
    }
  }));
};
const Collapse$1 = Collapse;

// ported from https://github.com/react-bootstrap/react-bootstrap/blob/f11723114d532cfce840417834a73733a8436414/src/AccordionContext.ts
function isAccordionItemSelected(activeEventKey, eventKey) {
    return Array.isArray(activeEventKey)
        ? activeEventKey.includes(eventKey)
        : activeEventKey === eventKey;
}
const context$3 = createContext({});
const AccordionContext = context$3;

const defaultProps$y = {
  as: "div"
};
const AccordionCollapse = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$y, p), ["as", "bsPrefix", "class", "children", "eventKey"]);
  const context = useContext(AccordionContext);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "accordion-collapse");
  return createComponent(Collapse$1, mergeProps({
    get ["in"]() {
      return isAccordionItemSelected(context.activeEventKey, local.eventKey);
    }
  }, props, {
    get children() {
      return createComponent(Dynamic, {
        get component() {
          return local.as;
        },
        get ["class"]() {
          return classNames(local.class, bsPrefix);
        },
        get children() {
          return local.children;
        }
      });
    }
  }));
};
const AccordionCollapse$1 = AccordionCollapse;

// ported from https://github.com/react-bootstrap/react-bootstrap/blob/f11723114d532cfce840417834a73733a8436414/src/AccordionContext.ts
const context$2 = createContext({
    eventKey: "",
});
const AccordionItemContext = context$2;

const defaultProps$x = {
  as: "div"
};
const AccordionBody = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$x, p), ["as", "bsPrefix", "class"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "accordion-body");
  const context = useContext(AccordionItemContext);
  return createComponent(AccordionCollapse$1, {
    get eventKey() {
      return context.eventKey;
    },
    get children() {
      return createComponent(Dynamic, mergeProps({
        get component() {
          return local.as;
        }
      }, props, {
        get ["class"]() {
          return classNames(local.class, bsPrefix);
        }
      }));
    }
  });
};
const AccordionBody$1 = AccordionBody;

function useAccordionButton(eventKey, onClick) {
  const context = useContext(AccordionContext);
  return (e) => {
    let eventKeyPassed = eventKey === context.activeEventKey ? null : eventKey;
    if (context.alwaysOpen) {
      if (Array.isArray(context.activeEventKey)) {
        if (context.activeEventKey.includes(eventKey)) {
          eventKeyPassed = context.activeEventKey.filter((k) => k !== eventKey);
        } else {
          eventKeyPassed = [...context.activeEventKey, eventKey];
        }
      } else {
        eventKeyPassed = [eventKey];
      }
    }
    context.onSelect?.(eventKeyPassed, e);
    callEventHandler(onClick, e);
  };
}
const defaultProps$w = {
  as: "button"
};
const AccordionButton = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$w, p), ["as", "bsPrefix", "class", "onClick"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "accordion-button");
  const itemContext = useContext(AccordionItemContext);
  const accordionOnClick = useAccordionButton(itemContext.eventKey, local.onClick);
  const accordionContext = useContext(AccordionContext);
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    },
    onClick: accordionOnClick
  }, props, {
    get type() {
      return local.as === "button" ? "button" : void 0;
    },
    get ["aria-expanded"]() {
      return itemContext.eventKey === accordionContext.activeEventKey;
    },
    get ["class"]() {
      return classNames(local.class, bsPrefix, !isAccordionItemSelected(accordionContext.activeEventKey, itemContext.eventKey) && "collapsed");
    }
  }));
};
const AccordionButton$1 = AccordionButton;

const defaultProps$v = {
  as: "h2"
};
const AccordionHeader = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$v, p), ["as", "bsPrefix", "class", "children", "onClick"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "accordion-header");
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    }
  }, props, {
    get ["class"]() {
      return classNames(local.class, bsPrefix);
    },
    get children() {
      return createComponent(AccordionButton$1, {
        get onClick() {
          return local.onClick;
        },
        get children() {
          return local.children;
        }
      });
    }
  }));
};
const AccordionHeader$1 = AccordionHeader;

const defaultProps$u = {
  as: "div"
};
const AccordionItem = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$u, p), ["as", "bsPrefix", "class", "eventKey"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "accordion-item");
  const contextValue = {
    get eventKey() {
      return local.eventKey;
    }
  };
  return createComponent(AccordionItemContext.Provider, {
    value: contextValue,
    get children() {
      return createComponent(Dynamic, mergeProps({
        get component() {
          return local.as;
        }
      }, props, {
        get ["class"]() {
          return classNames(local.class, bsPrefix);
        }
      }));
    }
  });
};
const AccordionItem$1 = AccordionItem;

const defaultProps$t = {
  as: "div"
};
const Accordion = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$t, p), ["as", "activeKey", "alwaysOpen", "bsPrefix", "class", "defaultActiveKey", "onSelect", "flush"]);
  const [activeKey, onSelect] = createControlledProp(() => local.activeKey, () => local.defaultActiveKey, local.onSelect);
  const prefix = useBootstrapPrefix(local.bsPrefix, "accordion");
  const contextValue = {
    get activeEventKey() {
      return activeKey();
    },
    get alwaysOpen() {
      return local.alwaysOpen;
    },
    get onSelect() {
      return onSelect;
    }
  };
  return createComponent(AccordionContext.Provider, {
    value: contextValue,
    get children() {
      return createComponent(Dynamic, mergeProps({
        get component() {
          return local.as;
        }
      }, props, {
        get ["class"]() {
          return classNames(local.class, prefix, local.flush && `${prefix}-flush`);
        }
      }));
    }
  });
};
const Accordion$1 = Object.assign(Accordion, {
  Button: AccordionButton$1,
  Collapse: AccordionCollapse$1,
  Item: AccordionItem$1,
  Header: AccordionHeader$1,
  Body: AccordionBody$1
});

const defaultProps$s = {
  in: false,
  timeout: 300,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false
};
const fadeStyles = {
  [ENTERING]: "show",
  [ENTERED]: "show"
};
const Fade = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$s, p), ["class", "children", "transitionClasses"]);
  const handleEnter = (node, isAppearing) => {
    triggerBrowserReflow(node);
    props.onEnter?.(node, isAppearing);
  };
  let resolvedChildren;
  let prevClasses;
  return createComponent(TransitionWrapper$1, mergeProps({
    addEndListener: transitionEndListener,
    onEnter: handleEnter
  }, props, {
    children: (status, innerProps) => {
      if (!resolvedChildren)
        resolvedChildren = children(() => local.children);
      let el = resolvedChildren();
      while (typeof el === "function")
        el = el();
      innerProps.ref(el);
      const newClasses = classNames(
        "fade",
        local.class,
        fadeStyles?.[status],
        local.transitionClasses?.[status]
      );
      resolveClasses(el, prevClasses, newClasses);
      prevClasses = newClasses;
      return el;
    }
  }));
};
const Fade$1 = Fade;

var _tmpl$$d = /* @__PURE__ */ template(`<button type=button>`);
const defaultProps$r = {
  "aria-label": "Close"
};
const CloseButton = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$r, p), ["class", "variant"]);
  return (() => {
    var _el$ = _tmpl$$d();
    spread(_el$, mergeProps({
      get ["class"]() {
        return classNames("btn-close", local.variant && `btn-close-${local.variant}`, local.class);
      }
    }, props), false, false);
    return _el$;
  })();
};
const CloseButton$1 = CloseButton;

var _tmpl$$c = /* @__PURE__ */ template(`<div>`);
const divWithClass = (c) => (p) => {
  return (() => {
    var _el$ = _tmpl$$c();
    spread(_el$, mergeProps(p, {
      get ["class"]() {
        return classNames(p.class, c);
      }
    }), false, false);
    return _el$;
  })();
};

function createWithBsPrefix(prefix, {
  Component,
  defaultProps = {}
} = {}) {
  const BsComponent = (p) => {
    const [local, props] = splitProps(mergeProps({
      as: Component
    }, defaultProps, p), ["class", "bsPrefix", "as"]);
    const resolvedPrefix = useBootstrapPrefix(local.bsPrefix, prefix);
    return createComponent(Dynamic, mergeProps({
      get component() {
        return local.as || "div";
      },
      get ["class"]() {
        return classNames(local.class, resolvedPrefix);
      }
    }, props));
  };
  return BsComponent;
}

/**
 * Checks if a given element has a CSS class.
 * 
 * @param element the element
 * @param className the CSS class name
 */
function hasClass(element, className) {
  if (element.classList) return !!className && element.classList.contains(className);
  return (" " + (element.className.baseVal || element.className) + " ").indexOf(" " + className + " ") !== -1;
}

/**
 * Adds a CSS class to a given element.
 * 
 * @param element the element
 * @param className the CSS class name
 */

function addClass(element, className) {
  if (element.classList) element.classList.add(className);else if (!hasClass(element, className)) if (typeof element.className === 'string') element.className = element.className + " " + className;else element.setAttribute('class', (element.className && element.className.baseVal || '') + " " + className);
}

function replaceClassName(origClass, classToRemove) {
  return origClass.replace(new RegExp("(^|\\s)" + classToRemove + "(?:\\s|$)", 'g'), '$1').replace(/\s+/g, ' ').replace(/^\s*|\s*$/g, '');
}
/**
 * Removes a CSS class from a given element.
 * 
 * @param element the element
 * @param className the CSS class name
 */


function removeClass(element, className) {
  if (element.classList) {
    element.classList.remove(className);
  } else if (typeof element.className === 'string') {
    element.className = replaceClassName(element.className, className);
  } else {
    element.setAttribute('class', replaceClassName(element.className && element.className.baseVal || '', className));
  }
}

const Selector = {
  FIXED_CONTENT: ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top",
  STICKY_CONTENT: ".sticky-top",
  NAVBAR_TOGGLER: ".navbar-toggler"
};
class BootstrapModalManager extends ModalManager$1 {
  adjustAndStore(prop, element, adjust) {
    const actual = element.style[prop];
    element.dataset[prop] = actual;
    style(element, {
      [prop]: `${parseFloat(style(element, prop)) + adjust}px`
    });
  }
  restore(prop, element) {
    const value = element.dataset[prop];
    if (value !== void 0) {
      delete element.dataset[prop];
      style(element, {
        [prop]: value
      });
    }
  }
  setContainerStyle(containerState) {
    super.setContainerStyle(containerState);
    const container = this.getElement();
    addClass(container, "modal-open");
    if (!containerState.scrollBarWidth)
      return;
    const paddingProp = this.isRTL ? "paddingLeft" : "paddingRight";
    const marginProp = this.isRTL ? "marginLeft" : "marginRight";
    qsa(container, Selector.FIXED_CONTENT).forEach((el) => this.adjustAndStore(paddingProp, el, containerState.scrollBarWidth));
    qsa(container, Selector.STICKY_CONTENT).forEach((el) => this.adjustAndStore(marginProp, el, -containerState.scrollBarWidth));
    qsa(container, Selector.NAVBAR_TOGGLER).forEach((el) => this.adjustAndStore(marginProp, el, containerState.scrollBarWidth));
  }
  removeContainerStyle(containerState) {
    super.removeContainerStyle(containerState);
    const container = this.getElement();
    removeClass(container, "modal-open");
    const paddingProp = this.isRTL ? "paddingLeft" : "paddingRight";
    const marginProp = this.isRTL ? "marginLeft" : "marginRight";
    qsa(container, Selector.FIXED_CONTENT).forEach((el) => this.restore(paddingProp, el));
    qsa(container, Selector.STICKY_CONTENT).forEach((el) => this.restore(marginProp, el));
    qsa(container, Selector.NAVBAR_TOGGLER).forEach((el) => this.restore(marginProp, el));
  }
}
let sharedManager;
function getSharedManager(options) {
  if (!sharedManager)
    sharedManager = new BootstrapModalManager(options);
  return sharedManager;
}

const defaultProps$q = {
  variant: "primary",
  active: false,
  disabled: false
};
const Button = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$q, p), ["as", "bsPrefix", "children", "variant", "size", "active", "class"]);
  const prefix = useBootstrapPrefix(local.bsPrefix, "btn");
  const [buttonProps, {
    tagName
  }] = useButtonProps({
    tagName: local.as,
    ...props
  });
  return createComponent(Dynamic, mergeProps({
    component: tagName
  }, buttonProps, props, {
    get ["class"]() {
      return classNames(local.class, prefix, local.active && "active", local.variant && `${prefix}-${local.variant}`, local.size && `${prefix}-${local.size}`, props.href && props.disabled && "disabled");
    },
    get children() {
      return local.children;
    }
  }));
};
const Button$1 = Button;

const defaultProps$p = {
  as: "img"
};
const CardImg = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$p, p), ["as", "bsPrefix", "class", "variant"]);
  const prefix = useBootstrapPrefix(local.bsPrefix, "card-img");
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    },
    get ["class"]() {
      return classNames(local.variant ? `${prefix}-${local.variant}` : prefix, local.class);
    }
  }, props));
};
const CardImg$1 = CardImg;

const context$1 = createContext(null);
const CardHeaderContext = context$1;

const defaultProps$o = {
  as: "div"
};
const CardHeader = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$o, p), ["as", "bsPrefix", "class"]);
  const prefix = useBootstrapPrefix(local.bsPrefix, "card-header");
  const contextValue = {
    get cardHeaderBsPrefix() {
      return prefix;
    }
  };
  return createComponent(CardHeaderContext.Provider, {
    value: contextValue,
    get children() {
      return createComponent(Dynamic, mergeProps({
        get component() {
          return local.as;
        }
      }, props, {
        get ["class"]() {
          return classNames(local.class, prefix);
        }
      }));
    }
  });
};
const CardHeader$1 = CardHeader;

const DivStyledAsH5$1 = divWithClass("h5");
const DivStyledAsH6 = divWithClass("h6");
const CardBody = createWithBsPrefix("card-body");
const CardTitle = createWithBsPrefix("card-title", {
  Component: DivStyledAsH5$1
});
const CardSubtitle = createWithBsPrefix("card-subtitle", {
  Component: DivStyledAsH6
});
const CardLink = createWithBsPrefix("card-link", {
  Component: "a"
});
const CardText = createWithBsPrefix("card-text", {
  Component: "p"
});
const CardFooter = createWithBsPrefix("card-footer");
const CardImgOverlay = createWithBsPrefix("card-img-overlay");
const defaultProps$n = {
  as: "div",
  body: false
};
const Card = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$n, p), ["as", "bsPrefix", "class", "bg", "text", "border", "body", "children"]);
  const prefix = useBootstrapPrefix(local.bsPrefix, "card");
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    }
  }, props, {
    get ["class"]() {
      return classNames(local.class, prefix, local.bg && `bg-${local.bg}`, local.text && `text-${local.text}`, local.border && `border-${local.border}`);
    },
    get children() {
      return createMemo(() => !!local.body)() ? createComponent(CardBody, {
        get children() {
          return local.children;
        }
      }) : local.children;
    }
  }));
};
const Card$1 = Object.assign(Card, {
  Img: CardImg$1,
  Title: CardTitle,
  Subtitle: CardSubtitle,
  Body: CardBody,
  Link: CardLink,
  Text: CardText,
  Header: CardHeader$1,
  Footer: CardFooter,
  ImgOverlay: CardImgOverlay
});

const DEVICE_SIZES = ["xxl", "xl", "lg", "md", "sm", "xs"];
function useCol(o) {
  const [local, props] = splitProps(o, ["as", "bsPrefix", "class"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "col");
  const breakpoints = useBootstrapBreakpoints();
  const spans = [];
  const classes = [];
  breakpoints().forEach((brkPoint) => {
    const propValue = props[brkPoint];
    let span;
    let offset;
    let order;
    if (typeof propValue === "object" && propValue != null) {
      ({
        span,
        offset,
        order
      } = propValue);
    } else {
      span = propValue;
    }
    const infix = brkPoint !== "xs" ? `-${brkPoint}` : "";
    if (span)
      spans.push(span === true ? `${bsPrefix}${infix}` : `${bsPrefix}${infix}-${span}`);
    if (order != null)
      classes.push(`order${infix}-${order}`);
    if (offset != null)
      classes.push(`offset${infix}-${offset}`);
  });
  const [_, cleanedProps] = splitProps(props, DEVICE_SIZES);
  return [mergeProps(cleanedProps, {
    get class() {
      return classNames(local.class, ...spans, ...classes);
    }
  }), {
    get as() {
      return local.as;
    },
    get bsPrefix() {
      return bsPrefix;
    },
    get spans() {
      return spans;
    }
  }];
}
const Col = (p) => {
  const [useProps, meta] = useCol(p);
  const [local, colProps] = splitProps(useProps, ["class"]);
  return createComponent(Dynamic, mergeProps({
    get component() {
      return meta.as ?? "div";
    }
  }, colProps, {
    get ["class"]() {
      return classNames(local.class, !meta.spans.length && meta.bsPrefix);
    }
  }));
};
const Col$1 = Col;

const defaultProps$m = {
  as: "div",
  fluid: false
};
const Container = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$m, p), ["as", "bsPrefix", "fluid", "class"]);
  const prefix = useBootstrapPrefix(local.bsPrefix, "container");
  const suffix = typeof local.fluid === "string" ? `-${local.fluid}` : "-fluid";
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    }
  }, props, {
    get ["class"]() {
      return classNames(local.class, local.fluid ? `${prefix}${suffix}` : prefix);
    }
  }));
};
const Container$1 = Container;

const context = createContext(null);
const NavbarContext = context;

const defaultProps$l = {
  as: "div",
  type: "valid",
  tooltip: false
};
const Feedback = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$l, p), ["as", "class", "type", "tooltip"]);
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    }
  }, props, {
    get ["class"]() {
      return classNames(local.class, `${local.type}-${local.tooltip ? "tooltip" : "feedback"}`);
    }
  }));
};
const Feedback$1 = Feedback;

const FormContext = createContext({});
const FormContext$1 = FormContext;

const defaultProps$k = {
  as: "div"
};
const FormGroup = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$k, p), ["as", "controlId"]);
  const context = {
    get controlId() {
      return local.controlId;
    }
  };
  return createComponent(FormContext$1.Provider, {
    value: context,
    get children() {
      return createComponent(Dynamic, mergeProps({
        get component() {
          return local.as;
        }
      }, props));
    }
  });
};
const FormGroup$1 = FormGroup;

var _tmpl$$b = /* @__PURE__ */ template(`<label>`);
const defaultProps$j = {};
const FloatingLabel = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$j, p), ["bsPrefix", "class", "children", "controlId", "label"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-floating");
  return createComponent(FormGroup$1, mergeProps({
    get ["class"]() {
      return classNames(local.class, bsPrefix);
    },
    get controlId() {
      return local.controlId;
    }
  }, props, {
    get children() {
      return [createMemo(() => local.children), (() => {
        var _el$ = _tmpl$$b();
        insert(_el$, () => local.label);
        createRenderEffect(() => setAttribute(_el$, "for", local.controlId));
        return _el$;
      })()];
    }
  }));
};
const FloatingLabel$1 = FloatingLabel;

const defaultProps$i = {
  as: "input",
  type: "checkbox",
  isValid: false,
  isInvalid: false
};
const FormCheckInput = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$i, p), ["as", "id", "bsPrefix", "class", "type", "isValid", "isInvalid"]);
  const formContext = useContext(FormContext$1);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-check-input");
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    }
  }, props, {
    get type() {
      return local.type;
    },
    get id() {
      return local.id || formContext.controlId;
    },
    get ["class"]() {
      return classNames(local.class, bsPrefix, local.isValid && "is-valid", local.isInvalid && "is-invalid");
    }
  }));
};
const FormCheckInput$1 = FormCheckInput;

const FormCheckContext = createContext();
const FormCheckContext$1 = FormCheckContext;

var _tmpl$$a = /* @__PURE__ */ template(`<label>`);
const defaultProps$h = {};
const FormCheckLabel = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$h, p), ["bsPrefix", "class", "for"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-check-label");
  const formContext = useContext(FormContext$1);
  const formCheckContext = useContext(FormCheckContext$1);
  formCheckContext?.setHasFormCheckLabel?.(true);
  return (() => {
    var _el$ = _tmpl$$a();
    spread(_el$, mergeProps(props, {
      get ["for"]() {
        return local.for || formContext.controlId;
      },
      get ["class"]() {
        return classNames(local.class, bsPrefix);
      }
    }), false, false);
    return _el$;
  })();
};
const FormCheckLabel$1 = FormCheckLabel;

var _tmpl$$9 = /* @__PURE__ */ template(`<div>`);
const defaultProps$g = {
  as: "input",
  title: "",
  type: "checkbox",
  inline: false,
  disabled: false,
  isValid: false,
  isInvalid: false,
  feedbackTooltip: false
};
const FormCheck = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$g, p), ["as", "id", "bsPrefix", "bsSwitchPrefix", "inline", "disabled", "isValid", "isInvalid", "feedbackTooltip", "feedback", "feedbackType", "class", "style", "title", "type", "label", "children"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-check");
  const bsSwitchPrefix = useBootstrapPrefix(local.bsSwitchPrefix, "form-switch");
  const [hasFormCheckLabel, setHasFormCheckLabel] = createSignal(false);
  const formContext = useContext(FormContext$1);
  const innerFormContext = {
    get controlId() {
      return local.id || formContext.controlId;
    }
  };
  const resolvedChildren = children(() => local.children);
  const hasLabel = createMemo(() => local.label != null && local.label !== false && !resolvedChildren() || hasFormCheckLabel());
  return createComponent(FormContext$1.Provider, {
    value: innerFormContext,
    get children() {
      return createComponent(FormCheckContext$1.Provider, {
        value: {
          setHasFormCheckLabel
        },
        get children() {
          var _el$ = _tmpl$$9();
          insert(_el$, () => resolvedChildren() || [createComponent(FormCheckInput$1, mergeProps(props, {
            get type() {
              return local.type === "switch" ? "checkbox" : local.type;
            },
            get isValid() {
              return local.isValid;
            },
            get isInvalid() {
              return local.isInvalid;
            },
            get disabled() {
              return local.disabled;
            },
            get as() {
              return local.as;
            }
          })), createMemo((() => {
            var _c$ = createMemo(() => !!hasLabel());
            return () => _c$() && createComponent(FormCheckLabel$1, {
              get title() {
                return local.title;
              },
              get children() {
                return local.label;
              }
            });
          })()), createMemo((() => {
            var _c$2 = createMemo(() => !!local.feedback);
            return () => _c$2() && createComponent(Feedback$1, {
              get type() {
                return local.feedbackType;
              },
              get tooltip() {
                return local.feedbackTooltip;
              },
              get children() {
                return local.feedback;
              }
            });
          })())]);
          createRenderEffect((_p$) => {
            var _v$ = local.style, _v$2 = classNames(local.class, hasLabel() && bsPrefix, local.inline && `${bsPrefix}-inline`, local.type === "switch" && bsSwitchPrefix);
            _p$.e = style$1(_el$, _v$, _p$.e);
            _v$2 !== _p$.t && className(_el$, _p$.t = _v$2);
            return _p$;
          }, {
            e: void 0,
            t: void 0
          });
          return _el$;
        }
      });
    }
  });
};
const FormCheck$1 = Object.assign(FormCheck, {
  Input: FormCheckInput$1,
  Label: FormCheckLabel$1
});

const defaultProps$f = {
  as: "input",
  isValid: false,
  isInvalid: false
};
const FormControl = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$f, p), ["as", "bsPrefix", "type", "size", "htmlSize", "id", "class", "isValid", "isInvalid", "plaintext", "readOnly"]);
  const formContext = useContext(FormContext$1);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-control");
  const classes = () => {
    let classes2;
    if (local.plaintext) {
      classes2 = {
        [`${bsPrefix}-plaintext`]: true
      };
    } else {
      classes2 = {
        [bsPrefix]: true,
        [`${bsPrefix}-${local.size}`]: local.size
      };
    }
    return classes2;
  };
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    }
  }, props, {
    get type() {
      return local.type;
    },
    get size() {
      return local.htmlSize;
    },
    get readOnly() {
      return local.readOnly;
    },
    get id() {
      return local.id || formContext.controlId;
    },
    get ["class"]() {
      return classNames(classes(), local.isValid && `is-valid`, local.isInvalid && `is-invalid`, local.type === "color" && `${bsPrefix}-color`);
    }
  }));
};
const FormControl$1 = Object.assign(FormControl, {
  Feedback: Feedback$1
});

const FormFloating = createWithBsPrefix("form-floating");

const defaultProps$e = {
  as: "label",
  column: false,
  visuallyHidden: false
};
const FormLabel = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$e, p), ["as", "bsPrefix", "column", "visuallyHidden", "class", "htmlFor"]);
  const formContext = useContext(FormContext$1);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-label");
  let columnClass = "col-form-label";
  if (typeof local.column === "string")
    columnClass = `${columnClass} ${columnClass}-${local.column}`;
  const classes = () => classNames(local.class, bsPrefix, local.visuallyHidden && "visually-hidden", local.column && columnClass);
  return !!local.column ? createComponent(Col$1, mergeProps({
    as: "label",
    get ["class"]() {
      return classes();
    },
    get htmlFor() {
      return local.htmlFor || formContext.controlId;
    }
  }, props)) : createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    },
    get ["class"]() {
      return classes();
    },
    get htmlFor() {
      return local.htmlFor || formContext.controlId;
    }
  }, props));
};
const FormLabel$1 = FormLabel;

var _tmpl$$8 = /* @__PURE__ */ template(`<input>`);
const defaultProps$d = {
  as: "img"
};
const FormRange = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$d, p), ["bsPrefix", "class", "id"]);
  const formContext = useContext(FormContext$1);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-range");
  return (() => {
    var _el$ = _tmpl$$8();
    spread(_el$, mergeProps(props, {
      "type": "range",
      get ["class"]() {
        return classNames(local.class, bsPrefix);
      },
      get id() {
        return local.id || formContext.controlId;
      }
    }), false, false);
    return _el$;
  })();
};
const FormRange$1 = FormRange;

var _tmpl$$7 = /* @__PURE__ */ template(`<select>`);
const defaultProps$c = {
  isValid: false,
  isInvalid: false
};
const FormSelect = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$c, p), ["bsPrefix", "size", "htmlSize", "class", "isValid", "isInvalid", "id"]);
  const formContext = useContext(FormContext$1);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-select");
  return (() => {
    var _el$ = _tmpl$$7();
    spread(_el$, mergeProps(props, {
      get size() {
        return local.htmlSize;
      },
      get ["class"]() {
        return classNames(local.class, bsPrefix, local.size && `${bsPrefix}-${local.size}`, local.isValid && `is-valid`, local.isInvalid && `is-invalid`);
      },
      get id() {
        return local.id || formContext.controlId;
      }
    }), false, false);
    return _el$;
  })();
};
const FormSelect$1 = FormSelect;

const defaultProps$b = {
  as: "small"
};
const FormText = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$b, p), ["as", "bsPrefix", "class", "muted"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "form-text");
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    }
  }, props, {
    get ["class"]() {
      return classNames(local.class, bsPrefix, local.muted && "text-muted");
    }
  }));
};
const FormText$1 = FormText;

const Switch = (props) => createComponent(FormCheck$1, mergeProps(props, {
  type: "switch"
}));
const Switch$1 = Object.assign(Switch, {
  Input: FormCheck$1.Input,
  Label: FormCheck$1.Label
});

const defaultProps$a = {
  as: "form"
};
const Form = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$a, p), ["as", "class", "validated"]);
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    }
  }, props, {
    get ["class"]() {
      return classNames(local.class, local.validated && "was-validated");
    }
  }));
};
const Form$1 = Object.assign(Form, {
  Group: FormGroup$1,
  Control: FormControl$1,
  Floating: FormFloating,
  Check: FormCheck$1,
  Switch: Switch$1,
  Label: FormLabel$1,
  Text: FormText$1,
  Range: FormRange$1,
  Select: FormSelect$1,
  FloatingLabel: FloatingLabel$1
});

const ModalContext = createContext({
  onHide() {
  }
});
const ModalContext$1 = ModalContext;

var _tmpl$$6 = /* @__PURE__ */ template(`<div>`);
const defaultProps$9 = {
  closeLabel: "Close",
  closeButton: false
};
const AbstractModalHeader = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$9, p), ["closeLabel", "closeVariant", "closeButton", "onHide", "children"]);
  const context = useContext(ModalContext$1);
  const handleClick = () => {
    context?.onHide();
    local.onHide?.();
  };
  return (() => {
    var _el$ = _tmpl$$6();
    spread(_el$, props, false, true);
    insert(_el$, () => local.children, null);
    insert(_el$, (() => {
      var _c$ = createMemo(() => !!local.closeButton);
      return () => _c$() && createComponent(CloseButton$1, {
        get ["aria-label"]() {
          return local.closeLabel;
        },
        get variant() {
          return local.closeVariant;
        },
        onClick: handleClick
      });
    })(), null);
    return _el$;
  })();
};
const AbstractModalHeader$1 = AbstractModalHeader;

const defaultProps$8 = {};
const NavbarBrand = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$8, p), ["as", "bsPrefix", "class"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "navbar-brand");
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as || (props.href ? "a" : "span");
    }
  }, props, {
    get ["class"]() {
      return classNames(local.class, bsPrefix);
    }
  }));
};
const NavbarBrand$1 = NavbarBrand;

var _tmpl$$5 = /* @__PURE__ */ template(`<div>`);
const defaultProps$7 = {};
const NavbarCollapse = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$7, p), ["bsPrefix", "class", "children", "ref"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "navbar-collapse");
  const context = useContext(NavbarContext);
  return createComponent(Collapse$1, mergeProps({
    get ["in"]() {
      return !!context?.expanded;
    }
  }, props, {
    get children() {
      var _el$ = _tmpl$$5();
      var _ref$ = local.ref;
      typeof _ref$ === "function" ? use(_ref$, _el$) : local.ref = _el$;
      insert(_el$, () => local.children);
      createRenderEffect(() => className(_el$, classNames(bsPrefix, local.class)));
      return _el$;
    }
  }));
};
const NavbarCollapse$1 = NavbarCollapse;

var _tmpl$$4 = /* @__PURE__ */ template(`<span>`);
const defaultProps$6 = {
  as: "button",
  label: "Toggle navigation"
};
const NavbarToggle = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$6, p), ["as", "bsPrefix", "class", "children", "label", "onClick"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "navbar-toggler");
  const context = useContext(NavbarContext);
  const handleClick = (e) => {
    callEventHandler(local.onClick, e);
    context?.onToggle?.();
  };
  if (local.as === "button") {
    props.type = "button";
  }
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    }
  }, props, {
    get type() {
      return local.as === "button" ? "button" : void 0;
    },
    onClick: handleClick,
    get ["aria-label"]() {
      return local.label;
    },
    get ["class"]() {
      return classNames(local.class, bsPrefix, !context?.expanded && "collapsed");
    },
    get children() {
      return local.children || (() => {
        var _el$ = _tmpl$$4();
        className(_el$, `${bsPrefix}-icon`);
        return _el$;
      })();
    }
  }));
};
const NavbarToggle$1 = NavbarToggle;

const OffcanvasBody = createWithBsPrefix("offcanvas-body");

const defaultProps$5 = {
  in: false,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false
};
const transitionStyles = {
  [ENTERING]: "show",
  [ENTERED]: "show"
};
const OffcanvasToggling = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$5, p), ["bsPrefix", "class", "children"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "offcanvas");
  const resolvedChildren = children(() => local.children);
  let prevClasses;
  return createComponent(TransitionWrapper$1, mergeProps({
    addEndListener: transitionEndListener
  }, props, {
    children: (status, innerProps) => {
      const el = resolvedChildren();
      innerProps.ref(el);
      const newClasses = classNames(
        local.class,
        (status === ENTERING || status === EXITING) && `${bsPrefix}-toggling`,
        transitionStyles[status]
      );
      resolveClasses(el, prevClasses, newClasses);
      prevClasses = newClasses;
      return el;
    }
  }));
};
const OffcanvasToggling$1 = OffcanvasToggling;

const defaultProps$4 = {
  closeLabel: "Close",
  closeButton: false
};
const OffcanvasHeader = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$4, p), ["bsPrefix", "class"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "offcanvas-header");
  return createComponent(AbstractModalHeader$1, mergeProps(props, {
    get ["class"]() {
      return classNames(local.class, bsPrefix);
    }
  }));
};
const OffcanvasHeader$1 = OffcanvasHeader;

const DivStyledAsH5 = divWithClass("h5");
const OffcanvasTitle = createWithBsPrefix("offcanvas-title", {
  Component: DivStyledAsH5
});

var _tmpl$$3 = /* @__PURE__ */ template(`<div>`), _tmpl$2$2 = /* @__PURE__ */ template(`<div role=dialog>`);
const defaultProps$3 = {
  show: false,
  backdrop: true,
  keyboard: true,
  scroll: false,
  autoFocus: true,
  enforceFocus: true,
  restoreFocus: true,
  placement: "start"
};
function DialogTransition(props) {
  return createComponent(OffcanvasToggling$1, props);
}
function BackdropTransition(props) {
  return createComponent(Fade$1, props);
}
const Offcanvas = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$3, p), [
    "bsPrefix",
    "class",
    "children",
    "aria-labelledby",
    "placement",
    "show",
    "backdrop",
    "keyboard",
    "scroll",
    "onEscapeKeyDown",
    "onShow",
    "onHide",
    "container",
    "autoFocus",
    "enforceFocus",
    "restoreFocus",
    "restoreFocusOptions",
    "onEntered",
    "onExit",
    "onExiting",
    "onEnter",
    "onEntering",
    "onExited",
    "backdropClass",
    "manager",
    "ref"
  ]);
  let modalManager;
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "offcanvas");
  const navbarContext = useContext(NavbarContext);
  const handleHide = () => {
    navbarContext?.onToggle?.();
    local.onHide?.();
  };
  const modalContext = {
    get onHide() {
      return handleHide;
    }
  };
  function getModalManager() {
    if (local.manager)
      return local.manager;
    if (local.scroll) {
      if (!modalManager)
        modalManager = new BootstrapModalManager({
          handleContainerOverflow: false
        });
      return modalManager;
    }
    return getSharedManager();
  }
  const handleEnter = (node, ...args) => {
    if (node)
      node.style.visibility = "visible";
    local.onEnter?.(node, ...args);
  };
  const handleExited = (node, ...args) => {
    if (node)
      node.style.visibility = "";
    local.onExited?.(...args);
  };
  const renderBackdrop = (backdropProps) => (() => {
    var _el$ = _tmpl$$3();
    spread(_el$, mergeProps(backdropProps, {
      get ["class"]() {
        return classNames(`${bsPrefix}-backdrop`, local.backdropClass);
      }
    }), false, true);
    insert(_el$, () => props.children);
    return _el$;
  })();
  const renderDialog = (dialogProps) => (() => {
    var _el$2 = _tmpl$2$2();
    spread(_el$2, mergeProps(dialogProps, props, {
      get ["class"]() {
        return classNames(local.class, bsPrefix, `${bsPrefix}-${local.placement}`);
      },
      get ["aria-labelledby"]() {
        return local["aria-labelledby"];
      }
    }), false, true);
    insert(_el$2, () => local.children);
    return _el$2;
  })();
  return createComponent(ModalContext$1.Provider, {
    value: modalContext,
    get children() {
      return createComponent(BaseModal, {
        get show() {
          return local.show;
        },
        ref(r$) {
          var _ref$ = local.ref;
          typeof _ref$ === "function" ? _ref$(r$) : local.ref = r$;
        },
        get backdrop() {
          return local.backdrop;
        },
        get container() {
          return local.container;
        },
        get keyboard() {
          return local.keyboard;
        },
        get autoFocus() {
          return local.autoFocus;
        },
        get enforceFocus() {
          return local.enforceFocus && !scroll;
        },
        get restoreFocus() {
          return local.restoreFocus;
        },
        get restoreFocusOptions() {
          return local.restoreFocusOptions;
        },
        get onEscapeKeyDown() {
          return local.onEscapeKeyDown;
        },
        get onShow() {
          return local.onShow;
        },
        onHide: handleHide,
        onEnter: handleEnter,
        get onEntering() {
          return local.onEntering;
        },
        get onEntered() {
          return local.onEntered;
        },
        get onExit() {
          return local.onExit;
        },
        get onExiting() {
          return local.onExiting;
        },
        onExited: handleExited,
        get manager() {
          return getModalManager();
        },
        transition: DialogTransition,
        backdropTransition: BackdropTransition,
        renderBackdrop,
        renderDialog
      });
    }
  });
};
const Offcanvas$1 = Object.assign(Offcanvas, {
  Body: OffcanvasBody,
  Header: OffcanvasHeader$1,
  Title: OffcanvasTitle
});

const NavbarOffcanvas = (props) => {
  const context = useContext(NavbarContext);
  return createComponent(Offcanvas$1, mergeProps({
    get show() {
      return !!context?.expanded;
    }
  }, props));
};
const NavbarOffcanvas$1 = NavbarOffcanvas;

const NavbarText = createWithBsPrefix("navbar-text", {
  Component: "span"
});
const defaultProps$2 = {
  as: "nav",
  expand: true,
  variant: "light",
  collapseOnSelect: false
};
const Navbar = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps$2, p), ["as", "bsPrefix", "expand", "variant", "bg", "fixed", "sticky", "class", "expanded", "defaultExpanded", "onToggle", "onSelect", "collapseOnSelect"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "navbar");
  const [expanded, onToggle] = createControlledProp(() => local.expanded, () => local.defaultExpanded, local.onToggle);
  const handleCollapse = (...args) => {
    local.onSelect?.(...args);
    if (local.collapseOnSelect && expanded()) {
      onToggle?.(false);
    }
  };
  const expandClass = () => {
    let expandClass2 = `${bsPrefix}-expand`;
    if (typeof local.expand === "string")
      expandClass2 = `${expandClass2}-${local.expand}`;
    return expandClass2;
  };
  const navbarContext = {
    get onToggle() {
      return () => onToggle?.(!expanded());
    },
    bsPrefix,
    get expanded() {
      return !!expanded();
    }
  };
  return createComponent(NavbarContext.Provider, {
    value: navbarContext,
    get children() {
      return createComponent(SelectableContext$1.Provider, {
        value: handleCollapse,
        get children() {
          return createComponent(Dynamic, mergeProps({
            get component() {
              return local.as;
            }
          }, props, {
            get role() {
              return props.role === void 0 && local.as !== "nav" ? "Navigation" : props.role;
            },
            get ["class"]() {
              return classNames(local.class, bsPrefix, local.expand && expandClass(), local.variant && `${bsPrefix}-${local.variant}`, local.bg && `bg-${local.bg}`, local.sticky && `sticky-${local.sticky}`, local.fixed && `fixed-${local.fixed}`);
            }
          }));
        }
      });
    }
  });
};
const Navbar$1 = Object.assign(Navbar, {
  Brand: NavbarBrand$1,
  Collapse: NavbarCollapse$1,
  Offcanvas: NavbarOffcanvas$1,
  Text: NavbarText,
  Toggle: NavbarToggle$1
});

const defaultProps$1 = {
  as: "div"
};
const Row = (p) => {
  const breakpoints = useBootstrapBreakpoints();
  const [local, props] = splitProps(mergeProps(defaultProps$1, p), ["as", "bsPrefix", "class", ...breakpoints()]);
  const decoratedBsPrefix = useBootstrapPrefix(local.bsPrefix, "row");
  const sizePrefix = `${decoratedBsPrefix}-cols`;
  const classes = [];
  breakpoints().forEach((brkPoint) => {
    const propValue = local[brkPoint];
    let cols;
    if (propValue != null && typeof propValue === "object") {
      ({
        cols
      } = propValue);
    } else {
      cols = propValue;
    }
    const infix = brkPoint !== "xs" ? `-${brkPoint}` : "";
    if (cols != null)
      classes.push(`${sizePrefix}${infix}-${cols}`);
  });
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    }
  }, props, {
    get ["class"]() {
      return classNames(local.class, decoratedBsPrefix, ...classes);
    }
  }));
};
const Row$1 = Row;

const defaultProps = {
  as: "div"
};
const Spinner = (p) => {
  const [local, props] = splitProps(mergeProps(defaultProps, p), ["as", "bsPrefix", "variant", "animation", "size", "class"]);
  const bsPrefix = useBootstrapPrefix(local.bsPrefix, "spinner");
  const bsSpinnerPrefix = `${bsPrefix}-${local.animation}`;
  return createComponent(Dynamic, mergeProps({
    get component() {
      return local.as;
    }
  }, props, {
    get ["class"]() {
      return classNames(local.class, bsSpinnerPrefix, local.size && `${bsSpinnerPrefix}-${local.size}`, local.variant && `text-${local.variant}`);
    }
  }));
};
const Spinner$1 = Spinner;

async function getMe(token) {
  if (!token) {
    throw new Error("no token");
  }
  const options = {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  };
  const url = `/auth/me`;
  return await fetch(url, options).then((response) => {
    if (response.status === 401) {
      console.log("auth failed, reloading");
      window.location.reload();
    }
    if (response.status !== 200) {
      throw new Error("Not authorized");
    }
    return response.json();
  });
}
async function getListNetworks(token) {
  if (!token) {
    throw new Error("no token");
  }
  const options = {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    }
  };
  const url = `/web-setup/wifi`;
  return await fetch(url, options).then((response) => {
    if (response.status === 401) {
      console.log("auth failed, reloading");
      window.location.reload();
    }
    if (response.status !== 200) {
      throw new Error("Not authorized");
    }
    return response.json();
  });
}
async function postNetworkSelect(token, ssid, key) {
  if (!token) {
    throw new Error("no token");
  }
  if (!ssid) {
    throw new Error("no ssid");
  }
  if (!key) {
    throw new Error("no key");
  }
  const options = {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "ssid": ssid,
      "key": key
    })
  };
  const url = `/web-setup/wifi`;
  return await fetch(url, options).then((response) => {
    if (response.status !== 204) {
      throw new Error("Not authorized");
    }
  });
}

function Centered(props) {
  return createComponent(Container$1, {
    "class": "pt-5",
    get children() {
      return createComponent(Row$1, {
        get children() {
          return createComponent(Col$1, {
            get children() {
              return props.children;
            }
          });
        }
      });
    }
  });
}
function WebSetupLoginCard(props) {
  function onClickLogin(event) {
    event.preventDefault();
    console.log("Clicked log in");
    props.onClickLogin();
  }
  return createComponent(Card$1, {
    get children() {
      return createComponent(Card$1.Body, {
        get children() {
          return [createComponent(Card$1.Title, {
            children: "Log in to your Timechief device"
          }), createComponent(Card$1.Text, {
            get children() {
              return createComponent(Form$1, {
                onSubmit: onClickLogin,
                get children() {
                  return [createComponent(Form$1.Group, {
                    "class": "mb-3",
                    controlId: "hotspotKey",
                    get children() {
                      return [createComponent(Form$1.Label, {
                        children: "Hotspot Key"
                      }), createComponent(Show, {
                        get when() {
                          return props.isError();
                        },
                        get children() {
                          return [createComponent(Form$1.Control, {
                            type: "password",
                            placeholder: "Password",
                            autocomplete: "on",
                            required: true,
                            isInvalid: true
                          }), createComponent(Form$1.Control.Feedback, {
                            type: "invalid",
                            get children() {
                              return props.errorMessage;
                            }
                          })];
                        }
                      }), createComponent(Show, {
                        get when() {
                          return !props.isError();
                        },
                        get children() {
                          return createComponent(Form$1.Control, {
                            type: "password",
                            placeholder: "Password",
                            autocomplete: "on",
                            required: true
                          });
                        }
                      }), createComponent(Form$1.Text, {
                        children: "The hotspot key is your password. It should be displayed on your Timechief when in web setup mode."
                      })];
                    }
                  }), createComponent(Button$1, {
                    variant: "primary",
                    type: "submit",
                    children: "Log in"
                  })];
                }
              });
            }
          })];
        }
      });
    }
  });
}
function Authenticate(props) {
  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [isError, setError] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal("");
  function verifyLogin(token) {
    setError(false);
    setErrorMessage("");
    getMe(token).then((response) => {
      if (response.auth_mode === "web_setup" && response.device_mode === "web_setup") {
        props.onToken(token);
        setError(false);
        setIsLoggedIn(true);
      } else {
        setErrorMessage("Use the Timechief hotspot key and put the device into setup mode.");
        setError(true);
      }
    }).catch((err) => {
      console.log(`login error: ${err}`);
      setErrorMessage("Bad password.  Please try again.");
      setError(true);
    });
  }
  function onClickLogin() {
    const token = document.getElementById("hotspotKey").value;
    verifyLogin(token);
  }
  return [createComponent(Show, {
    get when() {
      return !isLoggedIn();
    },
    get children() {
      return createComponent(Centered, {
        get children() {
          return createComponent(WebSetupLoginCard, {
            isError,
            errorMessage,
            onClickLogin
          });
        }
      });
    }
  }), createComponent(Show, {
    get when() {
      return isLoggedIn();
    },
    get children() {
      return props.children;
    }
  })];
}

function TCNavbar(props) {
  return createComponent(Navbar$1, {
    bg: "primary",
    variant: "dark",
    "class": "min-vh-2",
    get children() {
      return createComponent(Container$1, {
        get children() {
          return createComponent(Navbar$1.Brand, {
            href: "/",
            children: "Timechief Device"
          });
        }
      });
    }
  });
}

var _tmpl$$2 = /* @__PURE__ */ template(`<p>This page is served by a Timechief device running on your local network.`), _tmpl$2$1 = /* @__PURE__ */ template(`<p>\xA9 Timechief Ltd, 2023`), _tmpl$3$1 = /* @__PURE__ */ template(`<footer class="footer bg-dark text-white mt-auto min-vh-5">`);
function Footer(props) {
  return (() => {
    var _el$ = _tmpl$3$1();
    insert(_el$, createComponent(Container$1, {
      get children() {
        return [createComponent(Row$1, {
          get children() {
            return createComponent(Col$1, {
              get children() {
                return _tmpl$$2();
              }
            });
          }
        }), createComponent(Row$1, {
          get children() {
            return createComponent(Col$1, {
              get children() {
                return _tmpl$2$1();
              }
            });
          }
        })];
      }
    }));
    return _el$;
  })();
}

var _tmpl$$1 = /* @__PURE__ */ template(`<i class="fa-solid fa-wifi">`);
function NetworkButton(props) {
  const inputID = `wifiKey-${props.eventKey}`;
  const [isError, setIsError] = createSignal(false);
  function connectToNetwork(event) {
    event.preventDefault();
    setIsError(false);
    const key = document.getElementById(inputID).value;
    postNetworkSelect(props.token(), props.ssid, key).then(() => {
      console.log("Connecting to network...");
      props.onConnecting();
    }).catch((err) => {
      console.log(`network connect error: ${err}`);
      setIsError(true);
    });
  }
  return createComponent(Accordion$1.Item, {
    get eventKey() {
      return props.eventKey;
    },
    get children() {
      return [createComponent(Accordion$1.Header, {
        get children() {
          return [createMemo(() => props.ssid), "\xA0", _tmpl$$1(), "\xA0", createMemo(() => props.signal)];
        }
      }), createComponent(Accordion$1.Body, {
        get children() {
          return createComponent(Form$1, {
            onSubmit: connectToNetwork,
            get children() {
              return [createComponent(Form$1.Group, {
                "class": "mb-3",
                controlId: inputID,
                get children() {
                  return [createComponent(Form$1.Label, {
                    get children() {
                      return ["Network key: (", createMemo(() => props.encryption), ")"];
                    }
                  }), createComponent(Show, {
                    get when() {
                      return isError();
                    },
                    get children() {
                      return [createComponent(Form$1.Control, {
                        type: "password",
                        placeholder: "Key",
                        autocomplete: "on",
                        required: true,
                        isInvalid: true
                      }), createComponent(Form$1.Control.Feedback, {
                        type: "invalid",
                        children: "Invalid key"
                      })];
                    }
                  }), createComponent(Show, {
                    get when() {
                      return !isError();
                    },
                    get children() {
                      return createComponent(Form$1.Control, {
                        type: "password",
                        placeholder: "Key",
                        autocomplete: "on",
                        required: true
                      });
                    }
                  }), createComponent(Form$1.Text, {
                    children: "Enter your home WiFi key. This will enable the Timechief to connect to your local network."
                  })];
                }
              }), createComponent(Button$1, {
                variant: "primary",
                type: "submit",
                children: "Connect to network"
              })];
            }
          });
        }
      })];
    }
  });
}

var _tmpl$ = /* @__PURE__ */ template(`<h1>Setup your Timechief`), _tmpl$2 = /* @__PURE__ */ template(`<p>Your Timechief device is connecting to your home network.`), _tmpl$3 = /* @__PURE__ */ template(`<p>Follow instructions on your device to continue.`), _tmpl$4 = /* @__PURE__ */ template(`<p>If your device does not connect within 3 minutes, start setup again, and ensure you use a correct WiFi key.`);
function WebSetupDashboard(props) {
  const [networks, setNetworks] = createSignal([]);
  const [isConnecting, setConnecting] = createSignal(false);
  onMount(() => {
    getListNetworks(props.token()).then((response) => {
      setNetworks(response);
    });
  });
  function areNetworksAvailable() {
    return networks().length > 0;
  }
  function doOnConnecting() {
    setConnecting(true);
  }
  return [createComponent(TCNavbar, {}), createComponent(Show, {
    get when() {
      return isConnecting();
    },
    get children() {
      return createComponent(Container$1, {
        get children() {
          return createComponent(Row$1, {
            get children() {
              return createComponent(Col$1, {
                get children() {
                  return createComponent(ConnectingCard, {});
                }
              });
            }
          });
        }
      });
    }
  }), createComponent(Show, {
    get when() {
      return !isConnecting();
    },
    get children() {
      return createComponent(Container$1, {
        get children() {
          return [createComponent(Row$1, {
            get children() {
              return createComponent(Col$1, {
                get children() {
                  return _tmpl$();
                }
              });
            }
          }), createComponent(Row$1, {
            get children() {
              return createComponent(Col$1, {
                get children() {
                  return [createComponent(Show, {
                    get when() {
                      return areNetworksAvailable();
                    },
                    get children() {
                      return createComponent(Accordion$1, {
                        get children() {
                          return createComponent(For, {
                            get each() {
                              return networks();
                            },
                            children: (network, i) => createComponent(NetworkButton, {
                              onConnecting: doOnConnecting,
                              get token() {
                                return props.token;
                              },
                              get eventKey() {
                                return i();
                              },
                              get ssid() {
                                return network.ssid;
                              },
                              get signal() {
                                return network.signal_strength;
                              },
                              get encryption() {
                                return network.encryption;
                              }
                            })
                          });
                        }
                      });
                    }
                  }), createComponent(Show, {
                    get when() {
                      return !areNetworksAvailable();
                    },
                    get children() {
                      return createComponent(Spinner$1, {
                        animation: "border"
                      });
                    }
                  })];
                }
              });
            }
          })];
        }
      });
    }
  }), createComponent(Footer, {})];
}
function ConnectingCard(props) {
  return createComponent(Card$1, {
    get children() {
      return createComponent(Card$1.Body, {
        get children() {
          return [createComponent(Card$1.Title, {
            children: "Your Timechief device is connecting"
          }), createComponent(Card$1.Body, {
            get children() {
              return [_tmpl$2(), _tmpl$3(), _tmpl$4(), createComponent(Spinner$1, {
                animation: "border"
              })];
            }
          })];
        }
      });
    }
  });
}
function WebSetupRoute(props) {
  const [token, setToken] = createSignal("");
  return createComponent(Authenticate, {
    onToken: setToken,
    get children() {
      return createComponent(WebSetupDashboard, {
        token
      });
    }
  });
}

const App = () => {
  return createComponent(Routes, {
    get children() {
      return createComponent(Route, {
        path: "/",
        component: WebSetupRoute
      });
    }
  });
};
function attachApp() {
  render(() => createComponent(Router, {
    get source() {
      return hashIntegration();
    },
    get children() {
      return createComponent(App, {});
    }
  }), document.getElementById("app"));
}
attachApp();
