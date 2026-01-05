# ComfyUI/custom_nodes/Comfyui-ImageAB-Compare/__init__.py

from .nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

# ComfyUI 前端资源位置
WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]

# 插件元信息（ComfyUI Manager识别用）
__version__ = "1.0.0"
__author__ = "李春林/leesir"
__description__ = "image split comparison horizontally/vertically, real-time mouse interaction to adjust split ratios, bidirectional linkage between slider and mouse, and the ability to export comparison images with precise split lines."
