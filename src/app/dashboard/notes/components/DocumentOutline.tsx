"use client";

import React from "react";

interface HeadingItem {
  level: number;
  text: string;
  pos: number;
}

interface DocumentOutlineProps {
  showOutline: boolean;
  headings: HeadingItem[];
  scrollToHeading: (pos: number) => void;
}

export const DocumentOutline: React.FC<DocumentOutlineProps> = ({
  showOutline,
  headings,
  scrollToHeading,
}) => {
  if (!showOutline) return null;

  return (
    <div className="w-56 min-w-[224px] border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111111] overflow-y-auto flex-shrink-0">
      <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Document Outline
        </h3>
      </div>
      {headings.length === 0 ? (
        <div className="px-3 py-6 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600 italic">
            Add headings (H1, H2, H3) to create a document outline
          </p>
        </div>
      ) : (
        <nav className="py-1">
          {headings.map((h, i) => (
            <button
              key={`${h.pos}-${i}`}
              onClick={() => scrollToHeading(h.pos)}
              className="w-full text-left py-1.5 pr-3 text-xs hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white truncate"
              style={{
                paddingLeft: `${(h.level - 1) * 12 + 12}px`,
              }}
              title={h.text}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`text-[9px] font-bold flex-shrink-0 px-1 py-0.5 rounded ${
                    h.level === 1
                      ? "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                      : h.level === 2
                        ? "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
                        : "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                  }`}
                >
                  H{h.level}
                </span>
                <span className="truncate">
                  {h.text || "Untitled heading"}
                </span>
              </span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};
