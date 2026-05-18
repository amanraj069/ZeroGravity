"use client";

import { NodeViewWrapper, ReactNodeViewProps } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight, Trash2, Loader2 } from "lucide-react";

export default function ResizableImageComponent({
  node,
  updateAttributes,
  selected,
  deleteNode,
}: ReactNodeViewProps) {
  const [resizing, setResizing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { src, width, uploading, alignment = "center" } = node.attrs;

  // Toggle float toolbar on click/select
  useEffect(() => {
    setShowToolbar(selected);
  }, [selected]);


  // Resize handler using mouse events
  const handleResizeStart = (
    e: React.MouseEvent,
    direction: "nw" | "ne" | "sw" | "se"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!imageRef.current || !containerRef.current) return;

    setResizing(true);

    const startX = e.clientX;
    const startWidth = imageRef.current.getBoundingClientRect().width;
    const parentWidth = containerRef.current.parentElement?.getBoundingClientRect().width || 800;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newWidth = startWidth;

      if (direction === "se" || direction === "ne") {
        newWidth = startWidth + deltaX;
      } else {
        newWidth = startWidth - deltaX;
      }

      // Constrain width to 10% - 100% of parent width
      const minWidthPx = 80;
      const maxWidthPx = parentWidth;
      const cleanWidth = Math.max(minWidthPx, Math.min(maxWidthPx, newWidth));
      
      const percentWidth = `${((cleanWidth / parentWidth) * 100).toFixed(1)}%`;
      updateAttributes({ width: percentWidth });
    };

    const handleMouseUp = () => {
      setResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const setAlignment = (align: "left" | "center" | "right") => {
    updateAttributes({ alignment: align });
  };

  return (
    <NodeViewWrapper
      className={`relative my-6 select-none ${
        alignment === "left"
          ? "text-left"
          : alignment === "right"
          ? "text-right"
          : "text-center"
      }`}
      style={{
        display: "block",
      }}
    >
      <div
        ref={containerRef}
        className={`inline-block relative group max-w-full ${
          selected ? "ring-2 ring-blue-500 rounded-lg" : ""
        }`}
        style={{
          width: width || "100%",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={src}
          alt={node.attrs.alt || "Uploaded image"}
          className={`max-w-full h-auto rounded-lg transition-all ${
            uploading ? "blur-md brightness-75 select-none" : "cursor-pointer"
          } ${resizing ? "scale-[0.99] select-none pointer-events-none" : ""}`}
          style={{
            width: "100%",
          }}
        />

        {/* Uploading Overlay */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-lg text-white gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-300">
              Uploading image...
            </span>
          </div>
        )}

        {/* Resize Handles (Only show when selected and not uploading) */}
        {selected && !uploading && (
          <>
            <div
              className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white rounded shadow-sm cursor-nwse-resize z-20 hover:scale-125 transition-transform"
              onMouseDown={(e) => handleResizeStart(e, "nw")}
            />
            <div
              className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 border border-white rounded shadow-sm cursor-nesw-resize z-20 hover:scale-125 transition-transform"
              onMouseDown={(e) => handleResizeStart(e, "ne")}
            />
            <div
              className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white rounded shadow-sm cursor-nesw-resize z-20 hover:scale-125 transition-transform"
              onMouseDown={(e) => handleResizeStart(e, "sw")}
            />
            <div
              className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 border border-white rounded shadow-sm cursor-nwse-resize z-20 hover:scale-125 transition-transform"
              onMouseDown={(e) => handleResizeStart(e, "se")}
            />
          </>
        )}

        {/* Premium Google Docs Style Float Toolbar */}
        {showToolbar && !uploading && (
          <div
            className="absolute left-1/2 -bottom-12 -translate-x-1/2 flex items-center gap-1.5 bg-gray-900/95 dark:bg-black/95 backdrop-blur-md px-2 py-1.5 rounded-lg border border-gray-800 shadow-2xl z-30 select-none animate-in fade-in slide-in-from-bottom-2 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAlignment("left")}
              className={`p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ${
                alignment === "left" ? "text-blue-400 bg-gray-800" : ""
              }`}
              title="Align Left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => setAlignment("center")}
              className={`p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ${
                alignment === "center" ? "text-blue-400 bg-gray-800" : ""
              }`}
              title="Align Center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => setAlignment("right")}
              className={`p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ${
                alignment === "right" ? "text-blue-400 bg-gray-800" : ""
              }`}
              title="Align Right"
            >
              <AlignRight size={14} />
            </button>
            <div className="w-[1px] h-4 bg-gray-800 mx-1" />
            <button
              onClick={deleteNode}
              className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
              title="Delete Image"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
