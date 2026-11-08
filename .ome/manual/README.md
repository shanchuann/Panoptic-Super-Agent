# 设计说明书

本目录保存项目设计说明书的源文件与导出件。

| 文件 | 说明 |
|---|---|
| manual.md | 说明书正文，Markdown 源文件 |
| manual.pdf | 排版后的 PDF，A4，二十五页，含封面、目录、页脚页码 |
| print/manual.html | 印刷用 HTML，配套 CSS 与分页规则 |
| print/ | 构建中间文件与预览图 |
| architecture-overview.svg 等 | 五张图的 SVG 源文件 |
| vivid/ | 架构图 A/B 候选、选定记录与可编辑 PPTX |

重新生成 PDF 的步骤：由 manual.md 生成 print/manual.html，用 Chrome 无头模式按 A4 打印，再用 PyMuPDF 添加页脚页码。构建脚本位于 print 目录。