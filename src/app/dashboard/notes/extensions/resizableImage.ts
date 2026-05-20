import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResizableImageComponent from "./ResizableImageComponent";

const ResizableImage = Image.extend({
  inline: false,
  group: "block",

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        renderHTML: (attributes) => ({
          width: attributes.width,
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
        renderHTML: (attributes) => {
          const isCentered = attributes.alignment === "center";
          if (!isCentered) {
            return {
              "data-alignment": attributes.alignment,
              style: `display: inline-block; vertical-align: top; float: ${attributes.alignment}; clear: none; margin: 6px 12px; width: ${attributes.width || "100%"}; max-width: 100%; height: auto;`,
            };
          }
          return {
            "data-alignment": attributes.alignment,
            style: `display: block; float: none; clear: both; margin-left: auto; margin-right: auto; width: ${attributes.width || "100%"}; max-width: 100%; height: auto;`,
          };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

export default ResizableImage;
