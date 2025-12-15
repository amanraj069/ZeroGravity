"use client";

import React, { useState, useRef, useEffect } from "react";
import { RotateCw, X, Check } from "lucide-react";

interface PhotoEditorProps {
  imageFile: File;
  onSave: (croppedFile: File) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
  size: number;
}

export default function PhotoEditor({
  imageFile,
  onSave,
  onCancel,
}: PhotoEditorProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, size: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    size: 0,
    cropX: 0,
    cropY: 0,
  });
  const [resizeCorner, setResizeCorner] = useState<
    "tl" | "tr" | "bl" | "br" | null
  >(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [cursorStyle, setCursorStyle] = useState<string>("default");
  const [imageBounds, setImageBounds] = useState({
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  });
  const [displayScale, setDisplayScale] = useState(1);

  // Load image
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);

      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        const container = containerRef.current;
        if (container) {
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;

          setImageDimensions({ width: img.width, height: img.height });

          // Calculate scale for display - fit entire image without cropping
          const scale = Math.min(
            containerWidth / img.width,
            containerHeight / img.height
          );
          setDisplayScale(scale);

          // Calculate scaled dimensions
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;

          // Calculate rotated image bounds (for initial calculation, rotation is 0)
          const angle = 0; // Initial rotation
          const cos = Math.abs(Math.cos(angle));
          const sin = Math.abs(Math.sin(angle));
          const rotatedWidth = scaledWidth * cos + scaledHeight * sin;
          const rotatedHeight = scaledWidth * sin + scaledHeight * cos;

          // Calculate visible image bounds
          const centerX = containerWidth / 2;
          const centerY = containerHeight / 2;
          const imageMinX = Math.max(0, centerX - rotatedWidth / 2);
          const imageMinY = Math.max(0, centerY - rotatedHeight / 2);
          const imageMaxX = Math.min(
            containerWidth,
            centerX + rotatedWidth / 2
          );
          const imageMaxY = Math.min(
            containerHeight,
            centerY + rotatedHeight / 2
          );

          // Calculate maximum crop size based on visible image area
          const imageWidthInDisplay = imageMaxX - imageMinX;
          const imageHeightInDisplay = imageMaxY - imageMinY;
          const maxSizeFromImageBounds = Math.min(
            imageWidthInDisplay,
            imageHeightInDisplay
          );

          // Maximum crop size is also limited by actual image dimensions
          const imageMaxCropSize = Math.min(img.width, img.height);
          const maxCropSizeInDisplay = imageMaxCropSize * scale;

          // Use the minimum of: image dimension limit, or visible bounds
          // This allows the crop area to use the full visible image area
          const maxSize = Math.min(
            maxCropSizeInDisplay,
            maxSizeFromImageBounds
          );

          const initialSize = Math.min(maxSize, maxSize * 0.9); // Start at 90% of max

          const initialX = (containerWidth - initialSize) / 2;
          const initialY = (containerHeight - initialSize) / 2;

          setCropArea({
            x: initialX,
            y: initialY,
            size: initialSize,
          });
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Ensure crop area size never exceeds image dimensions
  useEffect(() => {
    if (
      imageDimensions.width === 0 ||
      imageDimensions.height === 0 ||
      displayScale === 0
    )
      return;

    const imageMaxCropSize = Math.min(
      imageDimensions.width,
      imageDimensions.height
    );
    const maxCropSizeInDisplay = imageMaxCropSize * displayScale;

    // Only update if current size exceeds maximum
    if (cropArea.size > maxCropSizeInDisplay) {
      const container = containerRef.current;
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Use image bounds to determine maximum size
        const imageWidthInDisplay = imageBounds.maxX - imageBounds.minX;
        const imageHeightInDisplay = imageBounds.maxY - imageBounds.minY;
        const maxSizeFromImageBounds = Math.min(
          imageWidthInDisplay,
          imageHeightInDisplay
        );

        const finalMaxSize = Math.min(
          maxCropSizeInDisplay,
          maxSizeFromImageBounds
        );

        // Adjust position to keep crop area centered if possible
        const newX = Math.max(
          0,
          Math.min(cropArea.x, containerWidth - finalMaxSize)
        );
        const newY = Math.max(
          0,
          Math.min(cropArea.y, containerHeight - finalMaxSize)
        );

        setCropArea({
          x: newX,
          y: newY,
          size: finalMaxSize,
        });
      }
    }
  }, [imageDimensions.width, imageDimensions.height, displayScale, rotation]);

  // Draw image with rotation and crop overlay
  useEffect(() => {
    if (!imageSrc || !imageRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    const img = imageRef.current;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scaled dimensions to fit container (use minimum dimension)
    // This ensures the entire image is visible without cropping
    const scale = Math.min(
      containerWidth / img.width,
      containerHeight / img.height
    );
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    // Store display scale for crop size calculations
    setDisplayScale(scale);

    // Calculate rotated image bounds
    const angle = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    const rotatedWidth = scaledWidth * cos + scaledHeight * sin;
    const rotatedHeight = scaledWidth * sin + scaledHeight * cos;

    // Calculate visible image bounds in canvas coordinates
    const imageMinX = centerX - rotatedWidth / 2;
    const imageMinY = centerY - rotatedHeight / 2;
    const imageMaxX = centerX + rotatedWidth / 2;
    const imageMaxY = centerY + rotatedHeight / 2;

    const newBounds = {
      minX: Math.max(0, imageMinX),
      minY: Math.max(0, imageMinY),
      maxX: Math.min(containerWidth, imageMaxX),
      maxY: Math.min(containerHeight, imageMaxY),
    };

    // Only update if bounds actually changed to prevent infinite loops
    if (
      imageBounds.minX !== newBounds.minX ||
      imageBounds.minY !== newBounds.minY ||
      imageBounds.maxX !== newBounds.maxX ||
      imageBounds.maxY !== newBounds.maxY
    ) {
      setImageBounds(newBounds);
    }

    // Save context
    ctx.save();

    // Translate to center
    ctx.translate(centerX, centerY);
    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);
    // Draw image centered
    ctx.drawImage(
      img,
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );

    // Restore context
    ctx.restore();

    // Draw dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area (create "window" in overlay)
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(cropArea.x, cropArea.y, cropArea.size, cropArea.size);

    // Draw crop border
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.size, cropArea.size);

    // Draw corner handles
    const handleSize = 12;
    ctx.fillStyle = "#ffffff";
    const corners = [
      { x: cropArea.x, y: cropArea.y },
      { x: cropArea.x + cropArea.size, y: cropArea.y },
      { x: cropArea.x, y: cropArea.y + cropArea.size },
      { x: cropArea.x + cropArea.size, y: cropArea.y + cropArea.size },
    ];

    corners.forEach((corner) => {
      ctx.fillRect(
        corner.x - handleSize / 2,
        corner.y - handleSize / 2,
        handleSize,
        handleSize
      );
    });
  }, [imageSrc, rotation, cropArea]);

  // Helper function to get coordinates from event (mouse or touch)
  const getEventCoordinates = (
    e: React.MouseEvent | React.TouchEvent
  ): { x: number; y: number } | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;

    let clientX: number, clientY: number;

    if ("touches" in e) {
      // Touch event
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Handle mouse/touch down for dragging
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getEventCoordinates(e);
    if (!coords) return;

    const { x, y } = coords;

    // Check if clicking on resize handle (corners)
    const handleSize = 12;
    const corners = [
      { x: cropArea.x, y: cropArea.y, corner: "tl" as const },
      { x: cropArea.x + cropArea.size, y: cropArea.y, corner: "tr" as const },
      { x: cropArea.x, y: cropArea.y + cropArea.size, corner: "bl" as const },
      {
        x: cropArea.x + cropArea.size,
        y: cropArea.y + cropArea.size,
        corner: "br" as const,
      },
    ];

    for (const corner of corners) {
      if (
        Math.abs(x - corner.x) < handleSize &&
        Math.abs(y - corner.y) < handleSize
      ) {
        setIsResizing(true);
        setResizeCorner(corner.corner);
        setResizeStart({
          x,
          y,
          size: cropArea.size,
          cropX: cropArea.x,
          cropY: cropArea.y,
        });
        return;
      }
    }

    // Check if clicking inside crop area
    if (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.size &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.size
    ) {
      setIsDragging(true);
      setDragStart({
        x: x - cropArea.x,
        y: y - cropArea.y,
      });
    }
  };

  // Handle mouse/touch move for cursor and interactions
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default for touch events to avoid scrolling
    if ("touches" in e && (isDragging || isResizing)) {
      e.preventDefault();
    }

    const coords = getEventCoordinates(e);
    if (!coords) return;

    const { x, y } = coords;

    // Update cursor style based on hover position (only for mouse events)
    if (!isDragging && !isResizing && !("touches" in e)) {
      const handleSize = 12;
      const corners = [
        { x: cropArea.x, y: cropArea.y, corner: "tl" as const },
        { x: cropArea.x + cropArea.size, y: cropArea.y, corner: "tr" as const },
        { x: cropArea.x, y: cropArea.y + cropArea.size, corner: "bl" as const },
        {
          x: cropArea.x + cropArea.size,
          y: cropArea.y + cropArea.size,
          corner: "br" as const,
        },
      ];

      let cursor = "default";
      let foundCorner = false;

      for (const corner of corners) {
        if (
          Math.abs(x - corner.x) < handleSize &&
          Math.abs(y - corner.y) < handleSize
        ) {
          foundCorner = true;
          // Set cursor based on corner direction
          switch (corner.corner) {
            case "tl":
              cursor = "nwse-resize";
              break;
            case "tr":
              cursor = "nesw-resize";
              break;
            case "bl":
              cursor = "nesw-resize";
              break;
            case "br":
              cursor = "nwse-resize";
              break;
          }
          break;
        }
      }

      if (!foundCorner) {
        // Check if inside crop area
        if (
          x >= cropArea.x &&
          x <= cropArea.x + cropArea.size &&
          y >= cropArea.y &&
          y <= cropArea.y + cropArea.size
        ) {
          cursor = "move";
        }
      }

      setCursorStyle(cursor);
    }

    if (isResizing && resizeCorner) {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calculate maximum crop size based on image dimensions
      // The crop area should never exceed the minimum of image width or height
      const imageMaxCropSize = Math.min(
        imageDimensions.width,
        imageDimensions.height
      );
      // Convert to display coordinates
      const maxCropSizeInDisplay = imageMaxCropSize * displayScale;

      // Use image bounds to determine maximum size (no arbitrary padding)
      // The crop area can use the full visible image area
      const imageWidthInDisplay = imageBounds.maxX - imageBounds.minX;
      const imageHeightInDisplay = imageBounds.maxY - imageBounds.minY;
      const maxSizeFromImageBounds = Math.min(
        imageWidthInDisplay,
        imageHeightInDisplay
      );

      // Maximum size is the minimum of: image dimension limit, or visible image bounds
      // This allows the crop area to use the full visible image area
      const maxSize = Math.min(maxCropSizeInDisplay, maxSizeFromImageBounds);
      const minSize = 50;

      // Get the opposite corner (anchor point) from the original crop area when resize started
      let anchorX: number, anchorY: number;
      switch (resizeCorner) {
        case "tl": // Top-left: anchor is bottom-right
          anchorX = resizeStart.cropX + resizeStart.size;
          anchorY = resizeStart.cropY + resizeStart.size;
          break;
        case "tr": // Top-right: anchor is bottom-left
          anchorX = resizeStart.cropX;
          anchorY = resizeStart.cropY + resizeStart.size;
          break;
        case "bl": // Bottom-left: anchor is top-right
          anchorX = resizeStart.cropX + resizeStart.size;
          anchorY = resizeStart.cropY;
          break;
        case "br": // Bottom-right: anchor is top-left
          anchorX = resizeStart.cropX;
          anchorY = resizeStart.cropY;
          break;
      }

      // Calculate delta from mouse position to anchor
      const dx = x - anchorX;
      const dy = y - anchorY;

      // Use the maximum of absolute deltas to maintain square shape
      // The sign determines if we're growing or shrinking
      let newSize: number;

      if (resizeCorner === "tl") {
        // Top-left: size is distance from anchor (bottom-right) to mouse
        // Moving left/up increases size
        newSize = Math.max(Math.abs(dx), Math.abs(dy));
      } else if (resizeCorner === "br") {
        // Bottom-right: size is distance from anchor (top-left) to mouse
        // Moving right/down increases size
        newSize = Math.max(Math.abs(dx), Math.abs(dy));
      } else if (resizeCorner === "tr") {
        // Top-right: anchor is bottom-left, moving right/up increases size
        newSize = Math.max(Math.abs(dx), Math.abs(dy));
      } else {
        // Bottom-left: anchor is top-right, moving left/down increases size
        newSize = Math.max(Math.abs(dx), Math.abs(dy));
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));

      // Calculate new position based on which corner is being dragged
      let newX: number, newY: number;
      switch (resizeCorner) {
        case "tl": // Top-left: position moves as size changes
          newX = anchorX - newSize;
          newY = anchorY - newSize;
          break;
        case "tr": // Top-right: only Y changes
          newX = anchorX;
          newY = anchorY - newSize;
          break;
        case "bl": // Bottom-left: only X changes
          newX = anchorX - newSize;
          newY = anchorY;
          break;
        case "br": // Bottom-right: position stays at anchor
          newX = anchorX;
          newY = anchorY;
          break;
      }

      // Constrain crop area to image bounds
      const imageMinX = imageBounds.minX;
      const imageMinY = imageBounds.minY;
      const imageMaxX = imageBounds.maxX;
      const imageMaxY = imageBounds.maxY;

      // Clamp position to image bounds
      newX = Math.max(imageMinX, Math.min(newX, imageMaxX - newSize));
      newY = Math.max(imageMinY, Math.min(newY, imageMaxY - newSize));

      // If position was constrained, adjust size to fit within image
      if (
        newX === imageMinX &&
        (resizeCorner === "tl" || resizeCorner === "bl")
      ) {
        newSize = Math.min(newSize, anchorX - imageMinX);
        newX = imageMinX;
      } else if (
        newX + newSize >= imageMaxX &&
        (resizeCorner === "tr" || resizeCorner === "br")
      ) {
        newSize = Math.min(newSize, imageMaxX - anchorX);
        newX = anchorX;
      }

      if (
        newY === imageMinY &&
        (resizeCorner === "tl" || resizeCorner === "tr")
      ) {
        newSize = Math.min(newSize, anchorY - imageMinY);
        newY = imageMinY;
      } else if (
        newY + newSize >= imageMaxY &&
        (resizeCorner === "bl" || resizeCorner === "br")
      ) {
        newSize = Math.min(newSize, imageMaxY - anchorY);
        newY = anchorY;
      }

      // Also keep within container bounds as fallback
      const maxX = containerWidth - newSize;
      const maxY = containerHeight - newSize;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      // If position was clamped, adjust size accordingly
      if (newX === 0 && (resizeCorner === "tl" || resizeCorner === "bl")) {
        newSize = anchorX;
        newX = 0;
      } else if (
        newX === maxX &&
        (resizeCorner === "tr" || resizeCorner === "br")
      ) {
        newSize = containerWidth - anchorX;
        newX = anchorX;
      }

      if (newY === 0 && (resizeCorner === "tl" || resizeCorner === "tr")) {
        newSize = Math.min(newSize, anchorY);
        newY = 0;
      } else if (
        newY === maxY &&
        (resizeCorner === "bl" || resizeCorner === "br")
      ) {
        newSize = Math.min(newSize, containerHeight - anchorY);
        newY = anchorY;
      }

      setCropArea({
        x: newX,
        y: newY,
        size: Math.max(minSize, Math.min(maxSize, newSize)),
      });
    } else if (isDragging) {
      const container = containerRef.current;
      if (container) {
        const newX = x - dragStart.x;
        const newY = y - dragStart.y;

        // Constrain to image bounds
        const imageMinX = imageBounds.minX;
        const imageMinY = imageBounds.minY;
        const imageMaxX = imageBounds.maxX;
        const imageMaxY = imageBounds.maxY;

        // Also keep within container bounds
        const maxX = Math.min(
          container.clientWidth - cropArea.size,
          imageMaxX - cropArea.size
        );
        const maxY = Math.min(
          container.clientHeight - cropArea.size,
          imageMaxY - cropArea.size
        );

        setCropArea((prev) => ({
          ...prev,
          x: Math.max(imageMinX, Math.min(newX, maxX)),
          y: Math.max(imageMinY, Math.min(newY, maxY)),
        }));
      }
    }
  };

  // Handle mouse/touch up
  const handlePointerUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeCorner(null);
  };

  // Handle rotation
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Crop and save image
  const handleSave = () => {
    if (!imageRef.current || !canvasRef.current) return;

    const img = imageRef.current;
    const container = containerRef.current;
    if (!container) return;

    const outputSize = 400;

    // Step 1: Create a temporary canvas with the rotated image
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Calculate dimensions needed for rotated image
    const angle = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    const rotatedWidth = img.width * cos + img.height * sin;
    const rotatedHeight = img.width * sin + img.height * cos;

    tempCanvas.width = rotatedWidth;
    tempCanvas.height = rotatedHeight;

    // Draw rotated image on temp canvas
    tempCtx.save();
    tempCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
    tempCtx.rotate(angle);
    tempCtx.drawImage(img, -img.width / 2, -img.height / 2);
    tempCtx.restore();

    // Step 2: Calculate the scale factor used in display
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const displayScale = Math.min(
      containerWidth / rotatedWidth,
      containerHeight / rotatedHeight
    );

    // Step 3: Map crop area from display coordinates to rotated image coordinates
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const cropCenterX = cropArea.x + cropArea.size / 2;
    const cropCenterY = cropArea.y + cropArea.size / 2;

    // Convert from display coordinates to rotated image coordinates
    const dx = cropCenterX - centerX;
    const dy = cropCenterY - centerY;

    const rotatedImageX = rotatedWidth / 2 + dx / displayScale;
    const rotatedImageY = rotatedHeight / 2 + dy / displayScale;
    const cropSizeInImage = cropArea.size / displayScale;

    // Step 4: Calculate source rectangle in rotated image
    const sourceX = Math.max(
      0,
      Math.min(
        rotatedImageX - cropSizeInImage / 2,
        rotatedWidth - cropSizeInImage
      )
    );
    const sourceY = Math.max(
      0,
      Math.min(
        rotatedImageY - cropSizeInImage / 2,
        rotatedHeight - cropSizeInImage
      )
    );
    const clampedSize = Math.min(
      cropSizeInImage,
      rotatedWidth - sourceX,
      rotatedHeight - sourceY
    );

    // Step 5: Create final canvas and draw cropped area
    const croppedCanvas = document.createElement("canvas");
    const croppedCtx = croppedCanvas.getContext("2d");
    if (!croppedCtx) return;

    croppedCanvas.width = outputSize;
    croppedCanvas.height = outputSize;

    croppedCtx.drawImage(
      tempCanvas,
      sourceX,
      sourceY,
      clampedSize,
      clampedSize,
      0,
      0,
      outputSize,
      outputSize
    );

    // Convert to blob and create file
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], imageFile.name, {
            type: imageFile.type,
            lastModified: Date.now(),
          });
          onSave(croppedFile);
        }
      },
      imageFile.type,
      0.95
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4">
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full flex flex-col"
        style={{
          maxWidth: "min(95vw, 95vh - 120px)",
          maxHeight: "95vh",
          aspectRatio: "1 / 1",
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-medium text-black dark:text-white">
            Edit Photo
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative w-full"
          style={{
            minHeight: "300px",
            height: "100%",
            width: "100%",
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onTouchCancel={handlePointerUp}
            className="w-full h-full"
            style={{
              touchAction: "none",
              cursor: cursorStyle,
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <button
            onClick={handleRotate}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            <RotateCw className="w-4 h-4" />
            <span>Rotate</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onCancel}
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm"
            >
              <Check className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
