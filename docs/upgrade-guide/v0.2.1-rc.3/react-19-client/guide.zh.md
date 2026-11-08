---
kind: upgrade-guide
description: 客户端插件必须使用应用共享的 React 19 运行时和类型。
---

# React 19 客户端插件

[English](guide.md) | 中文

## 变更

Panoptic Super 的 Web 和 Desktop 使用 React 19.3 与 React DOM 19.3。客户端插件共享应用的 React 实例。按 React 18 编译的插件必须先更新依赖声明和 ref 类型，再重新构建。Session 数据与 profile 配置不变。

## 迁移

1. 将客户端插件的 React 和 React DOM 依赖范围更新为 `^19.3.0`，React 类型声明更新为 `~19.3.0`。插件构建继续将 React 设为外部依赖，使用应用提供的运行时。
2. 为 `useRef` 传入初始值；尚无值时使用 `undefined`。挂载过程可能使 ref 为空时，在 `RefObject` 的元素类型中包含 `null`。ref 回调不能隐式返回赋值结果。
3. 使用布尔 `inert` 属性。在组件测试中用 `act` 刷新计时器触发的 React 更新，断言已挂载的输出，不依赖中间渲染次数。
4. 执行 `pnpm install`、`pnpm run typecheck`、相关客户端测试与 `pnpm run build`。确认构建后的客户端插件图能够启动，再使用重建的插件。
