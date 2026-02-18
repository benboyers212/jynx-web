"use client";

import React from "react";
import Link from "next/link";

type FileItem = {
  id: string;
  name: string;
  type: string;
  url?: string | null;
  size?: number | null;
  createdAt: Date;
};

type FilesPanelProps = {
  files: FileItem[];
  dark?: boolean;
};

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getFileIcon(type: string): string {
  if (type === "pdf") return "PDF";
  if (type === "doc") return "DOC";
  if (type === "image") return "IMG";
  if (type === "note") return "NOTE";
  if (type === "link") return "LINK";
  return "FILE";
}

const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

export function FilesPanel({ files, dark = false }: FilesPanelProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-2xl border px-4 py-4" style={{
        borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
        background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
      }}>
        <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }}>
          No files attached yet.
        </div>
        <div className="text-[11px] mt-1" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
          Notes you create will appear here automatically.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="rounded-2xl border px-3 py-3"
          style={{
            borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
            boxShadow: dark ? "0 0 0 1px rgba(0,0,0,0.15)" : "0 0 0 1px rgba(0,0,0,0.04)",
            background: dark ? "rgba(255,255,255,0.03)" : "white",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="h-10 w-10 rounded-2xl border flex items-center justify-center text-[10px] font-semibold shrink-0"
              style={{
                borderColor: rgbaBrand(0.22),
                boxShadow: `0 0 0 1px ${rgbaBrand(0.06)}`,
                background: dark ? "rgba(255,255,255,0.04)" : "white",
                color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
              }}
            >
              {getFileIcon(file.type)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
                    {file.name}
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                    {formatDate(file.createdAt)} · {formatFileSize(file.size)}
                  </div>
                </div>
              </div>

              {file.url && file.type === "link" && (
                <div className="mt-3">
                  <Link
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl px-3 py-2 text-xs font-semibold border transition inline-block"
                    style={{
                      borderColor: rgbaBrand(0.22),
                      boxShadow: `0 0 0 1px ${rgbaBrand(0.06)}`,
                      background: dark ? "rgba(255,255,255,0.04)" : "white",
                      color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                    }}
                  >
                    Open Link
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
