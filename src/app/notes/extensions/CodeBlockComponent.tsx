"use client";

import {
  NodeViewWrapper,
  NodeViewContent,
  ReactNodeViewProps,
} from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, Wand2, Copy, Check } from "lucide-react";

const SUPPORTED_LANGUAGES = [
  { id: "cpp", label: "C++", aliases: ["c++", "cpp"] },
  { id: "c", label: "C", aliases: ["c"] },
  { id: "java", label: "Java", aliases: ["java"] },
  { id: "python", label: "Python", aliases: ["python", "py"] },
] as const;

// Simple formatters for each language
function formatCode(code: string, language: string): string {
  switch (language) {
    case "cpp":
    case "c":
      return formatCStyle(code);
    case "java":
      return formatCStyle(code);
    case "python":
      return formatPython(code);
    default:
      return code;
  }
}

// ── Per-line formatter for C-style languages ────────────────────────
function formatCLine(line: string): string {
  // 1. Protect string & char literals
  const literals: string[] = [];
  let s = line.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (m) => {
    literals.push(m);
    return `\x01${literals.length - 1}\x01`;
  });

  // 2. Protect line comments
  let comment = "";
  const ci = s.indexOf("//");
  if (ci >= 0) {
    comment = s.slice(ci);
    s = s.slice(0, ci);
  }

  // 3. Normalize whitespace
  s = s.replace(/\s+/g, " ").trim();
  if (!s) return comment;

  // 3b. Fix broken ++ and -- (e.g. from previous bad formatting: i + + → i++)
  s = s.replace(/\+\s+\+/g, "++");
  s = s.replace(/-\s+-/g, "--");

  // 4. Protect multi-char tokens that must never be split
  s = s.replace(/\+\+/g, "\x02PP\x02");
  s = s.replace(/--/g, "\x02MM\x02");
  s = s.replace(/->/g, "\x02AR\x02");
  s = s.replace(/::/g, "\x02SC\x02");
  s = s.replace(/<</g, "\x02LS\x02");
  s = s.replace(/>>/g, "\x02RS\x02");

  // 5. Space around compound operators
  s = s.replace(
    /\s*(==|!=|<=|>=|&&|\|\||\+=|-=|\*=|\/=|%=|&=|\|=|\^=)\s*/g,
    " $1 ",
  );

  // 6. Space around << and >> (stream / shift)
  s = s.replace(/\s*\x02LS\x02\s*/g, " << ");
  s = s.replace(/\s*\x02RS\x02\s*/g, " >> ");

  // 7. Single = (not part of ==, !=, <=, >=, += …)
  s = s.replace(/(?<![=!<>+\-*\/%&|^])=(?!=)/g, " = ");

  // 8. Pointer / reference: keep * or & attached to the type
  s = s.replace(
    /\b(int|char|float|double|long|short|void|bool|string|auto|unsigned|signed|size_t|vector|map|set|list|array|pair|tuple|shared_ptr|unique_ptr|weak_ptr|FILE|wchar_t)\s*([*&]+)\s*/g,
    "$1$2 ",
  );

  // 9. Binary + and - (between value-like tokens)
  s = s.replace(/(\w|\)|\])\s*\+\s*(\w|\(|\x01)/g, "$1 + $2");
  s = s.replace(/(\w|\)|\])\s*-\s*(\w|\(|\x01)/g, "$1 - $2");

  // 10. Commas: space after, none before
  s = s.replace(/\s*,\s*/g, ", ");

  // 11. Semicolons: no space before; space after (except at end of line)
  s = s.replace(/\s*;/g, ";");
  s = s.replace(/;(?!\s*$)/g, "; ");

  // 12. Braces on same line
  s = s.replace(/\)\s*\{/g, ") {");
  s = s.replace(/\belse\s*\{/g, "else {");

  // 13. Space after control-flow keywords before (
  s = s.replace(/\b(if|for|while|switch|catch)\s*\(/g, "$1 (");

  // 14. Space after certain keywords (return x;  new Foo; etc.)
  s = s.replace(
    /\b(return|case|throw|delete|new|sizeof|typeof|class|struct|public|private|protected|virtual|override|const|static|template|typename|namespace|using)\b(?!\s|;|\(|:)/g,
    "$1 ",
  );

  // 15. #include / #define: tidy up
  s = s.replace(/^#\s*(include|define|ifdef|ifndef|endif|pragma)\s*/g, "#$1 ");

  // 16. Clean up multiple spaces
  s = s.replace(/\s+/g, " ").trim();

  // 17. Restore protected tokens
  s = s.replace(/\x02PP\x02/g, "++");
  s = s.replace(/\x02MM\x02/g, "--");
  s = s.replace(/\x02AR\x02/g, "->");
  s = s.replace(/\x02SC\x02/g, "::");

  // 18. Post-restore cleanup: attach ++ / -- to their operand, tighten parens
  s = s.replace(/(\w)\s+(\+\+|--)/g, "$1$2");
  s = s.replace(/(\+\+|--)\s+(\w)/g, "$1$2");
  s = s.replace(/\(\s+/g, "(");
  s = s.replace(/\s+\)/g, ")");

  // 19. Restore string / char literals
  s = s.replace(/\x01(\d+)\x01/g, (_, idx) => literals[parseInt(idx)]);

  // 20. Final space cleanup
  s = s.replace(/\s+/g, " ").trim();

  // 21. Append comment
  if (comment) {
    s = s ? s + " " + comment : comment;
  }

  return s;
}

function formatCStyle(code: string): string {
  let indentLevel = 0;
  const indentStr = "    ";
  const lines = code.split("\n");
  const formatted: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      if (formatted.length > 0 && formatted[formatted.length - 1] !== "") {
        formatted.push("");
      }
      continue;
    }

    // Decrease indent for closing braces
    if (line.startsWith("}") || line.startsWith(");")) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    line = formatCLine(line);

    formatted.push(indentStr.repeat(indentLevel) + line);

    // Increase indent after opening braces
    if (line.endsWith("{")) {
      indentLevel++;
    }
  }

  let result = formatted.join("\n");
  if (!result.endsWith("\n")) result += "\n";
  return result;
}

function formatPython(code: string): string {
  const lines = code.split("\n");
  const formatted: string[] = [];
  let indentLevel = 0;
  const indentStr = "    ";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (formatted.length > 0 && formatted[formatted.length - 1] !== "") {
        formatted.push("");
      }
      continue;
    }

    // Decrease indent for dedent keywords
    if (
      line.startsWith("elif ") ||
      line.startsWith("else:") ||
      line.startsWith("except") ||
      line.startsWith("finally:") ||
      line.startsWith("return") ||
      line.startsWith("break") ||
      line.startsWith("continue") ||
      line.startsWith("pass")
    ) {
      // Only dedent for elif/else/except/finally
      if (
        line.startsWith("elif ") ||
        line.startsWith("else:") ||
        line.startsWith("except") ||
        line.startsWith("finally:")
      ) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
    }

    // Add spacing around operators
    let formatted_line = line
      .replace(
        /\s*(==|!=|<=|>=|<<|>>|\+=|-=|\*=|\/=|%=|\/\/=|\*\*=)\s*/g,
        " $1 ",
      )
      .replace(/\s*,\s*/g, ", ")
      .replace(/\s+/g, " ")
      .trim();

    // Add space after keywords
    formatted_line = formatted_line.replace(
      /\b(if|elif|else|for|while|def|class|return|import|from|as|with|try|except|finally|raise|yield|lambda|in|not|and|or|is|del|global|nonlocal|assert|pass|break|continue)\b(?!\s|:|\()/g,
      "$1 ",
    );

    formatted.push(indentStr.repeat(indentLevel) + formatted_line);

    // Increase indent after colon
    if (line.endsWith(":")) {
      indentLevel++;
    }
  }

  let result = formatted.join("\n");
  if (!result.endsWith("\n")) result += "\n";
  return result;
}

