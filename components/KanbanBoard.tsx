"use client";

import { motion } from "framer-motion";
import { Ticket } from "@/lib/schema";
import { TicketCard } from "./TicketCard";

const COLUMNS: { key: Ticket["column"]; label: string; accent: string }[] = [
  { key: "in_progress", label: "🔄 In Progress", accent: "border-t-blue-500" },
  { key: "todo", label: "📋 To Do", accent: "border-t-orange-500" },
  { key: "backlog", label: "📦 Backlog", accent: "border-t-slate-400" },
];

interface KanbanBoardProps {
  tickets: Ticket[];
}

export function KanbanBoard({ tickets }: KanbanBoardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const colTickets = tickets.filter((t) => t.column === col.key);
        return (
          <div
            key={col.key}
            className={`kanban-column border-t-4 ${col.accent}`}
          >
            {/* Header Kolom */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-700">
                {col.label}
              </h2>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                {colTickets.length}
              </span>
            </div>

            {/* List Tiket dengan Animasi Stagger */}
            {colTickets.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
              >
                <TicketCard t={t} />
              </motion.div>
            ))}

            {/* Empty State */}
            {colTickets.length === 0 && (
              <p className="text-xs text-slate-400 italic py-8 text-center">
                No tickets
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}