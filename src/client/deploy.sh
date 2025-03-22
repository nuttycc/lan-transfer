#!/usr/bin/env bash
set -x  # 打印每个执行的命令
set -e  # 发生错误时终止

# 进入 client 目录
cd "$(dirname "$0")" || { echo "Failed to cd into client directory"; exit 1; }

# 构建
pnpm run build

# 进入构建文件夹
cd dist || { echo "Failed to cd into dist"; exit 1; }

# 如果你要部署到自定义域名
# echo 'www.example.com' > CNAME

# 删除现有的 .git 目录（如果存在）
rm -rf .git

# 初始化新的临时 git 仓库
git init
git checkout -b dev || git checkout dev  # 创建 dev 分支或使用现有的
git add -A
git commit -m 'deploy'

# 推送到现有仓库的 gh-pages 分支
git push -f https://github.com/nuttycc/lan-transfer.git dev:gh-pages

cd -