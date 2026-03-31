const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const logsDir = path.join(repoRoot, "logs", "pm2");

const withLogs = (name, extraEnv = {}) => ({
  out_file: path.join(logsDir, `${name}.out.log`),
  error_file: path.join(logsDir, `${name}.error.log`),
  log_file: path.join(logsDir, `${name}.combined.log`),
  time: true,
  merge_logs: true,
  env: {
    NODE_ENV: "development",
    ...extraEnv,
  },
});

module.exports = {
  apps: [
    {
      name: "backend-api",
      cwd: path.join(repoRoot, "backend"),
      script: "pnpm",
      args: "dev",
      interpreter: "none",
      autorestart: true,
      ...withLogs("backend-api", {
        LOG_API_REQUESTS: "true",
        LOG_API_BODIES: "true",
      }),
    },
    {
      name: "job-supervisor",
      cwd: path.join(repoRoot, "services/job-supervisor"),
      script: "pnpm",
      args: "dev",
      interpreter: "none",
      autorestart: true,
      ...withLogs("job-supervisor"),
    },
    {
      name: "notification-service",
      cwd: path.join(repoRoot, "services/notification"),
      script: "pnpm",
      args: "dev",
      interpreter: "none",
      autorestart: true,
      ...withLogs("notification-service"),
    },
  ],
};
