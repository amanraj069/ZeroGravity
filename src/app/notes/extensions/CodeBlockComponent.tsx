"use client";

import {
  NodeViewWrapper,
  ReactNodeViewProps,
} from "@tiptap/react";
import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, Copy, Check, Wand2 } from "lucide-react";
import Editor from "@monaco-editor/react";

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
  const literals: string[] = [];
  let s = line.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (m) => {
    literals.push(m);
    return `\x01${literals.length - 1}\x01`;
  });

  let comment = "";
  const ci = s.indexOf("//");
  if (ci >= 0) {
    comment = s.slice(ci);
    s = s.slice(0, ci);
  }

  s = s.replace(/\s+/g, " ").trim();
  if (!s) return comment;

  s = s.replace(/\+\s+\+/g, "++");
  s = s.replace(/-\s+-/g, "--");
  s = s.replace(/\+\+/g, "\x02PP\x02");
  s = s.replace(/--/g, "\x02MM\x02");
  s = s.replace(/->/g, "\x02AR\x02");
  s = s.replace(/::/g, "\x02SC\x02");
  s = s.replace(/<</g, "\x02LS\x02");
  s = s.replace(/>>/g, "\x02RS\x02");

  s = s.replace(/\s*(==|!=|<=|>=|&&|\|\||\+=|-=|\*=|\/=|%=|&=|\|=|\^=)\s*/g, " $1 ");
  s = s.replace(/\s*\x02LS\x02\s*/g, " << ");
  s = s.replace(/\s*\x02RS\x02\s*/g, " >> ");
  s = s.replace(/(?<![=!<>+\-*\/%&|^])=(?!=)/g, " = ");
  s = s.replace(/\b(int|char|float|double|long|short|void|bool|string|auto|unsigned|signed|size_t|vector|map|set|list|array|pair|tuple|shared_ptr|unique_ptr|weak_ptr|FILE|wchar_t)\s*([*&]+)\s*/g, "$1$2 ");
  s = s.replace(/(\w|\)|\])\s*\+\s*(\w|\(|\x01)/g, "$1 + $2");
  s = s.replace(/(\w|\)|\])\s*-\s*(\w|\(|\x01)/g, "$1 - $2");
  s = s.replace(/\s*,\s*/g, ", ");
  s = s.replace(/\s*;/g, ";");
  s = s.replace(/;(?!\s*$)/g, "; ");
  s = s.replace(/\)\s*\{/g, ") {");
  s = s.replace(/\belse\s*\{/g, "else {");
  s = s.replace(/\b(if|for|while|switch|catch)\s*\(/g, "$1 (");
  s = s.replace(/\b(return|case|throw|delete|new|sizeof|typeof|class|struct|public|private|protected|virtual|override|const|static|template|typename|namespace|using)\b(?!\s|;|\(|:)/g, "$1 ");
  s = s.replace(/^#\s*(include|define|ifdef|ifndef|endif|pragma)\s*/g, "#$1 ");
  s = s.replace(/\s+/g, " ").trim();

  s = s.replace(/\x02PP\x02/g, "++");
  s = s.replace(/\x02MM\x02/g, "--");
  s = s.replace(/\x02AR\x02/g, "->");
  s = s.replace(/\x02SC\x02/g, "::");
  s = s.replace(/(\w)\s+(\+\+|--)/g, "$1$2");
  s = s.replace(/(\+\+|--)\s+(\w)/g, "$1$2");
  s = s.replace(/\(\s+/g, "(");
  s = s.replace(/\s+\)/g, ")");
  s = s.replace(/\x01(\d+)\x01/g, (_, idx) => literals[parseInt(idx)]);
  s = s.replace(/\s+/g, " ").trim();

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
    if (line.startsWith("}") || line.startsWith(");")) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    line = formatCLine(line);
    formatted.push(indentStr.repeat(indentLevel) + line);
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
    if (line.startsWith("elif ") || line.startsWith("else:") || line.startsWith("except") || line.startsWith("finally:") || line.startsWith("return") || line.startsWith("break") || line.startsWith("continue") || line.startsWith("pass")) {
      if (line.startsWith("elif ") || line.startsWith("else:") || line.startsWith("except") || line.startsWith("finally:")) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
    }
    let formatted_line = line.replace(/\s*(==|!=|<=|>=|<<|>>|\+=|-=|\*=|\/=|%=|\/\/=|\*\*=)\s*/g, " $1 ").replace(/\s*,\s*/g, ", ").replace(/\s+/g, " ").trim();
    formatted_line = formatted_line.replace(/\b(if|elif|else|for|while|def|class|return|import|from|as|with|try|except|finally|raise|yield|lambda|in|not|and|or|is|del|global|nonlocal|assert|pass|break|continue)\b(?!\s|:|\()/g, "$1 ");
    formatted.push(indentStr.repeat(indentLevel) + formatted_line);
    if (line.endsWith(":")) {
      indentLevel++;
    }
  }

  let result = formatted.join("\n");
  if (!result.endsWith("\n")) result += "\n";
  return result;
}

const SUPPORTED_LANGUAGES = [
  { id: "cpp", label: "C++", aliases: ["c++", "cpp"] },
  { id: "c", label: "C", aliases: ["c"] },
  { id: "java", label: "Java", aliases: ["java"] },
  { id: "python", label: "Python", aliases: ["python", "py"] },
  { id: "javascript", label: "JavaScript", aliases: ["js", "javascript"] },
  { id: "typescript", label: "TypeScript", aliases: ["ts", "typescript"] },
] as const;

export default function CodeBlockComponent({
  node,
  updateAttributes,
  editor,
  getPos,
}: ReactNodeViewProps) {
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

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

  const handleEditorChange = (value: string | undefined) => {
    if (!editor.isEditable || value === undefined) return;

    const { state } = editor.view;
    const pos = typeof getPos === "function" ? getPos() : undefined;
    if (pos == null) return;

    const nodeSize = node.nodeSize;
    // We update the internal text of the codeBlock
    const tr = state.tr.replaceWith(
      pos + 1,
      pos + nodeSize - 1,
      value ? state.schema.text(value) : []
    );
    // Don't focus the TipTap editor back because the user is typing in Monaco
    editor.view.dispatch(tr);
  };

  // Prevent TipTap from stealing focus/events from Monaco
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
  };

  // Monaco's C++ language identifier is "cpp".
  const monacoLanguage = currentLang.id === "c" ? "cpp" : currentLang.id;

  // Auto-expanding height logic
  const [editorHeight, setEditorHeight] = useState(120); // default to ~5 lines

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorWillMount = (monaco: any) => {
    // Explicitly enable strict syntax and semantic validation for JS/TS
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    const updateHeight = () => {
      const contentHeight = editor.getContentHeight();
      // min ~5 lines (120px), max ~25 lines (500px)
      const newHeight = Math.min(500, Math.max(120, contentHeight));
      setEditorHeight(newHeight);
      editor.layout();
    };
    editor.onDidContentSizeChange(updateHeight);
    updateHeight();
  };

  const handleFormat = () => {
    if (!editor.isEditable) return;
    
    // JS/TS use Monaco's built in formatter
    if (monacoLanguage === "javascript" || monacoLanguage === "typescript") {
      editorRef.current?.getAction("editor.action.formatDocument")?.run();
      return;
    }

    // For other languages, use the custom format functions
    const code = node.textContent;
    const formattedCode = formatCode(code, language);
    handleEditorChange(formattedCode);
  };

  const [isFocused, setIsFocused] = useState(false);

  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div 
        className="code-block-container" 
        style={{ zIndex: isFocused || showLangDropdown ? 60 : 0 }}
        onKeyDown={stopPropagation}
        onPaste={stopPropagation}
        onCopy={stopPropagation}
        onCut={stopPropagation}
      >
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
              <Wand2 size={13} />
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

        {/* Code content using Monaco */}
        <div className="pt-2 pb-2 bg-[#1e1e1e] rounded-b-md">
          <Editor
            height={editorHeight}
            language={monacoLanguage}
            value={node.textContent}
            theme="vs-dark"
            onChange={handleEditorChange}
            beforeMount={handleEditorWillMount}
            onMount={(editor) => {
              handleEditorDidMount(editor);
              editor.onDidFocusEditorWidget(() => setIsFocused(true));
              editor.onDidBlurEditorWidget(() => setIsFocused(false));
            }}
            options={{
              readOnly: !editor.isEditable,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              fontFamily: 'var(--font-mono), "JetBrains Mono", "Fira Code", monospace',
              padding: { top: 16, bottom: 16 },
              formatOnPaste: true,
              automaticLayout: true,
              fixedOverflowWidgets: true,
            }}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
