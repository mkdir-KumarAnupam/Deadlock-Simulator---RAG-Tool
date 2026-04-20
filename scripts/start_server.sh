#!/bin/bash
# CodeDeploy automatically runs this as part of the ApplicationStart hook
cd /home/ubuntu/simulator

export PATH="/home/ubuntu/.bun/bin:$PATH"

# Restart the application using PM2
pm2 restart simulator || pm2 start server/src/index.js --interpreter bun --name "simulator"
