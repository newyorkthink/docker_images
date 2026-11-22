function planArchive({ image, gitTree, rootReadme, archiveReadme }) {
  if (typeof image !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(image) ||
      image === "archive" || image === "workflows") {
    throw new Error("请指定一个已登记的镜像目录名。");
  }
  if (!gitTree || gitTree.truncated !== false || !Array.isArray(gitTree.tree) ||
      !/^[a-f0-9]{40}$/.test(gitTree.sha ?? "")) {
    throw new Error("需要 main 固定提交的完整递归 Git tree。");
  }
  if (typeof rootReadme !== "string" || typeof archiveReadme !== "string") {
    throw new Error("需要同一提交的两份 README 正文。");
  }

  const workflow = `.github/workflows/${image}.yml`;
  const archivedImage = `archive/${image}`;
  const archivedWorkflow = `archive/workflows/${image}.yml`;
  const paths = new Map(gitTree.tree.map(entry => [entry.path, entry]));
  const sourceDir = paths.get(image);
  const sourceWorkflow = paths.get(workflow);
  const rootIndex = paths.get("README.md");
  const archiveIndex = paths.get("archive/README.md");
  if (sourceDir?.mode !== "040000" || sourceDir.type !== "tree" ||
      sourceWorkflow?.mode !== "100644" || paths.get(`${image}/README.md`)?.type !== "blob" ||
      rootIndex?.mode !== "100644" || archiveIndex?.mode !== "100644") {
    throw new Error("活动镜像目录、独立构建工作流或索引文件不完整。");
  }
  if (paths.has(archivedImage) || paths.has(archivedWorkflow) ||
      (paths.has("archive/workflows") && paths.get("archive/workflows").type !== "tree")) {
    throw new Error("归档位置已被占用。");
  }

  const rowPrefix = "| [`" + image + "/`](./" + image + ") | ";
  const rowSuffix = " | `" + workflow + "` |";
  const rootLines = rootReadme.split("\n");
  const activeRows = rootLines.filter(line => line.startsWith(rowPrefix));
  if (activeRows.length !== 1 || !activeRows[0].endsWith(rowSuffix) ||
      activeRows[0].length <= rowPrefix.length + rowSuffix.length) {
    throw new Error("活动镜像索引的条目缺失、重复或工作流路径不一致。");
  }
  const tags = activeRows[0].slice(rowPrefix.length, -rowSuffix.length);
  const remainingRows = rootLines.filter(line => line !== activeRows[0]);

  const archiveLines = archiveReadme.split("\n");
  const archiveHeader = "| 目录 | 原镜像 | 原构建工作流 |";
  const archiveTable = archiveLines.indexOf(archiveHeader);
  if (archiveTable < 0 || archiveLines.lastIndexOf(archiveHeader) !== archiveTable ||
      archiveLines[archiveTable + 1] !== "|---|---|---|" ||
      archiveLines.some(line => line.startsWith(rowPrefix))) {
    throw new Error("归档索引的表头缺失、重复或已有该镜像。");
  }
  let insertAt = archiveTable + 2;
  while (archiveLines[insertAt]?.startsWith("| ")) {
    insertAt += 1;
  }
  const workflowLink = "[`" + workflow + "`](./workflows/" + image + ".yml)";
  archiveLines.splice(insertAt, 0, rowPrefix + tags + " | " + workflowLink + " |");

  return {
    base_tree_sha: gitTree.sha,
    tree_elements: [
      { path: archivedImage, type: sourceDir.type, mode: sourceDir.mode, sha: sourceDir.sha },
      { path: image, type: sourceDir.type, mode: sourceDir.mode, sha: null },
      { path: archivedWorkflow, type: sourceWorkflow.type, mode: sourceWorkflow.mode, sha: sourceWorkflow.sha },
      { path: workflow, type: sourceWorkflow.type, mode: sourceWorkflow.mode, sha: null },
      { path: "README.md", type: rootIndex.type, mode: rootIndex.mode, content: remainingRows.join("\n") },
      { path: "archive/README.md", type: archiveIndex.type, mode: archiveIndex.mode, content: archiveLines.join("\n") }
    ]
  };
}
