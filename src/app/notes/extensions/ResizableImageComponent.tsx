"use client";

import { NodeViewWrapper, ReactNodeViewProps } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight, Trash2, Loader2, Crop as CropIcon, Check, X } from "lucide-react";
import ReactCrop, { Crop as CropType, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

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

  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);

  const { src, width, uploading, alignment = "center" } = node.attrs;

  // Toggle float toolbar on click/select
  useEffect(() => {
    setShowToolbar(selected);
    if (!selected) {
      setIsCropping(false);
    }
  }, [selected]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width: w, height: h } = e.currentTarget;
    const defaultCrop: CropType = {
      unit: "%",
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    };
    setCrop(defaultCrop);
    setCompletedCrop({
      unit: "px",
      x: w * 0.1,
      y: h * 0.1,
      width: w * 0.8,
      height: h * 0.8,
    });
  };

  const handleApplyCrop = async () => {
    if (!completedCrop || !cropImageRef.current) return;
    try {
      const croppedUrl = await getCroppedImg(cropImageRef.current, completedCrop);
      updateAttributes({ src: croppedUrl });
      setIsCropping(false);
    } catch (e) {
      console.error("Error cropping image:", e);
    }
  };


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

  const isCentered = alignment === "center";

  return (
    <NodeViewWrapper
      as="div"
      className={`relative ${resizing ? "select-none" : ""} ${
        isCentered
          ? "block my-6 clear-both"
          : alignment === "right"
          ? "inline-block align-top float-right ml-4 mr-2 my-2 clear-none"
          : "inline-block align-top float-left mr-4 ml-2 my-2 clear-none"
      }`}
      style={{
        display: isCentered ? "block" : "inline-block",
        float: isCentered ? "none" : alignment,
        clear: isCentered ? "both" : "none",
        width: width || "100%",
        marginLeft: isCentered ? "auto" : alignment === "right" ? "1rem" : "0.5rem",
        marginRight: isCentered ? "auto" : alignment === "left" ? "1rem" : "0.5rem",
      }}
    >
      <div
        ref={containerRef}
        className={`relative group max-w-full ${
          selected && !isCropping ? "ring-2 ring-blue-500 rounded-lg" : ""
        }`}
        style={{
          width: "100%",
        }}
      >
        {isCropping ? (
          <div className="relative border border-blue-500 rounded-lg overflow-hidden bg-black/10 p-1 flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              className="max-w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={cropImageRef}
                src={src}
                alt="Crop preview"
                onLoad={onImageLoad}
                crossOrigin="anonymous"
                draggable={false}
                className="max-w-full h-auto rounded"
                style={{
                  maxHeight: "70vh",
                }}
              />
            </ReactCrop>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            ref={imageRef}
            src={src}
            alt={node.attrs.alt || "Uploaded image"}
            crossOrigin="anonymous"
            data-drag-handle
            draggable={true}
            className={`max-w-full h-auto rounded-lg transition-all ${
              uploading ? "blur-md brightness-75 select-none" : "cursor-pointer"
            } ${resizing ? "scale-[0.99] select-none pointer-events-none" : ""}`}
            style={{
              width: "100%",
            }}
          />
        )}

        {/* Uploading Overlay */}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-lg text-white gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-300">
              Uploading image...
            </span>
          </div>
        )}

        {/* Resize Handles (Only show when selected, not uploading, and not cropping) */}
        {selected && !uploading && !isCropping && (
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
            data-drag-handle="false"
            contentEditable={false}
            draggable={false}
            className="absolute left-1/2 bottom-3 -translate-x-1/2 flex items-center gap-1.5 bg-gray-900/95 dark:bg-black/95 backdrop-blur-md px-2 py-1.5 rounded-lg border border-gray-800 shadow-2xl z-30 select-none animate-in fade-in slide-in-from-bottom-2 duration-150"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {isCropping ? (
              <>
                <button
                  onClick={handleApplyCrop}
                  className="px-2 py-1 flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold tracking-wide uppercase transition-colors"
                  title="Apply Crop"
                >
                  <Check size={12} />
                  <span>Apply</span>
                </button>
                <button
                  onClick={() => setIsCropping(false)}
                  className="px-2 py-1 flex items-center gap-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold tracking-wide uppercase transition-colors"
                  title="Cancel"
                >
                  <X size={12} />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <>
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
                  onClick={() => setIsCropping(true)}
                  className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  title="Crop Image"
                >
                  <CropIcon size={14} />
                </button>
                <div className="w-[1px] h-4 bg-gray-800 mx-1" />
                <button
                  onClick={deleteNode}
                  className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                  title="Delete Image"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

function getCroppedImg(
  image: HTMLImageElement,
  pixelCrop: PixelCrop
): Promise<string> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Set canvas size to the exact high-resolution natural crop dimensions
  canvas.width = pixelCrop.width * scaleX;
  canvas.height = pixelCrop.height * scaleY;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return Promise.reject(new Error("No 2d context"));
  }

  // Draw the high-resolution source pixels at 1:1 scale onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY
  );

  return new Promise((resolve) => {
    // Export as lossless PNG to maintain 100% original crispness and transparency
    resolve(canvas.toDataURL("image/png"));
  });
}
