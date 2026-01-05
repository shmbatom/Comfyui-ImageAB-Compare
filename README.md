# Comfyui-ImageAB-Compare
A fully functional ComfyUI node plugin that supports image segmentation and comparison in both horizontal and vertical directions, real-time interaction and adjustment of segmentation ratios via mouse, bidirectional linkage between slider and mouse, and the ability to export comparison images with precise segmentation lines.

Comfyui-ImageAB-Compare - 二图对比查看插件

一个功能完善的 ComfyUI 节点插件，支持图片左右 / 上下分割对比、鼠标实时交互调整分割比例、滑块与鼠标双向联动，可导出带精准分割线的对比图。

功能特性

✅ 双模式分割对比：支持垂直（左右）/ 水平（上下）两种分割方向✅ 实时交互调整：鼠标移动精准控制分割线位置，支持像素级微调✅ 双向参数联动：分割比例滑块与鼠标操作实时同步，参数无缝衔接✅ 精准尺寸适配：基于基准图片尺寸等比例渲染，预览与导出效果 1:1 匹配✅ 自定义视觉样式：可调整分割线粗细、颜色，适配不同图片预览需求✅ 独立节点布局：方向与比例控件同行展示，节省垂直空间

安装方法

方法 1：手动安装（推荐）

git clone https://github.com/shmbatom/Comfyui-ImageAB-Compare.git


重启 ComfyUI 服务


方法 2：通过管理器安装

支持 ComfyUI Manager 的用户可直接在管理器中搜索 Comfyui-ImageAB-Compare 安装（需先发布到管理器仓库）

使用教程

基础使用



在 ComfyUI 编辑器中，找到「🎨 ImageAB / 对比工具」分类下的「Image 图片 AB 对比」节点

连接需要对比的两张图片到 image1 和 image2 输入口

运行节点，即可在节点内看到实时对比预览：

鼠标移动：在预览区域拖动，分割线会跟随鼠标位置实时调整

切换方向：通过下拉框选择「vertical」（左右）/「horizontal」（上下）

精准调整：通过比例滑块（0.0-1.0）精确控制分割位置









导出对比图



将节点的「对比图」输出口连接到「Save Image」节点

运行整个工作流，即可导出带红色分割线的最终对比图（尺寸与 image1 保持一致）



参数说明

参数名类型默认值说明image1IMAGE-基准图片（对比图尺寸以此图片为准）image2IMAGE-对比图片（自动适配基准图片尺寸）split\_direction下拉框vertical分割方向：vertical（左右）/horizontal（上下）split\_ratio\_output滑块0.5分割比例：0.0-1.0（0.5 为居中分割）

自定义配置

调整分割线样式

修改 tupian\_duibi.js 中 onDrawForeground 方法的以下参数：javascript运行ctx.strokeStyle = "#00ff00"; // 分割线颜色（支持十六进制/RGB）

ctx.lineWidth = 1; // 分割线粗细（1为极细，2为中等，4为默认）



调整节点布局

修改 image\_ab\_compare.py 中 INPUT\_TYPES 的 UI 配置：python运行"width": "40%",  # 调整方向控件宽度占比

"width": "60%",  # 调整比例控件宽度占比

"spacing": "8px", # 调整控件间距



调整节点尺寸

修改 tupian\_duibi.js 中 initState 方法：javascript运行this.setSize(\[500, 450]); // \[宽度, 高度]，按需调整



常见问题解决

Q1：节点内无预览图



检查控制台（F12）是否有报错信息

确认图片已正确加载（临时目录是否生成 ab\_img1\_\*.png 和 ab\_img2\_\*.png）

重启 ComfyUI 并强制刷新浏览器（Ctrl+F5）



Q2：鼠标移动与分割线位置不匹配



确保使用最新版的 tupian\_duibi.js（已修复坐标适配问题）

检查图片是否为异常尺寸（如极长 / 极扁），插件已适配所有尺寸图片



Q3：方向切换后分割线不生效



确认方向切换后控制台输出 \[ImageABCompare] 方向强制切换为：xxx

检查是否有其他插件样式冲突，可暂时禁用其他自定义 CSS



Q4：控件未同行显示



确认使用 ComfyUI v0.1.2 + 版本（支持 container 布局）

备用方案：添加自定义 CSS（见安装方法 - 方案 2）



技术细节

核心逻辑



图片转换：通过 tensor2pil/pil2tensor 实现 Tensor 与 PIL 图片的双向转换

实时渲染：基于 Canvas 绘制，鼠标位置实时计算分割比例

参数同步：通过 isUpdating 锁机制避免鼠标与滑块联动死循环

尺寸适配：基于基准图片尺寸等比例缩放，保证预览与导出一致性



目录结构plaintextComfyUI/

├── custom\_nodes/

│   └── image\_ab\_compare.py       # 后端节点逻辑

├── custom/js/

│   └── tupian\_duibi.js           # 前端交互逻辑

└── custom/css/

    └── custom.css                # 自定义样式（可选）



兼容性



ComfyUI 版本：v0.1.2+（推荐最新版）

浏览器：Chrome/Firefox/Edge（不建议使用 Safari）

系统：Windows/macOS/Linux



更新日志

v1.0.0

初始版本，支持基础的图片 AB 对比功能



许可证

本插件采用 MIT 许可证开源，可自由修改、分发和商用，保留原作者信息即可。

反馈与建议

如遇问题或有功能建议，可通过以下方式反馈：



GitHub Issues（推荐）

提交 PR 参与功能改进

技术交流群（如有）



捐赠

如果觉得本工具还不错，你可以捐赠我一杯咖啡。

![捐赠图](https://github.com/shmbatom/Comfyui-ImageAB-Compare/blob/main/images/donate.png)

 



[def]: images/donate.png
