"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { CalendarIcon, ClockIcon, UserIcon } from "@heroicons/react/24/outline";

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  assignee?: {
    id: string;
    name: string;
  };
  estimatedDuration?: number;
  priority: string;
  type: "task" | "call";
}

interface KanbanColumn {
  id: string;
  title: string;
  items: TaskItem[];
}

interface WeeklyKanbanBoardProps {
  userId: string;
  weekStart: string;
  onTaskMove?: (taskId: string, newStatus: string) => void;
}

const COLUMNS = [
  { id: "TODO", title: "To Do", color: "bg-gray-100" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-100" },
  { id: "COMPLETED", title: "Completed", color: "bg-green-100" },
];

export default function WeeklyKanbanBoard({ 
  userId, 
  weekStart,
  onTaskMove 
}: WeeklyKanbanBoardProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: "TODO", title: "To Do", items: [] },
    { id: "IN_PROGRESS", title: "In Progress", items: [] },
    { id: "COMPLETED", title: "Completed", items: [] },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWeeklyTasks();
  }, [userId, weekStart]);

  const fetchWeeklyTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/tasks/weekly?userId=${userId}&weekStart=${weekStart}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weekly tasks");
      }

      const data = await response.json();
      
      // Organize tasks by status
      const todoItems = data.filter((task: any) => task.kanbanStatus === "TODO");
      const inProgressItems = data.filter((task: any) => task.kanbanStatus === "IN_PROGRESS");
      const completedItems = data.filter((task: any) => task.kanbanStatus === "COMPLETED");

      setColumns([
        { id: "TODO", title: "To Do", items: todoItems },
        { id: "IN_PROGRESS", title: "In Progress", items: inProgressItems },
        { id: "COMPLETED", title: "Completed", items: completedItems },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Update local state
    const newColumns = [...columns];
    const sourceColumn = newColumns.find((col) => col.id === source.droppableId);
    const destColumn = newColumns.find((col) => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) {
      return;
    }

    const [movedItem] = sourceColumn.items.splice(source.index, 1);
    destColumn.items.splice(destination.index, 0, movedItem);

    setColumns(newColumns);

    // Update backend
    if (onTaskMove) {
      onTaskMove(draggableId, destination.droppableId);
    }

    try {
      await fetch(`/api/tasks/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kanbanStatus: destination.droppableId,
          status: destination.droppableId === "COMPLETED" ? "COMPLETED" : 
                  destination.droppableId === "IN_PROGRESS" ? "IN_PROGRESS" : "TODO",
        }),
      });
    } catch (err) {
      console.error("Failed to update task:", err);
      // Revert on error
      fetchWeeklyTasks();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "border-l-4 border-red-500";
      case "HIGH":
        return "border-l-4 border-orange-500";
      case "MEDIUM":
        return "border-l-4 border-yellow-500";
      case "LOW":
        return "border-l-4 border-green-500";
      default:
        return "border-l-4 border-gray-300";
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 h-96 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {column.title}
              </h3>
              <p className="text-sm text-gray-600">
                {column.items.length} {column.items.length === 1 ? "item" : "items"}
              </p>
            </div>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-4 rounded-lg transition-colors ${
                    snapshot.isDraggingOver ? "bg-blue-50" : "bg-gray-50"
                  } min-h-[400px]`}
                >
                  <div className="space-y-3">
                    {column.items.map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move ${getPriorityColor(
                              item.priority
                            )} ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900 flex-1 pr-2">
                                {item.title}
                              </h4>
                              <span className={`px-2 py-1 text-xs rounded ${
                                item.type === "call" 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {item.type === "call" ? "📞 Call" : "✅ Task"}
                              </span>
                            </div>

                            {item.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {item.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {item.assignee && (
                                <div className="flex items-center gap-1">
                                  <UserIcon className="w-4 h-4" />
                                  <span>{item.assignee.name}</span>
                                </div>
                              )}
                              
                              {item.estimatedDuration && (
                                <div className="flex items-center gap-1">
                                  <ClockIcon className="w-4 h-4" />
                                  <span>{formatDuration(item.estimatedDuration)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>

                  {column.items.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      <p className="text-sm">No items</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
