#!/bin/bash
# CodeDeploy automatically runs this as part of the AfterInstall hook
cd /home/ec2-user/simulator

# Provide full path to bun because CodeDeploy shells often lack environment variables
/home/ec2-user/.bun/bin/bun install
