#!/bin/bash

# 端口定义
FRONTEND_PORT=5173
BACKEND_PORT=3000

# 项目路径
FRONTEND_DIR="$(dirname "$0")/frontend"
BACKEND_DIR="$(dirname "$0")/backend"

# 检查并kill端口进程
function kill_port() {
  local PORT=$1
  PID=$(lsof -ti tcp:$PORT)
  if [ -n "$PID" ]; then
    echo "端口 $PORT 被进程 $PID 占用，正在kill..."
    kill -9 $PID
    sleep 1
  fi
}

echo "==== 检查并释放端口 ===="
kill_port $FRONTEND_PORT
kill_port $BACKEND_PORT

echo "==== 启动后端服务 ===="
cd "$BACKEND_DIR"
npm install
nohup npm run dev > backend.log 2>&1 &

sleep 2

echo "==== 启动前端服务 ===="
cd "$FRONTEND_DIR"
npm install
nohup npm run dev > frontend.log 2>&1 &

echo "==== 启动完成 ===="
echo "前端：http://localhost:$FRONTEND_PORT/"
echo "后端：http://localhost:$BACKEND_PORT/" 