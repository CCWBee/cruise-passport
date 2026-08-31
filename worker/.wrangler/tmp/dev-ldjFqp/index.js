var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var MAX_BODY_BYTES = 64 * 1024;
var MAX_MEMBERS = 50;
var PARAMETER_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
var LOCALHOST_ORIGIN_PATTERN = /^http:\/\/localhost(:\d+)?$/;
function corsHeaders(request) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400"
  });
  const origin = request.headers.get("Origin");
  if (origin === "https://ccwbee.github.io" || origin !== null && LOCALHOST_ORIGIN_PATTERN.test(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return headers;
}
__name(corsHeaders, "corsHeaders");
function json(request, value, status = 200) {
  const headers = corsHeaders(request);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(value), { status, headers });
}
__name(json, "json");
function error(request, status, message) {
  return json(request, { error: message }, status);
}
__name(error, "error");
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
__name(isObject, "isObject");
function isShareEntry(value) {
  if (!isObject(value)) return false;
  if ("t" in value && value.t !== 1) return false;
  if ("d" in value && typeof value.d !== "string") return false;
  if ("r" in value && typeof value.r !== "number") return false;
  if ("rc" in value && value.rc !== 1) return false;
  if ("c" in value && typeof value.c !== "string") return false;
  return true;
}
__name(isShareEntry, "isShareEntry");
function isSharePayload(value) {
  if (!isObject(value)) return false;
  if (value.v !== 2 || typeof value.id !== "string" || typeof value.n !== "string" || typeof value.c !== "string" || typeof value.ts !== "number" || !Number.isFinite(value.ts) || !isObject(value.e) || !isObject(value.s)) return false;
  if (!Object.values(value.e).every(isShareEntry)) return false;
  return Object.values(value.s).every((visit) => visit === 1);
}
__name(isSharePayload, "isSharePayload");
async function putMember(request, env, group, member) {
  const contentLength = request.headers.get("Content-Length");
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return error(request, 413, "Request body exceeds 64 KB.");
    }
  }
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_BODY_BYTES) return error(request, 413, "Request body exceeds 64 KB.");
  let body;
  try {
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return error(request, 400, "Malformed JSON body.");
  }
  if (!isObject(body) || !isSharePayload(body.payload)) {
    return error(request, 400, "Body must contain a valid SharePayload.");
  }
  if (body.payload.id !== member) return error(request, 403, "Payload member does not match the URL.");
  const updatedAt = Date.now();
  await env.CRUISE_KV.put(
    `g:${group}:${member}`,
    JSON.stringify({ payload: body.payload, updatedAt })
  );
  return json(request, { ok: true, updatedAt });
}
__name(putMember, "putMember");
async function getGroup(request, env, group) {
  const prefix = `g:${group}:`;
  const listed = await env.CRUISE_KV.list({ prefix, limit: MAX_MEMBERS });
  const members = await Promise.all(listed.keys.slice(0, MAX_MEMBERS).map(async ({ name }) => {
    const raw = await env.CRUISE_KV.get(name);
    if (raw === null) return null;
    try {
      const stored = JSON.parse(raw);
      if (!isObject(stored) || !isSharePayload(stored.payload) || typeof stored.updatedAt !== "number" || !Number.isFinite(stored.updatedAt)) return null;
      return { id: name.slice(prefix.length), payload: stored.payload, updatedAt: stored.updatedAt };
    } catch {
      return null;
    }
  }));
  return json(request, { members: members.filter((member) => member !== null) });
}
__name(getGroup, "getGroup");
async function fetch(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  try {
    const { pathname } = new URL(request.url);
    const putMatch = pathname.match(/^\/g\/([^/]+)\/([^/]+)$/);
    if (putMatch !== null) {
      if (!PARAMETER_PATTERN.test(putMatch[1]) || !PARAMETER_PATTERN.test(putMatch[2])) {
        return error(request, 400, "Invalid group or member.");
      }
      if (request.method !== "PUT") return error(request, 405, "Method not allowed.");
      return await putMember(request, env, putMatch[1], putMatch[2]);
    }
    const getMatch = pathname.match(/^\/g\/([^/]+)$/);
    if (getMatch !== null) {
      if (!PARAMETER_PATTERN.test(getMatch[1])) return error(request, 400, "Invalid group.");
      if (request.method !== "GET") return error(request, 405, "Method not allowed.");
      return await getGroup(request, env, getMatch[1]);
    }
    return error(request, 404, "Not found.");
  } catch {
    return error(request, 500, "Internal server error.");
  }
}
__name(fetch, "fetch");
var src_default = { fetch };

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error2 = reduceError(e);
    const body = JSON.stringify(error2);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-cHQ9AU/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-cHQ9AU/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
