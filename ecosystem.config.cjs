module.exports = {
  apps: [{
    name: 'loom-backend',
    script: 'server/index.js',
    cwd: '/home/swd/loom',
    env: { NODE_ENV: 'production', PORT: '5555' },
    restart_delay: 3000,
    max_restarts: 10,
    autorestart: true,
  }],
};
