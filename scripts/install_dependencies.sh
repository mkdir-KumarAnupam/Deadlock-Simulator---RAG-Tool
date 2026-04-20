#!/bin/bash
# CodeDeploy automatically runs this as part of the AfterInstall hook
cd /home/ubuntu/simulator

# Provide full path to bun because CodeDeploy shells often lack environment variables
/home/ubuntu/.bun/bin/bun install
