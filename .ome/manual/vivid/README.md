# 架构图候选（vivid-illustration-skill）

本目录是项目设计说明书的架构图工作区，按 vivid-illustration-skill 的架构图流程制作。

## 内容

- brief.md：图件简报（对象、关系、语言、宽度、禁止项）
- A/fig.svg、A/fig.png：候选 A，保留纵向栈构图
- B/fig.svg、B/fig.png：候选 B，重组为三列构图
- comparison.html：两版等宽对照页
- ATTRIBUTION.md：来源资产与许可

## 复现命令

~~~powershell
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
& $chrome --headless=new --disable-gpu --no-sandbox --window-size=1400,1000 --screenshot=fig.png file:///绝对路径/fig.svg
~~~

## 交付状态

候选已生成并自行审图。等待用户选择 A 或 B，随后导出所选版本的 SVG、PDF 与原生可编辑 PPTX。

## 来源

主资产 VA-109，来自 vivid-illustration-skill 资产库；该 Skill 仅限个人非商业使用。图形与文字按本项目事实重绘，未复用原图的示例数据。