function planArchive({ image, gitTree, rootReadme, archiveReadme, buildWorkflow }) {
  if (typeof image !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(image) ||
      image === "archive" || image === "workflows") {
    throw new Error("请指定一个已登记的镜像目录名。");
  }
  if (!gitTree || gitTree.truncated !== false || !Array.isArray(gitTree.tree) ||
      !/^[a-f0-9]{40}$/.test(gitTree.sha ?? "")) {
    throw new Error("需要 main 固定提交的完整递归 Git tree。");
  }
  if (typeof rootReadme !== "string" || typeof archiveReadme !== "string" ||
      typeof buildWorkflow !== "string") {
    throw new Error("需要同一提交的两份 README 及统一构建工作流正文。");
  }

  const workflow = ".github/workflows/build-images.yml";
  const archivedImage = `archive/${image}`;
  const archivedWorkflow = `archive/workflows/${image}.yml`;
  const paths = new Map(gitTree.tree.map(entry => [entry.path, entry]));
  const sourceDir = paths.get(image);
  const sourceWorkflow = paths.get(workflow);
  const rootIndex = paths.get("README.md");
  const archiveIndex = paths.get("archive/README.md");
  if (sourceDir?.mode !== "040000" || sourceDir.type !== "tree" ||
      sourceWorkflow?.mode !== "100644" || sourceWorkflow.type !== "blob" ||
      paths.get(`${image}/README.md`)?.type !== "blob" ||
      rootIndex?.mode !== "100644" || archiveIndex?.mode !== "100644") {
    throw new Error("活动镜像目录、统一构建工作流或索引文件不完整。");
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
  const workflowLink = "[`" + image + ".yml`](./workflows/" + image + ".yml)";
  archiveLines.splice(insertAt, 0, rowPrefix + tags + " | " + workflowLink + " |");

  const workflowLines = buildWorkflow.split("\n");

  function uniqueIndex(lines, entry, label) {
    const index = lines.indexOf(entry);
    if (index < 0 || lines.lastIndexOf(entry) !== index) {
      throw new Error(label + "缺失或重复。");
    }
    return index;
  }

  const remove = new Set();
  remove.add(uniqueIndex(workflowLines, "          - " + image, "手动构建选项"));

  const routesStart = uniqueIndex(workflowLines, "          ROUTES: |", "镜像路由区块");
  const routes = new Map();
  for (let index = routesStart + 1; /^ {12}\S/.test(workflowLines[index] ?? ""); index += 1) {
    const [name, branch, schedule, ...globs] = workflowLines[index].slice(12).split("|");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || routes.has(name) ||
        !["main", "any"].includes(branch) || !/^[0-9* ,/-]*$/.test(schedule ?? "x") ||
        globs.length === 0 || new Set(globs).size !== globs.length ||
        globs.some(glob => !glob.startsWith(name + "/") || glob.includes("'"))) {
      throw new Error("镜像构建路由格式不正确或有重复项目。");
    }
    routes.set(name, { index, branch, schedule, globs });
  }
  const route = routes.get(image);
  if (!route) {
    throw new Error("当前镜像的构建路由缺失。");
  }
  remove.add(route.index);

  const push = uniqueIndex(workflowLines, "  push:", "推送触发区块");
  if (workflowLines[push + 1] !== "    paths:") {
    throw new Error("推送触发区块缺少路径列表。");
  }
  const pushPaths = [];
  for (let index = push + 2; /^      - '[^']+'$/.test(workflowLines[index] ?? ""); index += 1) {
    pushPaths.push(workflowLines[index]);
  }
  const pushRows = route.globs.map(glob => "      - '" + glob + "'");
  const imagePushRows = pushPaths.filter(line => line.startsWith("      - '" + image + "/"));
  if (imagePushRows.length !== pushRows.length) {
    throw new Error("当前镜像的推送路径与构建路由不一致。");
  }
  for (const row of pushRows) {
    remove.add(push + 2 + uniqueIndex(pushPaths, row, "推送触发路径"));
  }
  if (pushRows.length === pushPaths.length) {
    remove.add(push);
    remove.add(push + 1);
  }

  const cronLine = "    - cron: '" + route.schedule + "'";
  if (route.schedule) {
    const schedule = uniqueIndex(workflowLines, "  schedule:", "定时触发区块");
    let end = schedule + 1;
    while (workflowLines[end]?.startsWith("    - cron: ")) {
      end += 1;
    }
    const cron = schedule + 1 + uniqueIndex(workflowLines.slice(schedule + 1, end), cronLine, "定时构建触发");
    const shared = [...routes].some(([name, other]) => name !== image && other.schedule === route.schedule);
    if (!shared) {
      remove.add(cron);
      if (end === schedule + 2) {
        remove.add(schedule);
      }
    }
  }

  const jobStart = uniqueIndex(workflowLines, "  # BEGIN image: " + image, "构建 Job 起点");
  const jobEnd = uniqueIndex(workflowLines, "  # END image: " + image, "构建 Job 终点");
  const jobLines = workflowLines.slice(jobStart + 1, jobEnd);
  if (jobLines[0] !== "  build_" + image.replaceAll("-", "_") + ":" ||
      jobLines.slice(1).some(line => /^ {2}\S/.test(line))) {
    throw new Error("当前镜像的构建 Job 区块格式不正确。");
  }
  const needs = uniqueIndex(jobLines, "    needs: plan", "构建 Job 路由依赖");
  const conditions = jobLines.filter(line => /^    if: /.test(line));
  if (conditions.length !== 1 || !conditions[0].includes("needs.plan.outputs.")) {
    throw new Error("构建 Job 的路由条件缺失或格式不正确。");
  }
  const job = jobLines.filter((line, index) => index !== needs && line !== conditions[0]);
  for (let index = jobStart; index <= jobEnd; index += 1) {
    remove.add(index);
  }

  const snapshot = [
    "name: Build " + image,
    "",
    "on:",
    "  push:",
    ...(route.branch === "main" ? ["    branches: [main]"] : []),
    "    paths:",
    ...pushRows,
    ...(route.schedule ? ["  schedule:", cronLine] : []),
    "  workflow_dispatch:",
    "",
    "jobs:",
    ...job,
    ""
  ].join("\n");
  const remainingWorkflow = workflowLines.filter((line, index) => !remove.has(index)).join("\n");

  return {
    base_tree_sha: gitTree.sha,
    tree_elements: [
      { path: archivedImage, type: sourceDir.type, mode: sourceDir.mode, sha: sourceDir.sha },
      { path: image, type: sourceDir.type, mode: sourceDir.mode, sha: null },
      { path: archivedWorkflow, type: sourceWorkflow.type, mode: sourceWorkflow.mode, content: snapshot },
      { path: workflow, type: sourceWorkflow.type, mode: sourceWorkflow.mode, content: remainingWorkflow },
      { path: "README.md", type: rootIndex.type, mode: rootIndex.mode, content: remainingRows.join("\n") },
      { path: "archive/README.md", type: archiveIndex.type, mode: archiveIndex.mode, content: archiveLines.join("\n") }
    ]
  };
}