export default function CodeBlockComponent({
  node,
  updateAttributes,
  editor,
  getPos,
}: ReactNodeViewProps) {
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formattedFlag, setFormattedFlag] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const language = (node.attrs.language as string) || "cpp";
  const currentLang =
    SUPPORTED_LANGUAGES.find(
      (l) =>
        l.id === language ||
        (l.aliases as readonly string[]).includes(language),
    ) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [node.textContent]);

  const handleFormat = useCallback(() => {
    if (!editor.isEditable) return;
    const code = node.textContent;
    const formattedCode = formatCode(code, language);

    const view = editor.view;
    if (!view) return;

    const pos = typeof getPos === "function" ? getPos() : undefined;
    if (pos == null) return;
    const { state } = view;
    const nodeAt = state.doc.nodeAt(pos);
    if (!nodeAt) return;

    // Save cursor offset relative to the code block start
    const blockStart = pos + 1;
    const cursorOffset = Math.max(0, state.selection.$from.pos - blockStart);

    const tr = state.tr.replaceWith(
      blockStart,
      pos + nodeAt.nodeSize - 1,
      state.schema.text(formattedCode),
    );

    // Restore cursor: clamp to new text length
    const newOffset = Math.min(cursorOffset, formattedCode.length);
    tr.setSelection(TextSelection.create(tr.doc, blockStart + newOffset));
    view.dispatch(tr);

    // Re-focus the editor so the cursor is visible
    view.focus();

    setFormattedFlag(true);
    setTimeout(() => setFormattedFlag(false), 1500);
  }, [editor, node.textContent, language, getPos]);

  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div className="code-block-container">
        {/* Floating toolbar (appears on hover, right side) */}
        <div className="code-block-header">
          {/* Language selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowLangDropdown((s) => !s)}
              className="code-block-lang-btn"
            >
              <span>{currentLang.label}</span>
              <ChevronDown size={10} />
            </button>
            {showLangDropdown && (
              <div className="code-block-lang-dropdown">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      updateAttributes({ language: lang.id });
                      setShowLangDropdown(false);
                    }}
                    className={`code-block-lang-option ${
                      language === lang.id ? "active" : ""
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Format button */}
          {editor.isEditable && (
            <button
              onClick={handleFormat}
              className="code-block-action-btn"
              title="Format code"
            >
              {formattedFlag ? (
                <Check size={13} className="text-green-400" />
              ) : (
                <Wand2 size={13} />
              )}
            </button>
          )}
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="code-block-action-btn"
            title="Copy code"
          >
            {copied ? (
              <Check size={13} className="text-green-400" />
            ) : (
              <Copy size={13} />
            )}
          </button>
        </div>

        {/* Code content */}
        <pre className="code-block-pre">
          <NodeViewContent as="div" className="code-block-code" />
        </pre>
      </div>
    </NodeViewWrapper>
  );
}
