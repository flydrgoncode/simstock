module.exports = {
  apps: [
    {
      name: "simstock",
      cwd: "/var/www/simstock",
      script: "npm",
      args: "run start:prod",
      interpreter: "none",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
