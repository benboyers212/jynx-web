import Anthropic from "@anthropic-ai/sdk";

export const JYNX_TOOLS: Anthropic.Tool[] = [
  // ── Schedule ──────────────────────────────────────────────────────────────
  {
    name: "create_schedule_block",
    description:
      "Add a new event or schedule block for the user. Use this when the user asks to add, schedule, or create an event, class, workout, meeting, or any time block. Always use ISO 8601 strings for dates/times WITHOUT the Z suffix (use local time).",
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
          description: "ISO 8601 datetime string WITHOUT Z suffix, e.g. 2026-02-19T18:00:00 (in user's local timezone)",
        },
        endAt: {
          type: "string",
          description: "ISO 8601 datetime string WITHOUT Z suffix, e.g. 2026-02-19T19:00:00 (in user's local timezone)",
        },
        location: { type: "string", description: "Optional location" },
        description: { type: "string", description: "Optional notes" },
        classHubId: {
          type: "string",
          description: "Optional ClassHub ID to link this event to. Use create_or_find_class_hub first to get this ID when creating class events.",
        },
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
    description: "Create a new task, assignment, or goal for the user. When creating assignments for a class, use classHubId to link it to the appropriate ClassHub.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        dueDate: { type: "string", description: "ISO 8601 datetime WITHOUT Z suffix (in user's local timezone), optional" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        taskType: {
          type: "string",
          enum: ["task", "assignment", "goal"],
          description: "Defaults to 'task'. Use 'assignment' for class homework/exams.",
        },
        classHubId: {
          type: "string",
          description: "Optional ClassHub ID to link this task to. Use for assignments, homework, or class-related tasks.",
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
      "Ask the user follow-up questions using structured inputs (dropdowns, date pickers, time pickers, multiple choice) instead of free-text responses. IMPORTANT: Prefer 'choice' type with specific options over 'text' type whenever possible to minimize typing. An 'Other' option is automatically added to all choice questions for flexibility. Use this to save costs by reducing text input.",
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
                enum: ["yesno", "date", "time", "text", "recurring", "choice"],
                description:
                  "Input type: 'yesno' for yes/no dropdown, 'date' for date picker, 'time' for time picker, 'text' for short text input (use sparingly), 'recurring' for once/daily/weekdays/custom, 'choice' for multiple choice with custom options (preferred when possible)",
              },
              options: {
                type: "array",
                description: "For 'choice' type: array of option strings to present. An 'Other' option with text input is automatically added.",
                items: {
                  type: "string",
                },
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

  // ── Event Disambiguation ──────────────────────────────────────────────────
  {
    name: "disambiguate_event",
    description:
      "When creating a note or event and the title might match existing events/classes, use this to ask the user which one they mean. This helps organize notes under the correct class even when titles vary (e.g., 'F365' vs 'Personal Financial Planning F365'). The AI will provide potential matches based on title similarity.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "The event/class title that needs disambiguation",
        },
        eventType: {
          type: "string",
          enum: ["class", "work", "health", "meeting", "prep", "study", "life", "free"],
          description: "Optional event type to narrow down matches",
        },
        context: {
          type: "string",
          description: "Optional context about what the user is trying to do (e.g., 'creating note', 'quick add event')",
        },
      },
      required: ["title"],
    },
  },

  // ── ClassHub Management ───────────────────────────────────────────────────
  {
    name: "create_or_find_class_hub",
    description:
      "Create a new ClassHub or find an existing one for organizing class-related events, notes, and files. When processing syllabi or creating multiple class events, use this first to get a ClassHub ID, then link all related events to it. This prevents duplicate classes with similar names (e.g., 'F365' and 'Personal Financial Planning F365' will match to the same hub).",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Full class name (e.g., 'Personal Financial Planning')",
        },
        courseCode: {
          type: "string",
          description: "Course code if available (e.g., 'F365', 'CS401')",
        },
        instructor: {
          type: "string",
          description: "Instructor name if known",
        },
        semester: {
          type: "string",
          description: "Semester (e.g., 'Spring 2026', 'Fall 2025')",
        },
        department: {
          type: "string",
          description: "Department if known (e.g., 'Computer Science', 'Finance')",
        },
        meetingDays: {
          type: "array",
          items: { type: "string" },
          description: "Days the class meets (e.g., ['Mon', 'Wed', 'Fri'] or ['Tue', 'Thu'])",
        },
        meetingStartTime: {
          type: "string",
          description: "Class start time in HH:MM 24h format (e.g., '14:30')",
        },
        meetingEndTime: {
          type: "string",
          description: "Class end time in HH:MM 24h format (e.g., '15:45')",
        },
        startDate: {
          type: "string",
          description: "First day of class in YYYY-MM-DD format",
        },
        endDate: {
          type: "string",
          description: "Last day of class in YYYY-MM-DD format",
        },
        location: {
          type: "string",
          description: "Room or building where the class meets",
        },
      },
      required: ["name"],
    },
  },

  {
    name: "list_class_hubs",
    description:
      "List all existing ClassHubs to see what classes the user has. Useful when processing syllabi to check if a class already exists before creating a new one.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },

  // ── User Memory & Preferences ─────────────────────────────────────────────
  {
    name: "remember",
    description:
      "Store important information the user tells you for future reference. Use this when the user expresses preferences, goals, habits, constraints, or corrections. Examples: 'I prefer morning workouts', 'I'm trying to reduce screen time', 'I hate back-to-back classes', 'Actually, that class meets on Tuesdays'. This helps you provide personalized assistance over time.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: {
          type: "string",
          description: "What to remember (concise, clear statement)",
        },
        category: {
          type: "string",
          enum: ["preference", "goal", "habit", "constraint", "correction", "insight"],
          description: "Type of memory: preference (likes/dislikes), goal (what they're working toward), habit (recurring behaviors), constraint (limitations), correction (user corrected you), insight (observed pattern)",
        },
        importance: {
          type: "number",
          description: "1-10, how important is this to remember? 10 = critical preference, 1 = minor detail",
          minimum: 1,
          maximum: 10,
        },
      },
      required: ["content", "category"],
    },
  },

  {
    name: "recall_memories",
    description:
      "Retrieve stored memories about the user. Use this when you need to check what you know about their preferences, goals, or past corrections before making suggestions.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          enum: ["preference", "goal", "habit", "constraint", "correction", "insight", "all"],
          description: "Filter by category, or 'all' for everything",
        },
        limit: {
          type: "number",
          description: "Max number of memories to retrieve (default 20)",
          maximum: 50,
        },
      },
    },
  },

  {
    name: "analyze_schedule_health",
    description:
      "Analyze the user's schedule for problems and opportunities. Detects: conflicts, overload periods, missing prep time before exams, lack of breaks, poor time distribution. Use this proactively when the user loads the app or after major schedule changes. Returns actionable insights.",
    input_schema: {
      type: "object" as const,
      properties: {
        daysAhead: {
          type: "number",
          description: "How many days ahead to analyze (default 14)",
          maximum: 90,
        },
        focus: {
          type: "string",
          enum: ["all", "conflicts", "workload", "balance", "exams"],
          description: "What aspect to focus on, or 'all' for comprehensive analysis",
        },
      },
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
  disambiguate_event: "Finding matching events…",
  create_or_find_class_hub: "Setting up class…",
  list_class_hubs: "Loading classes…",
  remember: "Saving to memory…",
  recall_memories: "Recalling memories…",
  analyze_schedule_health: "Analyzing schedule…",
};
