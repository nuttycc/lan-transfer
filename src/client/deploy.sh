#!/usr/bin/env sh
set -x  # 打印每个执行的命令
set -e  # 发生错误时终止

# 进入 client 目录
cd src/client || { echo "Failed to cd into src/client"; exit 1; }

# 构建
pnpm run build

# 进入构建文件夹
cd dist || { echo "Failed to cd into dist"; exit 1; }

# 如果你要部署到自定义域名
# echo 'www.example.com' > CNAME

# 初始化临时 git 仓库
git init
git checkout -b dev  # 强制使用 dev 分支
git add -A
git commit -m 'deploy'

# 推送到现有仓库的 gh-pages 分支
git push -f https://github.com/nuttycc/lan-transfer.git dev:gh-pages

cd -