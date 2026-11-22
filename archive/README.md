# 镜像归档

这里保存经确认停用的镜像目录和原构建工作流。镜像目录与本页同级，工作流保存在 `workflows/` 中。已发布的 GHCR 镜像保留原有状态。

## 已归档镜像

| 目录 | 原镜像 | 原构建工作流 |
|---|---|---|
| [`catgpt-gateway/`](./catgpt-gateway) | `ghcr.io/newyorkthink/catgpt-gateway:latest` | [`.github/workflows/catgpt-gateway.yml`](./workflows/catgpt-gateway.yml) |

## 归档与恢复

按[镜像归档工具](../scripts/archive/README.md)生成计划并核对实际影响。恢复时核对官方上游和构建入口，将目录和工作流分别移回原位置，恢复根目录索引并移除本页对应条目。
