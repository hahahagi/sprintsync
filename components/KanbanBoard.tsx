"use client";

import { motion } from "framer-motion";
import { Ticket } from "@/lib/schema";
import { TicketCard } from "./TicketCard";

const COLUMNS = [
  { key: "in_progress" as const, label: "In Progress", icon: "pending_actions", color: "text-[#0b57d0]" },
  { key: "todo" as const, label: "To Do", icon: "task_alt", color: "text-amber-600" },
  { key: "backlog" as const, label: "Backlog", icon: "inventory_2", color: "text-slate-600" },
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
            className="flex flex-col gap-3 rounded-2xl border border-[#c4c6d0]/60 bg-[#f0f4f9] p-4 min-h-[460px]"
          >
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined !text-[20px] ${col.color}`}>
                  {col.icon}
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1f1f1f]">
                  {col.label}
                </h2>
              </div>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-700 shadow-xs border border-[#e0e3e7]">
                {colTickets.length}
              </span>
            </div>

            {colTickets.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
              >
                <TicketCard t={t} />
              </motion.div>
            ))}

            {colTickets.length === 0 && (
              <div className="flex items-center justify-center flex-1 py-14">
                <p className="text-xs text-slate-400 italic">No tickets in this column</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}