"use client";

// 汎用カンバンボード（HTML5 ドラッグ&ドロップ）
// タスクボードにも商談パイプラインにも投資家パイプラインにも使う。

import { useState, type ReactNode } from "react";

export interface KanbanColumn {
  id: string;
  label: string;
  color: string;
  /** 列ヘッダーの右に出す補足（金額合計など） */
  note?: ReactNode;
}

export function Kanban<T extends { id: string }>({
  columns,
  items,
  columnOf,
  onMove,
  renderCard,
  onAdd,
}: {
  columns: KanbanColumn[];
  items: T[];
  columnOf: (item: T) => string;
  onMove: (item: T, columnId: string) => void;
  renderCard: (item: T) => ReactNode;
  onAdd?: (columnId: string) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  return (
    <div className="pm-kanban">
      {columns.map((col) => {
        const colItems = items.filter((i) => columnOf(i) === col.id);
        return (
          <div
            key={col.id}
            className={`pm-kanban-col ${over === col.id ? "drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.id);
            }}
            onDragLeave={() => setOver((c) => (c === col.id ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/plain") || dragging;
              const item = items.find((i) => i.id === id);
              if (item && columnOf(item) !== col.id) onMove(item, col.id);
              setDragging(null);
            }}
          >
            <div className="pm-kanban-head">
              <span className="pm-dot" style={{ background: col.color }} />
              <span style={{ color: col.color }}>{col.label}</span>
              <span className="pm-kanban-count">{colItems.length}</span>
            </div>
            {col.note && <div className="pm-kanban-sum" style={{ marginBottom: 8 }}>{col.note}</div>}

            {colItems.map((item) => (
              <div
                key={item.id}
                className={`pm-kanban-card ${dragging === item.id ? "dragging" : ""}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", item.id);
                  e.dataTransfer.effectAllowed = "move";
                  setDragging(item.id);
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setOver(null);
                }}
              >
                {renderCard(item)}
              </div>
            ))}

            {colItems.length === 0 && (
              <div className="pm-muted" style={{ fontSize: 11, padding: "12px 4px", textAlign: "center" }}>
                ここへドラッグ
              </div>
            )}

            {onAdd && (
              <button
                className="pm-btn ghost sm"
                style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                onClick={() => onAdd(col.id)}
              >
                ＋ 追加
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
