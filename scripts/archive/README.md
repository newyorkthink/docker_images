# 镜像归档工具

[plan_archive.js](./plan_archive.js) 根据当前 `main` 的内容生成一个镜像的归档计划。输入由 GitHub 连接器读取。

1. 在同一个 `main` 提交下读取未截断的递归 Git tree、根目录 `README.md`、`archive/README.md` 和本脚本。
2. 在云端 JavaScript 编排环境中，将镜像目录名、解析后的 Git tree 数据和两份 README 正文传入 `planArchive`。以下变量使用前一步取得的内容。

```javascript
// 加载归档计划脚本。
const planArchive = new Function('"use strict";\n' + plannerSource + "\nreturn planArchive;")();

// 生成并查看本次归档计划。
const plan = planArchive({ image, gitTree, rootReadme, archiveReadme });
text(plan);
```

3. 核对计划。镜像目录移入 `archive/<镜像目录>/`，工作流移入 `archive/workflows/<镜像目录>.yml`，两份索引同步更新。完整目录及工作流沿用 Git 对象和权限。
4. 按[仓库规则](../../AGENTS.md)列明本次归档的具体路径及影响。收到「同意」后，将 `plan` 的两个字段及本仓库名交给 GitHub 连接器创建新 tree。以原 `main` 头为父提交创建一次提交，更新 `main` 时带上预期的原头提交。若 `main` 已变化，按最新提交重新规划。

计划脚本只计算 Git 变更。归档后的恢复步骤见[归档索引](../../archive/README.md)。
