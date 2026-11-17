module.exports = {
  apps: [
    {
      name: "stock-penjualan",
      script: "./backend/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
