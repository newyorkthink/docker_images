# 镜像归档

这里保存经确认停用的镜像目录和原构建配置。镜像目录与本页同级。`workflows/` 保存原来的独立工作流和从统一工作流生成的构建快照。已发布的 GHCR 镜像保留原有状态。

## 已归档镜像

| 目录 | 原镜像 | 原构建工作流 |
|---|---|---|
| [`catgpt-gateway/`](./catgpt-gateway) | `ghcr.io/newyorkthink/catgpt-gateway:latest` | [`.github/workflows/catgpt-gateway.yml`](./workflows/catgpt-gateway.yml) |

## 归档与恢复

按[镜像归档工具](../scripts/archive/README.md)生成计划并核对实际影响。恢复时核对官方上游和构建入口，将镜像目录移回仓库根目录。参考原工作流或快照，在 `.github/workflows/build-images.yml` 补回手动选项、推送路径、定时触发、路由和构建任务，再恢复根目录索引并移除本页对应条目。
