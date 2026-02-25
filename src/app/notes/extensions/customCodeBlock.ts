import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
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

// Auto-closing bracket pairs
const BRACKETS: Record<string, string> = {
  "(": ")",
  "{": "}",
  "[": "]",
  '"': '"',
  "'": "'",
  "`": "`",
};

const CLOSING_BRACKETS = new Set(Object.values(BRACKETS));

const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },

  addProseMirrorPlugins() {
    const parentPlugins = this.parent?.() || [];

    const codeBlockPlugin = new Plugin({
      key: new PluginKey("codeBlockBrackets"),
      props: {
        handleKeyDown: (view, event) => {
          const { state } = view;
          const { selection } = state;
          const { $from } = selection;

          // Check if we're inside a code block
          if ($from.parent.type.name !== "codeBlock") {
            return false;
          }

          const pos = $from.pos;
          const parentOffset = $from.parentOffset;
          const text = $from.parent.textContent;

          // ─── Auto-close brackets ───────────────────────
          if (BRACKETS[event.key]) {
            const closing = BRACKETS[event.key];
            const isQuote =
              event.key === '"' || event.key === "'" || event.key === "`";

            // For quotes, if the next char is the same quote, just move past it
            if (
              isQuote &&
              parentOffset < text.length &&
              text[parentOffset] === event.key
            ) {
              event.preventDefault();
              const tr = state.tr.setSelection(
                TextSelection.create(state.doc, pos + 1),
              );
              view.dispatch(tr);
              return true;
            }

            event.preventDefault();
            const insert = event.key + closing;
            const tr = state.tr.insertText(insert, pos, pos);
            // Place cursor between the pair
            tr.setSelection(TextSelection.create(tr.doc, pos + 1));
            view.dispatch(tr);
            return true;
          }

          // ─── Skip over closing brackets ────────────────
          if (CLOSING_BRACKETS.has(event.key)) {
            if (
              parentOffset < text.length &&
              text[parentOffset] === event.key
            ) {
              event.preventDefault();
              const tr = state.tr.setSelection(
                TextSelection.create(state.doc, pos + 1),
              );
              view.dispatch(tr);
              return true;
            }
          }

          // ─── Smart Enter: expand {} ────────────────────
          if (event.key === "Enter") {
            const charBefore = parentOffset > 0 ? text[parentOffset - 1] : "";
            const charAfter =
              parentOffset < text.length ? text[parentOffset] : "";

            // If cursor is between { and }
            if (charBefore === "{" && charAfter === "}") {
              event.preventDefault();
              // Get current line's indentation
              const lineStart = text.lastIndexOf("\n", parentOffset - 1);
              const currentLine = text.substring(lineStart + 1, parentOffset);
              const leadingSpaces = currentLine.match(/^\s*/)?.[0] || "";
              const indent = leadingSpaces + "    ";

              const insert = "\n" + indent + "\n" + leadingSpaces;
              const tr = state.tr.insertText(insert, pos, pos);
              // Place cursor at end of the indented middle line
              tr.setSelection(
                TextSelection.create(tr.doc, pos + 1 + indent.length),
              );
              view.dispatch(tr);
              return true;
            }

            // If cursor is between ( and )
            if (charBefore === "(" && charAfter === ")") {
              event.preventDefault();
              const lineStart = text.lastIndexOf("\n", parentOffset - 1);
              const currentLine = text.substring(lineStart + 1, parentOffset);
              const leadingSpaces = currentLine.match(/^\s*/)?.[0] || "";
              const indent = leadingSpaces + "    ";

              const insert = "\n" + indent + "\n" + leadingSpaces;
              const tr = state.tr.insertText(insert, pos, pos);
              tr.setSelection(
                TextSelection.create(tr.doc, pos + 1 + indent.length),
              );
              view.dispatch(tr);
              return true;
            }

            // ─── Auto-indent after { at end of line ──────
            if (charBefore === "{") {
              event.preventDefault();
              const lineStart = text.lastIndexOf("\n", parentOffset - 1);
              const currentLine = text.substring(lineStart + 1, parentOffset);
              const leadingSpaces = currentLine.match(/^\s*/)?.[0] || "";
              const indent = leadingSpaces + "    ";

              const insert = "\n" + indent;
              const tr = state.tr.insertText(insert, pos, pos);
              tr.setSelection(
                TextSelection.create(tr.doc, pos + insert.length),
              );
              view.dispatch(tr);
              return true;
            }

            // ─── Regular Enter: maintain indentation ─────
            event.preventDefault();
            const lineStart = text.lastIndexOf("\n", parentOffset - 1);
            const currentLine = text.substring(lineStart + 1, parentOffset);
            const leadingSpaces = currentLine.match(/^\s*/)?.[0] || "";

            const insert = "\n" + leadingSpaces;
            const tr = state.tr.insertText(insert, pos, pos);
            tr.setSelection(TextSelection.create(tr.doc, pos + insert.length));
            view.dispatch(tr);
            return true;
          }

          // ─── Tab key: insert 4 spaces ──────────────────
          if (event.key === "Tab") {
            event.preventDefault();
            if (event.shiftKey) {
              // Outdent: remove up to 4 leading spaces from current line
              const lineStart = text.lastIndexOf("\n", parentOffset - 1);
              const lineContent = text.substring(lineStart + 1);
              const spaces = lineContent.match(/^ {1,4}/)?.[0];
              if (spaces) {
                const deleteFrom = $from.start() + lineStart + 1;
                const tr = state.tr.delete(
                  deleteFrom,
                  deleteFrom + spaces.length,
                );
                view.dispatch(tr);
              }
            } else {
              const tr = state.tr.insertText("    ", pos, pos);
              view.dispatch(tr);
            }
            return true;
          }

          // ─── Backspace: delete bracket pairs ───────────
          if (event.key === "Backspace") {
            if (parentOffset > 0 && parentOffset < text.length) {
              const before = text[parentOffset - 1];
              const after = text[parentOffset];
              if (BRACKETS[before] && BRACKETS[before] === after) {
                event.preventDefault();
                const tr = state.tr.delete(pos - 1, pos + 1);
                view.dispatch(tr);
                return true;
              }
            }
          }

          return false;
        },
      },
    });

    return [...parentPlugins, codeBlockPlugin];
  },
}).configure({
  lowlight,
  defaultLanguage: "cpp",
});

export default CustomCodeBlock;
export { lowlight };
