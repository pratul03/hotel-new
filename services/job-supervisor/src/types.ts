import { env } from "./config/environment";

export const EVENT_CHANNEL = env.REDIS_EVENT_CHANNEL;

export interface JobResult {
  jobName: string;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  processed: number;
  failed: number;
  errors: string[];
}

export const createJobResult = (
  jobName: string,
  startedAt: Date,
): {
  finalize: (
    processed: number,
    failed?: number,
    errors?: string[],
  ) => JobResult;
} => ({
  finalize: (processed, failed = 0, errors = []) => {
    const completedAt = new Date();
    const result: JobResult = {
      jobName,
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      processed,
      failed,
      errors,
    };
    console.log(
      `[CRON] ${jobName} — processed: ${processed}, failed: ${failed}, duration: ${result.durationMs}ms`,
    );
    return result;
  },
});
