#!/bin/sh
cd "$(dirname "$0")"
sh ./deploy.sh
status=$?
printf '\n'
if [ "$status" -ne 0 ]; then
    printf '部署失败（退出码 %s）。\n' "$status"
fi
printf '按回车键关闭窗口...'
read _
exit "$status"
