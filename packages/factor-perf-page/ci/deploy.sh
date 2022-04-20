#!/usr/bin/env bash
set -eu

HOST=172.30.0.2
SSH_PORT=22
REMOTE_USER=rice
REMOTE_PATH=/static/uat/factor-perf/

npm run clean

npm run build

time rsync -aczvh --stats --delete -e "ssh -p $SSH_PORT" dist/ $REMOTE_USER@$HOST:$REMOTE_PATH
