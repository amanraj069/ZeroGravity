"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import { Trash2 } from "lucide-react";

interface TableToolbarProps {
  editor: Editor;
  tableMenuCoords: { top: number; left: number };
  tableWidth: number;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  editor,
  tableMenuCoords,
  tableWidth,
}) => {
  return (
    <div
      className="absolute z-30 flex items-center gap-2 px-3 bg-gray-50 dark:bg-[#16161c] border border-b-0 border-gray-300 dark:border-gray-700 rounded-t-lg shadow-sm select-none overflow-x-auto scrollbar-none h-[38px] transition-all duration-100 ease-out"
      style={{
        top: tableMenuCoords.top,
        left: tableMenuCoords.left,
        width: `${tableWidth}px`,
        minWidth: "650px",
      }}
    >
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-[9px] font-extrabold uppercase tracking-widest pl-1">
          Table
        </span>
      </div>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 flex-shrink-0" />

      {/* Rows Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={() => editor.chain().focus().addRowBefore().run()}
          className="px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
          title="Insert a row directly above the current cell"
        >
          Add Row Above
        </button>
        <button
          onClick={() => editor.chain().focus().addRowAfter().run()}
          className="px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
          title="Insert a row directly below the current cell"
        >
          Add Row Below
        </button>
        <button
          onClick={() => editor.chain().focus().deleteRow().run()}
          className="px-2 py-1 text-[10px] font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors cursor-pointer"
          title="Delete the currently selected row"
        >
          Delete Row
        </button>
      </div>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 flex-shrink-0" />

      {/* Columns Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          className="px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
          title="Insert a column directly to the left of the current cell"
        >
          Add Column Left
        </button>
        <button
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          className="px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
          title="Insert a column directly to the right of the current cell"
        >
          Add Column Right
        </button>
        <button
          onClick={() => editor.chain().focus().deleteColumn().run()}
          className="px-2 py-1 text-[10px] font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors cursor-pointer"
          title="Delete the currently selected column"
        >
          Delete Column
        </button>
      </div>

      <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 flex-shrink-0" />

      {/* Format cell Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={() => editor.chain().focus().mergeCells().run()}
          className="px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
          title="Merge selected cells (Highlight/drag across multiple cells to select them)"
        >
          Merge Cells
        </button>
        <button
          onClick={() => editor.chain().focus().splitCell().run()}
          className="px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
          title="Split the selected merged cell into individual columns and rows"
        >
          Split Cells
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          className="px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
          title="Toggle the top row as a header row with distinct styling"
        >
          Header Row
        </button>
      </div>

      {/* Delete Table Action (right-aligned) */}
      <div className="ml-auto flex items-center pl-2 flex-shrink-0">
        <button
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="px-2.5 py-1 text-[10px] font-semibold text-white bg-red-600 hover:bg-red-500 rounded transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
          title="Completely delete this table"
        >
          <Trash2 size={11} />
          Delete Table
        </button>
      </div>
    </div>
  );
};
