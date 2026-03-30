"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJobResult = exports.EVENT_CHANNEL = void 0;
const environment_1 = require("./config/environment");
exports.EVENT_CHANNEL = environment_1.env.REDIS_EVENT_CHANNEL;
const createJobResult = (jobName, startedAt) => ({
    finalize: (processed, failed = 0, errors = []) => {
        const completedAt = new Date();
        const result = {
            jobName,
            startedAt,
            completedAt,
            durationMs: completedAt.getTime() - startedAt.getTime(),
            processed,
            failed,
            errors,
        };
        console.log(`[CRON] ${jobName} — processed: ${processed}, failed: ${failed}, duration: ${result.durationMs}ms`);
        return result;
    },
});
exports.createJobResult = createJobResult;
