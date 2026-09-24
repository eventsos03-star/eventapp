"use client";

import { useEffect, useState } from "react";
import { orgRoleApi } from "@/lib/orgRoleApi";
import { organizationApi } from "@/lib/organizationApi";
import { eventService } from "@/lib/eventApi";
import { Plus, CheckCircle, Clock, AlertCircle, Calendar } from "lucide-react";
import type { OrgTask, OrganizationMember } from "@/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<OrgTask[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedMemberId, setAssignedMemberId] = useState("");
  const [eventId, setEventId] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");

  const loadData = async () => {
    try {
      const [tasksRes, orgRes, eventsRes] = await Promise.all([
        orgRoleApi.getTasks(),
        organizationApi.getMy(),
        eventService.byOrganization(),
      ]);
      setTasks(tasksRes.data.data ?? []);
      setEvents(eventsRes.data ?? []);
      if (orgRes.data) {
        const memRes = await organizationApi.getMembers(orgRes.data.id);
        setMembers(memRes.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await orgRoleApi.createTask({
      title,
      description,
      assignedMemberId,
      eventId: eventId || undefined,
      priority,
      dueDate,
    });
    setShowModal(false);
    setTitle("");
    setDescription("");
    loadData();
  };

  const handleStatusChange = async (taskId: string, newStatus: "Todo" | "InProgress" | "Done") => {
    await orgRoleApi.updateTaskStatus(taskId, newStatus);
    loadData();
  };

  const columns: { label: string; status: "Todo" | "InProgress" | "Done" }[] = [
    { label: "To Do", status: "Todo" },
    { label: "In Progress", status: "InProgress" },
    { label: "Completed", status: "Done" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations & Task Board</h1>
          <p className="text-sm text-slate-400 mt-1">Delegate specific tasks to your team members.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 hover:bg-amber-400 transition"
        >
          <Plus className="h-4 w-4" />
          Assign New Task
        </button>
      </div>

      {/* Task Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="bg-[#111726] border border-white/10 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <span className="font-semibold text-white text-sm">{col.label}</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No tasks here</p>
                ) : (
                  colTasks.map((t) => (
                    <div key={t._id} className="bg-[#090d16] border border-white/5 rounded-xl p-4 space-y-3">
                      <div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            t.priority === "high"
                              ? "bg-red-500/20 text-red-400"
                              : t.priority === "medium"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {t.priority} Priority
                        </span>
                        <h4 className="font-bold text-white text-sm mt-2">{t.title}</h4>
                        {t.description && <p className="text-xs text-slate-400 mt-1">{t.description}</p>}
                      </div>

                      <div className="text-xs text-slate-400 border-t border-white/5 pt-2 flex items-center justify-between">
                        <span>Assigned: {(t.assignedMemberId as any)?.userId?.firstName ?? "Member"}</span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="h-3 w-3" />
                          {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      </div>

                      {/* State transitions */}
                      <div className="flex gap-2 pt-1">
                        {col.status !== "Todo" && (
                          <button
                            onClick={() => handleStatusChange(t._id, "Todo")}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded hover:bg-slate-700"
                          >
                            To Do
                          </button>
                        )}
                        {col.status !== "InProgress" && (
                          <button
                            onClick={() => handleStatusChange(t._id, "InProgress")}
                            className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded hover:bg-amber-500/30"
                          >
                            In Progress
                          </button>
                        )}
                        {col.status !== "Done" && (
                          <button
                            onClick={() => handleStatusChange(t._id, "Done")}
                            className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded hover:bg-emerald-500/30"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Creating Task */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTask}
            className="bg-[#111726] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 text-white"
          >
            <h3 className="font-bold text-lg">Assign a New Task</h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Task Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Audit event ticket revenue"
                className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of the task..."
                className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Assign To Member</label>
                <select
                  required
                  value={assignedMemberId}
                  onChange={(e) => setAssignedMemberId(e.target.value)}
                  className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Member</option>
                  {members.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.userId?.firstName} ({m.role.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Linked Event (Optional)</label>
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">None</option>
                  {events.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {ev.eventName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-amber-500 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs hover:bg-amber-400"
              >
                Assign Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}