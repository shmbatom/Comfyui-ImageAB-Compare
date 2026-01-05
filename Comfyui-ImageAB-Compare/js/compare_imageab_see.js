// js/compare_imageab_see.js
import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

console.log("✅ [ImageABCompare] V1.0 QQ:2540968810");

app.registerExtension({
    name: "Comfy.ImageABCompare",

    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType.comfyClass !== "ImageABCompare") return;

        // 初始化核心状态
        nodeType.prototype.initState = function () {
            this.imgA = null;
            this.imgB = null;
            this.pointerOverPos = [0, 0];
            this.isPointerOver = false;
            this.splitRatio = 0.5;
            this.splitDirection = "vertical"; // 默认左右
            this.setSize([500, 550]);
            this.imagesLoaded = false;
            this.baseSize = [0, 0]; // 缓存图1基准尺寸
        };

        // 精准绑定方向控件
        nodeType.prototype.bindDirectionControl = function () {
            const nodeEl = document.querySelector(`[data-node-id="${this.id}"]`);
            if (!nodeEl) return;

            // 精准匹配split_direction控件
            const directionWidget = nodeEl.querySelector('.widget[data-name="split_direction"]');
            if (!directionWidget) return;
            const directionSelect = directionWidget.querySelector('select');
            if (!directionSelect) return;

            // 强制同步当前方向值
            directionSelect.value = this.splitDirection;

            // 方向切换核心逻辑（强制刷新所有状态）
            directionSelect.addEventListener("change", (e) => {
                // 1. 强制更新方向
                this.splitDirection = e.target.value;
                // 2. 重置比例为中间值
                this.splitRatio = 0.5;
                // 3. 强制清空图片缓存（重新渲染）
                this.imagesLoaded = false;
                // 4. 强制触发重绘
                this.setDirtyCanvas(true, true);
                app.canvas.draw(true);
                
                console.log(`[ImageABCompare] 方向强制切换为：${this.splitDirection}`);
            });

            // 监听节点参数更新，强制同步
            this.on("paramsUpdated", () => {
                if (directionSelect.value !== this.splitDirection) {
                    this.splitDirection = directionSelect.value;
                    this.splitRatio = 0.5;
                    this.setDirtyCanvas(true, true);
                }
            });
        };

        // 鼠标进入
        nodeType.prototype.onMouseEnter = function () {
            this.isPointerOver = true;
            this.setDirtyCanvas(true, true);
        };

        // 鼠标离开
        nodeType.prototype.onMouseLeave = function () {
            this.isPointerOver = false;
            this.setDirtyCanvas(true, true);
        };

        // 鼠标移动（核心修复：按方向重新计算比例）
        nodeType.prototype.onMouseMove = function (e, pos) {
            if (!this.imgA || !this.imgB) return;

            const [nodeW, nodeH] = this.size;
            const margin = 10;
            const widgetAreaHeight = 111;
    
            // 绘制区域
            const drawArea = {
                x: margin,
                y: widgetAreaHeight,
                width: nodeW - margin * 2,
                height: nodeH - widgetAreaHeight - margin
            };

            // 计算图片渲染参数（与绘制逻辑保持一致）
            const [baseW, baseH] = this.baseSize;
            const scaleW = drawArea.width / baseW;
            const scaleH = drawArea.height / baseH;
            const scale = Math.min(scaleW, scaleH);
            const renderW = baseW * scale;
            const renderH = baseH * scale;
            const renderX = drawArea.x + (drawArea.width - renderW) / 2; // 图片居中X坐标
            const renderY = drawArea.y + (drawArea.height - renderH) / 2; // 图片居中Y坐标

            // 计算鼠标在图片渲染区域内的相对坐标（关键修复）
            const imgRelX = Math.max(0, Math.min(pos[0] - renderX, renderW)); // 相对于图片左边缘的X
            const imgRelY = Math.max(0, Math.min(pos[1] - renderY, renderH)); // 相对于图片上边缘的Y

            // 基于图片实际渲染尺寸计算比例（而非节点绘制区域）
            if (this.splitDirection === "vertical") {
                this.splitRatio = imgRelX / renderW; // 左右分割：使用图片宽度计算
            } else {
                this.splitRatio = imgRelY / renderH; // 上下分割：使用图片高度计算
            }
            this.splitRatio = Math.max(0, Math.min(this.splitRatio, 1));

            this.pointerOverPos = [imgRelX, imgRelY];
            this.setDirtyCanvas(true, true);
        };      

        // 加载图片（核心修复：同步后端方向+基准尺寸）
        nodeType.prototype.onExecuted = async function (output) {
            try {
                const img1Name = output?.img1_filename?.[0];
                const img2Name = output?.img2_filename?.[0];
                if (!img1Name || !img2Name) return;

                // 加载图片
                const loadImg = (name) => new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(null);
                    img.src = `/view?filename=${encodeURIComponent(name)}&type=temp&subfolder=&t=${Date.now()}`;
                });

                // 加载图1和图2
                const [imgA, imgB] = await Promise.all([loadImg(img1Name), loadImg(img2Name)]);
                if (!imgA || !imgB) return;

                // 1. 缓存图片和基准尺寸（图1尺寸）
                this.imgA = imgA;
                this.imgB = imgB;
                this.baseSize = [imgA.width, imgA.height]; // 图1基准尺寸
                // 2. 强制同步后端方向（核心：覆盖前端默认值）
                this.splitDirection = output?.split_direction?.[0] || "vertical";
                // 3. 重置比例
                this.splitRatio = output?.split_ratio?.[0] || 0.5;
                // 4. 标记加载完成
                this.imagesLoaded = true;

                console.log(`[ImageABCompare] 图片加载完成 - 后端方向：${this.splitDirection}，图1尺寸：${this.baseSize[0]}x${this.baseSize[1]}`);
                
                // 强制触发重绘
                this.setDirtyCanvas(true, true);
                app.canvas.draw(true);
            } catch (err) {
                console.error("[ImageABCompare] 图片加载失败：", err);
            }
        };

        // 绘制逻辑（核心修复：上下分割裁剪+适配图1尺寸）
        nodeType.prototype.onDrawForeground = function (ctx) {
            const [nodeW, nodeH] = this.size;
            const margin = 10;
            const widgetAreaHeight = 111;
            const drawArea = {
                x: margin,
                y: widgetAreaHeight,
                width: nodeW - margin * 2,
                height: nodeH - widgetAreaHeight - margin
            };

            // 绘制背景（区分方向）
            ctx.fillStyle = this.splitDirection === "vertical" ? "#222" : "#111";
            ctx.fillRect(drawArea.x, drawArea.y, drawArea.width, drawArea.height);

            // 无图片提示
            if (!this.imgA || !this.imgB) {
                ctx.fillStyle = "#666";
                ctx.font = "9px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("支持左右 / 上下分割对比查看、移动鼠标实时调整分割比例", drawArea.x + drawArea.width/2, drawArea.y + drawArea.height/2 - 130);
                ctx.fillText("Supports left-right/top-bottom split comparison view, ", drawArea.x + drawArea.width/2, drawArea.y + drawArea.height/2 - 118);
                ctx.fillText("and real-time adjustment of split ratio by moving the mouse", drawArea.x + drawArea.width/2, drawArea.y + drawArea.height/2 - 106);
                ctx.fillText("可导出带精准分割线的对比图。", drawArea.x + drawArea.width/2, drawArea.y + drawArea.height/2 - 80);
                ctx.fillText("A comparison chart with precise segmentation lines can be exported.", drawArea.x + drawArea.width/2, drawArea.y + drawArea.height/2 - 68);
                ctx.fillText("输入两张图片按不同分割比例并列查看", drawArea.x + drawArea.width/2, drawArea.y + drawArea.height/2 - 50);
                ctx.fillText("Input two images and view them side by side at different split ratios", drawArea.x + drawArea.width/2, drawArea.y + drawArea.height/2 - 38);
                ctx.fillText(`当前模式：${this.splitDirection === "vertical" ? "左右分割" : "上下分割"}`, drawArea.x + drawArea.width/2, drawArea.y + drawArea.height/2 - 17);
                ctx.fillText(`Current Mode: ${this.splitDirection === "vertical" ? "left-right" : "top-bottom"}`, drawArea.x + drawArea.width/2, drawArea.y + drawArea.height/2 - 5);
                ctx.fillText("改变分割方向后，应重新运行至本节点", drawArea.x + drawArea.width/2, drawArea.y + drawArea.height - 50);
                ctx.fillText("You should rerun the process up to this node", drawArea.x + drawArea.width/2, drawArea.y + drawArea.height - 40);
                ctx.fillText("after changing the segmentation direction", drawArea.x + drawArea.width/2, drawArea.y + drawArea.height - 30);
                return;
            }


            // 核心：基于图1尺寸适配渲染（保证导出和预览尺寸一致）
            const [baseW, baseH] = this.baseSize;
            // 计算渲染缩放比例（适配节点画布）
            const scaleW = drawArea.width / baseW;
            const scaleH = drawArea.height / baseH;
            const scale = Math.min(scaleW, scaleH); // 等比例缩放
            const renderW = baseW * scale;
            const renderH = baseH * scale;
            // 居中渲染
            const renderX = drawArea.x + (drawArea.width - renderW) / 2;
            const renderY = drawArea.y + (drawArea.height - renderH) / 2;

            // 绘制图B（背景）
            ctx.drawImage(this.imgB, renderX, renderY, renderW, renderH);

            // 绘制图A（前景，核心修复裁剪逻辑）
            ctx.save();
            if (this.splitDirection === "vertical") {
                // 左右分割：裁剪X轴（宽度比例）
                const clipWidth = renderW * this.splitRatio;
                ctx.rect(renderX, renderY, clipWidth, renderH);
            } else {
                // 上下分割：裁剪Y轴（高度比例，强制生效）
                const clipHeight = renderH * this.splitRatio;
                ctx.rect(renderX, renderY, renderW, clipHeight);
            }
            ctx.clip();
            ctx.drawImage(this.imgA, renderX, renderY, renderW, renderH);
            ctx.restore();

            // 绘制分割线（区分方向）
            ctx.strokeStyle = this.splitDirection === "vertical" ? "#f4f4f4" : "#f0f0f0";
            ctx.lineWidth = 1;
            if (this.splitDirection === "vertical") {
                const splitX = renderX + renderW * this.splitRatio;
                ctx.beginPath();
                ctx.moveTo(splitX, renderY);
                ctx.lineTo(splitX, renderY + renderH);
            } else {
                const splitY = renderY + renderH * this.splitRatio;
                ctx.beginPath();
                ctx.moveTo(renderX, splitY);
                ctx.lineTo(renderX + renderW, splitY);
            }
            ctx.stroke();

            // 绘制标签（区分方向）
            ctx.fillStyle = "rgba(0,0,0,0.4)";
            if (this.splitDirection === "vertical") {
                ctx.fillRect(renderX + 8, renderY + 10, 16, 16);
                ctx.fillRect(renderX + renderW - 23, renderY + 10, 16, 16);
                ctx.fillStyle = "#f4f4f4";
                ctx.font = "10px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("A", renderX + 16, renderY + 19);
                ctx.fillText("B", renderX + renderW - 15, renderY + 19);
            } else {
                ctx.fillRect(renderX + renderW - 23, renderY + 10, 16, 16);
                ctx.fillRect(renderX + renderW - 23, renderY + renderH - 35, 16, 16);
                ctx.fillStyle = "#f0f0f0";
                ctx.font = "10px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("A", renderX + renderW - 15, renderY + 19);
                ctx.fillText("B", renderX + renderW - 15, renderY + renderH - 26);
            }

            // 绘制调试信息
            ctx.fillStyle = "#fff";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "bottom";
            ctx.fillText(`方向：${this.splitDirection} | 比例：${this.splitRatio.toFixed(2)} | 图1尺寸：${baseW}x${baseH}`, 
                          drawArea.x + 10, drawArea.y + drawArea.height - 10);
        };

        // 隐藏后端默认图
        nodeType.prototype.onDrawBackground = function (ctx) {};
    },

    async nodeCreated(node) {
        if (node.comfyClass === "ImageABCompare") {
            node.initState();
            // 立即绑定控件（缩短延迟）
            setTimeout(() => node.bindDirectionControl(), 100);
            setTimeout(() => node.bindDirectionControl(), 500);
        }
    },

    async setup() {
        console.log("✅ [ImageABCompare] 扩展初始化完成 V1.0");
    }
});