import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResizableImageComponent from "./ResizableImageComponent";

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        renderHTML: (attributes) => ({
          width: attributes.width,
          style: `width: ${attributes.width}; max-width: 100%; height: auto;`,
        }),
      },
      height: {
        default: "auto",
        renderHTML: (attributes) => ({
          height: attributes.height,
        }),
      },
      uploading: {
        default: false,
        renderHTML: (attributes) => ({
          "data-uploading": attributes.uploading ? "true" : "false",
        }),
      },
      alignment: {
        default: "center",
        renderHTML: (attributes) => ({
          "data-alignment": attributes.alignment,
          style: `display: block; margin-left: ${
            attributes.alignment === "left"
              ? "0"
              : attributes.alignment === "right"
              ? "auto"
              : "auto"
          }; margin-right: ${
            attributes.alignment === "right"
              ? "0"
              : attributes.alignment === "left"
              ? "auto"
              : "auto"
          };`,
        }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

export default ResizableImage;
