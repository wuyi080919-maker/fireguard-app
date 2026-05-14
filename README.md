# 安消云管家

消防工程公司楼宇与小区管理 App 原型。

## 功能

- 项目总览、风险地图、告警队列
- 楼宇小区档案与搜索
- 巡检工单看板与状态筛选
- 新建巡检工单，并保存到当前浏览器本地储存
- 消防设备台账健康度
- 隐患整改闭环时间线
- 工作信息纯文字记录，可同步到 GitHub 仓库 JSON 文件

## 使用

直接打开 `index.html`，或在本目录启动任意静态服务器。

## 数据储存

当前版本使用浏览器 `localStorage` 保存新增工单和工作信息，同时支持把“工作信息”同步到 GitHub 仓库中的 `data/worklog.json`。

GitHub 同步需要 Fine-grained personal access token，并给目标仓库开启 `Contents` 读写权限。测试阶段建议使用 private 仓库和短期 token。
