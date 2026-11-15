# 设计说明书

本目录保存说明书正文、正式图源和交付文件。开发与构建不依赖已淘汰的图件候选。

| 路径 | 用途 |
|---|---|
| manual.md | 说明书正文 |
| manual.pdf | 正式 PDF 交付文件 |
| architecture-overview.svg、side-agent.svg 等 | 正式 SVG 图源及对应的 PNG/PDF 导出 |
| vivid/delivery/ | 可编辑架构图 PPTX、PDF 和质量报告 |
| vivid/ATTRIBUTION.md | 图件来源与归属 |
| scripts/ | HTML 排版、目录页码定位、PDF 页脚脚本和样式 |
| print/ | 可重新生成的 HTML、目录页码和两轮打印中间 PDF，Git 忽略 |

## 重新生成

在仓库根目录执行以下步骤。Node 使用项目管理的版本；PDF 处理脚本需要当前 Python 环境安装 PyMuPDF。

1. 运行 `pnpm node .ome/manual/scripts/build.mjs .ome/manual/manual.md .ome/manual/print/manual.html` 生成 HTML，目录页码暂为占位值。
2. 使用 Chrome 将 HTML 按 A4 打印为 `.ome/manual/print/manual-pass1.pdf`，关闭浏览器页眉页脚。
3. 运行 `py -X utf8 .ome/manual/scripts/find_pages.py`，从第一轮 PDF 提取章节页码，生成 `print/pages.json`。
4. 运行 `pnpm node .ome/manual/scripts/build.mjs .ome/manual/manual.md .ome/manual/print/manual.html .ome/manual/print/pages.json`，再将 HTML 按相同设置打印为 `print/manual-pass2.pdf`。
5. 运行 `py -X utf8 .ome/manual/scripts/add_footer.py`，添加页脚并写入正式 `manual.pdf`。

生成 HTML 会自动建立 print 目录；CSS 和 Python 路径相对于脚本定位，不依赖固定的磁盘目录。最终 PDF 只在最后一步更新。
