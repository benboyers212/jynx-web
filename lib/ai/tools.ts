import Anthropic from "@anthropic-ai/sdk";

export const JYNX_TOOLS: Anthropic.Tool[] = [
  // ── Schedule ──────────────────────────────────────────────────────────────
  {
    name: "create_schedule_block",
    description:
      "Add a new event or schedule block for the user. Use this when the user asks to add, schedule, or create an event, class, workout, meeting, or any time block. Always use ISO 8601 strings for dates/times.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Name of the event" },
        eventType: {
          type: "string",
          enum: ["class", "work", "health", "meeting", "prep", "study", "life", "free"],
          description: "Category of the event",
        },
        startAt: {
          type: "string",
          description: "ISO 8601 datetime string, e.g. 2026-02-19T18:00:00",
        },
        endAt: {
          type: "string",
          description: "ISO 8601 datetime string, e.g. 2026-02-19T19:00:00",
        },
        location: { type: "string", description: "Optional location" },
        description: { type: "string", description: "Optional notes" },
      },
      required: ["title", "eventType", "startAt", "endAt"],
    },
  },
  {
    name: "update_schedule_block",
    description:
      "Edit an existing schedule block. Use the event ID from context. Only include fields that need to change.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "ID of the schedule block to update" },
        title: { type: "string" },
        eventType: {
          type: "string",
          enum: ["class", "work", "health", "meeting", "prep", "study", "life", "free"],
        },
        startAt: { type: "string", description: "ISO 8601 datetime" },
        endAt: { type: "string", description: "ISO 8601 datetime" },
        location: { type: "string" },
        description: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_schedule_block",
    description:
      "Delete a schedule block. Only call this after the user has explicitly confirmed they want to delete it.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "ID of the schedule block to delete" },
      },
      required: ["id"],
    },
  },
  {
    name: "list_schedule_blocks",
    description:
      "Look up schedule blocks in a specific date range. Use this when the user asks about events outside the context window, or wants to search for a specific event.",
    input_schema: {
      type: "object" as const,
      properties: {
        startDate: { type: "string", description: "YYYY-MM-DD" },
        endDate: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["startDate", "endDate"],
    },
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────
  {
    name: "create_task",
    description: "Create a new task, assignment, or goal for the user.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        dueDate: { type: "string", description: "ISO 8601 datetime, optional" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        taskType: {
          type: "string",
          enum: ["task", "assignment", "goal"],
          description: "Defaults to 'task'",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "complete_task",
    description: "Mark a task as completed.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Task ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "update_task",
    description: "Edit an existing task.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Task ID" },
        title: { type: "string" },
        description: { type: "string" },
        dueDate: { type: "string", description: "ISO 8601 datetime" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_task",
    description: "Delete a task. Only call after the user has confirmed.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Task ID" },
      },
      required: ["id"],
    },
  },

  // ── Reminders ─────────────────────────────────────────────────────────────
  {
    name: "create_reminder",
    description: "Create a new reminder for the user.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string" },
        notes: { type: "string" },
        schedule: {
          type: "string",
          enum: ["once", "daily", "weekdays", "custom"],
          description: "Recurrence pattern",
        },
        timeOfDay: { type: "string", description: "HH:MM, e.g. '09:00'" },
        date: { type: "string", description: "YYYY-MM-DD (for 'once' schedule)" },
      },
      required: ["title", "schedule"],
    },
  },
  {
    name: "delete_reminder",
    description: "Delete a reminder. Only call after the user has confirmed.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Reminder ID" },
      },
      required: ["id"],
    },
  },

  // ── Structured Questions ──────────────────────────────────────────────────
  {
    name: "ask_structured_questions",
    description:
      "Ask the user follow-up questions using structured inputs (dropdowns, date pickers, time pickers) instead of free-text responses. Use this to save costs by reducing text input. The AI should decide when structured questions make sense based on the context.",
    input_schema: {
      type: "object" as const,
      properties: {
        questions: {
          type: "array",
          description: "Array of questions to ask the user",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Unique identifier for this question",
              },
              question: {
                type: "string",
                description: "The question text to display to the user",
              },
              type: {
                type: "string",
                enum: ["yesno", "date", "time", "text", "recurring"],
                description:
                  "Input type: 'yesno' for yes/no dropdown, 'date' for date picker, 'time' for time picker, 'text' for short text input, 'recurring' for once/daily/weekdays/custom",
              },
              required: {
                type: "boolean",
                description: "Whether this question must be answered",
              },
            },
            required: ["id", "question", "type"],
          },
        },
      },
      required: ["questions"],
    },
  },
];

// Human-readable labels for tool action display in the UI
export const TOOL_LABELS: Record<string, string> = {
  create_schedule_block: "Adding event…",
  update_schedule_block: "Updating event…",
  delete_schedule_block: "Deleting event…",
  list_schedule_blocks: "Checking schedule…",
  create_task: "Adding task…",
  complete_task: "Completing task…",
  update_task: "Updating task…",
  delete_task: "Deleting task…",
  create_reminder: "Adding reminder…",
  delete_reminder: "Deleting reminder…",
  ask_structured_questions: "Preparing questions…",
};
