import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import CodeBlockComponent from "./CodeBlockComponent";

// Import specific language grammars we want to support
import cpp from "highlight.js/lib/languages/cpp";
import c from "highlight.js/lib/languages/c";
import java from "highlight.js/lib/languages/java";
import python from "highlight.js/lib/languages/python";

// Create lowlight instance with our languages
const lowlight = createLowlight(common);
lowlight.register("cpp", cpp);
lowlight.register("c", c);
lowlight.register("java", java);
lowlight.register("python", python);

const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
}).configure({
  lowlight,
  defaultLanguage: "cpp",
});

export default CustomCodeBlock;
export { lowlight };
