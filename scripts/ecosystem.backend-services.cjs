const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

module.exports = {
  apps: [
    {
      name: "backend-api",
      cwd: path.join(repoRoot, "backend"),
      script: "pnpm",
      args: "dev",
      interpreter: "none",
      autorestart: true,
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "job-supervisor",
      cwd: path.join(repoRoot, "services/job-supervisor"),
      script: "pnpm",
      args: "dev",
      interpreter: "none",
      autorestart: true,
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "notification-service",
      cwd: path.join(repoRoot, "services/notification"),
      script: "pnpm",
      args: "dev",
      interpreter: "none",
      autorestart: true,
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
