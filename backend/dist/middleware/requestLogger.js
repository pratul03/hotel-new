"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const MAX_LOG_CHARS = 2000;
const SENSITIVE_KEYS = new Set([
    "password",
    "newpassword",
    "token",
    "authorization",
    "jwt",
    "secret",
    "apikey",
    "key",
]);
const truncate = (value) => value.length > MAX_LOG_CHARS
    ? `${value.slice(0, MAX_LOG_CHARS)}...<truncated>`
    : value;
const redact = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => redact(item));
    }
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
            const normalizedKey = key.toLowerCase();
            if (SENSITIVE_KEYS.has(normalizedKey)) {
                return [key, "[REDACTED]"];
            }
            return [key, redact(entry)];
        }));
    }
    if (typeof value === "string") {
        return truncate(value);
    }
    return value;
};
const toSafeLogPayload = (payload) => {
    try {
        return truncate(JSON.stringify(redact(payload)));
    }
    catch {
        return "[unserializable payload]";
    }
};
const parseGraphQLOperation = (body) => {
    if (!body || typeof body !== "object") {
        return null;
    }
    const candidate = body;
    if (typeof candidate.operationName === "string" && candidate.operationName) {
        return candidate.operationName;
    }
    if (typeof candidate.query === "string") {
        const match = candidate.query.match(/(?:query|mutation)\s+(\w+)/);
        return match ? match[1] : "anonymous";
    }
    return null;
};
const requestId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const requestLogger = (req, res, next) => {
    if (process.env.LOG_API_REQUESTS === "false") {
        return next();
    }
    const logBodies = process.env.LOG_API_BODIES === "true";
    const startTime = Date.now();
    const id = requestId();
    const path = req.originalUrl || req.path;
    const meta = `${req.method} ${path}`;
    const gqlOperation = path.includes("/api/graphql")
        ? parseGraphQLOperation(req.body)
        : null;
    let responsePayload;
    const originalJson = res.json.bind(res);
    res.json = ((body) => {
        responsePayload = body;
        return originalJson(body);
    });
    const originalSend = res.send.bind(res);
    res.send = ((body) => {
        if (responsePayload === undefined) {
            responsePayload = body;
        }
        return originalSend(body);
    });
    if (logBodies && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        console.log(`[REQ] [${id}] ${meta} body=${toSafeLogPayload(req.body)}`);
    }
    else {
        console.log(`[REQ] [${id}] ${meta}`);
    }
    res.on("finish", () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 500 ? "❌" : res.statusCode >= 400 ? "⚠️" : "✅";
        const gqlMeta = gqlOperation ? ` op=${gqlOperation}` : "";
        console.log(`${logLevel} [HTTP] [${id}] ${meta}${gqlMeta} - ${res.statusCode} (${duration}ms)`);
        if (logBodies) {
            console.log(`[RES] [${id}] ${meta} body=${toSafeLogPayload(responsePayload)}`);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
exports.default = exports.requestLogger;
