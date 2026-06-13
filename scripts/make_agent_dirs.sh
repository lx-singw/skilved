#!/bin/bash
for agent in analyst application career customer-success growth matching notification outcome-tracker quality revenue scout webhook-handler; do
  mkdir -p "/home/lx_singw/projects/skilved/apps/agents/$agent/src/app"
  echo "created $agent"
done
