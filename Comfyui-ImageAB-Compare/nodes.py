import torch
import numpy as np
from PIL import Image, ImageDraw
import folder_paths
import os
import uuid


def tensor2pil(image):
    """将 torch tensor 转换为 PIL Image"""
    if len(image.shape) == 4:
        image = image[0]
    image_np = image.cpu().numpy()
    if image_np.dtype != np.uint8:
        if image_np.max() <= 1.0:
            image_np = (image_np * 255).astype(np.uint8)
        else:
            image_np = np.clip(image_np, 0, 255).astype(np.uint8)
    if len(image_np.shape) == 3 and image_np.shape[2] == 1:
        image_np = image_np.squeeze(2)
    return Image.fromarray(image_np)


def pil2tensor(image):
    """将 PIL Image 转换为 torch tensor"""
    return torch.from_numpy(np.array(image).astype(np.float32) / 255.0).unsqueeze(0)


class ImageABCompare:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "ImageA": ("IMAGE",),
                "ImageB": ("IMAGE",),
                "split_direction": (["vertical", "horizontal"], {"default": "vertical"}),  # 左右/上下
                "split_ratio_when_output": ("FLOAT", {"default": 0.5, "min": 0.0, "max": 1.0, "step": 0.01}),  # 分割比例
            }
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("Image_output",)
    FUNCTION = "compare_images"
    CATEGORY = "🎨 图形比比看--ImageABCompareSee"
    OUTPUT_NODE = True

    def compare_images(self, ImageA, ImageB, split_direction="vertical", split_ratio_when_output=0.5):
        print(f"[ImageABCompare] 生成导出用对比图 - 方向: {split_direction}, 比例: {split_ratio_when_output}")

        # 转换图片（以image1尺寸为基准）
        img1 = tensor2pil(ImageA)
        img2 = tensor2pil(ImageB)
        base_w, base_h = img1.size  # 以图1尺寸为最终保存尺寸
        print(f"[ImageABCompare] 基准尺寸（图1）: {base_w}x{base_h}，图2原始尺寸: {img2.size}")

        # 保存原始图片到临时目录（供前端加载实时预览）
        unique_id = str(uuid.uuid4())[:8]
        img1_filename = f"ab_img1_{unique_id}.png"
        img2_filename = f"ab_img2_{unique_id}.png"
        output_dir = folder_paths.get_temp_directory()
        img1.save(os.path.join(output_dir, img1_filename), format="PNG")
        img2.save(os.path.join(output_dir, img2_filename), format="PNG")

        # 按规则调整图2尺寸（用于导出）
        if split_direction == "vertical":
            img2_resized = img2.resize((base_w, base_h), Image.Resampling.LANCZOS)
        else:
            img2_resized = img2.resize((base_w, base_h), Image.Resampling.LANCZOS)

        # 创建最终对比图画布（用于导出）
        result_img = Image.new("RGB", (base_w, base_h))
        draw = ImageDraw.Draw(result_img)

        # 绘制对比图（用于导出）
        if split_direction == "vertical":
            split_x = int(base_w * split_ratio_when_output)
            result_img.paste(img1.crop((0, 0, split_x, base_h)), (0, 0))
            result_img.paste(img2_resized.crop((split_x, 0, base_w, base_h)), (split_x, 0))
            draw.line([(split_x, 0), (split_x, base_h)], fill=(255, 0, 0), width=3)
        else:
            split_y = int(base_h * split_ratio_when_output)
            result_img.paste(img1.crop((0, 0, base_w, split_y)), (0, 0))
            result_img.paste(img2_resized.crop((0, split_y, base_w, base_h)), (0, split_y))
            draw.line([(0, split_y), (base_w, split_y)], fill=(255, 0, 0), width=3)

        # 生成导出用tensor
        result_tensor = pil2tensor(result_img)

        # 返回前端需要的所有参数（含实时比例）
        return {
            "ui": {
                "images": [],  # 不显示后端生成的静态图，避免覆盖前端画布
                "img1_filename": [img1_filename],  # 前端加载图1用
                "img2_filename": [img2_filename],  # 前端加载图2用
                "split_direction": [split_direction],
                "split_ratio_when_output": [split_ratio_when_output],  # 实时返回滑块值
                "base_size": [base_w, base_h]
            },
            "result": (result_tensor,)  # 输出tensor可连接保存图像节点
        }

NODE_CLASS_MAPPINGS = {
    "ImageABCompare": ImageABCompare
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "ImageABCompare": "图形比比看--ImageABCompareSee"
}

if __name__ == "__main__":
    print("=== 节点注册验证 ===")
    print("注册的节点类:", NODE_CLASS_MAPPINGS.keys())
    print("显示名称映射:", NODE_DISPLAY_NAME_MAPPINGS)

    try:
        node = ImageABCompare()
        print("✅ 节点类实例化成功")
        print("输入类型:", node.INPUT_TYPES())
    except Exception as e:
        print("❌ 节点类实例化失败:", str(e))