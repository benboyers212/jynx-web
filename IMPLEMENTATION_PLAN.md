# JYNX BACKEND IMPLEMENTATION PLAN
**Date:** 2026-02-14
**Goal:** Build connected, persistent, AI-ready data layer

---

## OVERVIEW

Transform Jynx from UI shell to fully persistent application where:
- All user data persists in Postgres
- Data is connected (User → Events → Notes/Files/Tasks)
- Single canonical system per concept (no duplicates)
- UI surfaces fetch real data via APIs
- Backend is AI-ready for future context retrieval

---

## PHASE 1: FIX CRITICAL BUGS & ADD MISSING RELATIONS

**Goal:** Fix broken systems and establish proper data relationships

### 1.1 Fix Reminder Model Bug ✅ CRITICAL
**Problem:** Reminder API uses userId directly, but should query via User.id after looking up clerkUserId

**Changes:**
- Add `user` relation to Reminder model in schema
- Add `@@index([userId])`
- Add `onDelete: Cascade`
- Update Reminder API routes to use proper auth flow
- Run migration

**Files:**
- `prisma/schema.prisma`
- `app/api/reminders/route.ts`
- `app/api/reminders/[id]/route.ts`

**Migration:**
```bash
npx prisma migrate dev --name fix_reminder_user_relation
```

### 1.2 Add Group Model
**Problem:** File.groupId references non-existent Group

**Changes:**
- Add Group model to schema
- Add GroupMember model (join table)
- Add relations: Group ↔ File, Group ↔ User (via GroupMember)
- Add Group ↔ Conversation, Group ↔ Note, Group ↔ Task
- Run migration

**Files:**
- `prisma/schema.prisma`

**Migration:**
```bash
npx prisma migrate dev --name add_group_model
```

### 1.3 Add Missing User Relations
**Problem:** File and Note lack explicit User relation

**Changes:**
- Add `user User @relation(...)` to File model
- Add User.files relation
- Add User.notes relation (prepare for canonical notes)

**Files:**
- `prisma/schema.prisma`

**Migration:**
```bash
npx prisma migrate dev --name add_user_file_note_relations
```

---

## PHASE 2: CANONICAL SYSTEMS (Notes, Tasks, Files, Chat)

**Goal:** Unify duplicated systems into single source of truth

### 2.1 Migrate EventNote → Note (Canonical Notes)

**Current:** EventNote is event-specific only
**Target:** Note model supports polymorphic context (event/class/workout/group/standalone)

**Changes:**
- Create Note model with optional eventId/classHubId/workoutHubId/groupId
- Migrate existing EventNote data to Note
- Keep EventNote table temporarily for backward compat
- Update File model: add `noteId` field (type="note" files link to Note)
- Update Notes API to create Note + File entry properly
- Fix orphaned File cleanup on Note delete

**Files:**
- `prisma/schema.prisma` - Add Note model
- `app/api/events/[id]/notes/route.ts` - Use Note instead of EventNote
- `app/api/notes/route.ts` - NEW: canonical notes CRUD
- Migration script to copy EventNote → Note

**Migration:**
```bash
npx prisma migrate dev --name add_canonical_note_model
```

**Data Migration Script:**
```typescript
// scripts/migrate-event-notes.ts
// Copy EventNote → Note, create File links, then drop EventNote
```

### 2.2 Unify Tasks (Assignment → Task)

**Current:** Assignment is event-specific; my-time goals are hardcoded
**Target:** Task model supports all task types (assignment, goal, standalone)

**Changes:**
- Create Task model with `taskType` field ("task", "assignment", "goal")
- Add polymorphic context: eventId/classHubId/groupId optional
- Migrate existing Assignment data to Task
- Update Task API to handle all types
- Wire my-time goals to Task API

**Files:**
- `prisma/schema.prisma` - Add Task model
- `app/api/tasks/route.ts` - NEW: canonical tasks CRUD
- `app/api/events/[id]/tasks/route.ts` - Event-scoped tasks
- Migration script to copy Assignment → Task

**Migration:**
```bash
npx prisma migrate dev --name add_canonical_task_model
```

### 2.3 Fix File-Note Relationship

**Current:** Creating EventNote auto-creates File entry (duplicate data)
**Target:** File.type="note" links to Note.id; no content duplication

**Changes:**
- File model already has `noteId` (from 2.1)
- Update Notes API: create Note, then create File with noteId reference
- Update File delete: if type="note", optionally delete linked Note
- Update FilesPanel to fetch note content via noteId

**Files:**
- `app/api/notes/route.ts` - POST creates Note + File(noteId=...)
- `app/api/notes/[id]/route.ts` - DELETE handles File cleanup
- `components/events/FilesPanel.tsx` - Fetch note content for type="note"

### 2.4 Extend Conversation for Groups

**Current:** Conversation is 1:1 user-AI only
**Target:** Conversation supports group chat

**Changes:**
- Add `conversationType` field ("user" | "group")
- Add `groupId` optional field
- Update Conversation API to handle group mode
- Add group chat endpoints

**Files:**
- `prisma/schema.prisma` - Add conversationType, groupId to Conversation
- `app/api/conversations/route.ts` - Support group conversations
- `app/api/groups/[id]/chat/route.ts` - NEW: group chat endpoints

**Migration:**
```bash
npx prisma migrate dev --name add_group_conversations
```

---

## PHASE 3: EVENT HUBS (ClassHub, WorkoutHub)

**Goal:** Enable recurring events to share canonical data

### 3.1 Add ClassHub Model

**Purpose:** Canonical class info (course code, instructor, semester) shared across all class events

**Changes:**
- Add ClassHub model to schema
- Add ScheduleBlock.classHubId optional field
- Add relations: ClassHub ↔ Note, File, Task, ScheduleBlock
- Create ClassHub CRUD API
- Update event creation to optionally link to ClassHub

**Files:**
- `prisma/schema.prisma` - Add ClassHub
- `app/api/classes/route.ts` - NEW: ClassHub CRUD
- `app/api/classes/[id]/route.ts` - ClassHub detail
- `app/api/events/route.ts` - Accept classHubId on create

**Migration:**
```bash
npx prisma migrate dev --name add_class_hub
```

### 3.2 Add WorkoutHub Model

**Purpose:** Canonical workout routine (e.g., "PPL Split") shared across workout events

**Changes:**
- Add WorkoutHub model to schema
- Add ScheduleBlock.workoutHubId optional field
- Add relations: WorkoutHub ↔ Note, File, WorkoutLog, ScheduleBlock
- Create WorkoutHub CRUD API
- Update workout event creation to optionally link to WorkoutHub

**Files:**
- `prisma/schema.prisma` - Add WorkoutHub
- `app/api/workouts/route.ts` - NEW: WorkoutHub CRUD
- `app/api/workouts/[id]/route.ts` - WorkoutHub detail
- `app/api/events/route.ts` - Accept workoutHubId on create

**Migration:**
```bash
npx prisma migrate dev --name add_workout_hub
```

---

## PHASE 4: SCHEMA REFINEMENTS

**Goal:** Improve data quality, validation, and AI readiness

### 4.1 Add eventType Field to ScheduleBlock

**Current:** Only "category" string exists
**Target:** Explicit eventType enum with validation

**Changes:**
- Add `eventType` field to ScheduleBlock
- Backfill existing data (copy category → eventType)
- Add index on eventType
- Update event creation to validate eventType

**Files:**
- `prisma/schema.prisma` - Add eventType String field
- `app/api/events/route.ts` - Validate eventType enum
- Migration to backfill data

**Migration:**
```bash
npx prisma migrate dev --name add_event_type_field
```

### 4.2 Add AI Retrieval Fields

**Changes:**
- Add Note.title (optional summary for search)
- Add ScheduleBlock.description (separate from location/notes)
- Add Task.priority field
- Add indexes for search/retrieval (createdAt, updatedAt)

**Files:**
- `prisma/schema.prisma`

**Migration:**
```bash
npx prisma migrate dev --name add_ai_retrieval_fields
```

### 4.3 Add Input Validation (Zod)

**Changes:**
- Create `/lib/validations/events.ts` with Zod schemas
- Create `/lib/validations/notes.ts`
- Create `/lib/validations/tasks.ts`
- Apply validation to all POST/PATCH routes
- Return proper error messages

**Files:**
- `lib/validations/*.ts` - NEW: Zod schemas
- All API routes - Add validation

---

## PHASE 5: API LAYER IMPROVEMENTS

**Goal:** Consistent, safe, validated API endpoints

### 5.1 Fix Unsafe Body Spreads

**Problem:** Routes spread request body directly into Prisma (security risk)

**Changes:**
- Whitelist fields in POST /api/events
- Whitelist fields in PATCH /api/events/[id]
- Whitelist fields in PATCH /api/events/[id]/tasks/[taskId]
- Use Zod schemas to validate + transform

**Files:**
- `app/api/events/route.ts`
- `app/api/events/[id]/route.ts`
- `app/api/tasks/[id]/route.ts`

### 5.2 Create Shared API Client

**Changes:**
- Create `/lib/api-client.ts` with typed fetch wrappers
- Add error handling, loading states, type safety
- Replace duplicated fetch logic in pages/components

**Files:**
- `lib/api-client.ts` - NEW
- `app/chat/page.tsx` - Use api-client
- `app/my-time/page.tsx` - Use api-client
- Other pages as needed

### 5.3 Standardize Response Format

**Current:** Mix of `{ok, data}`, raw objects, `{success}`
**Target:** Consistent `{success, data, error}` shape

**Changes:**
- Update all API routes to return standard format
- Update frontend to expect standard format

**Files:**
- All `/app/api/*` routes

### 5.4 Add Missing CRUD Endpoints

**Changes:**
- GET /api/files (user's all files)
- GET /api/files/[id]
- PATCH /api/files/[id]
- DELETE /api/files/[id]
- GET /api/medications/[id]
- PATCH /api/medications/[id]
- GET /api/onboarding/response (retrieve answers)

**Files:**
- `app/api/files/route.ts` - NEW
- `app/api/files/[id]/route.ts` - NEW
- `app/api/medications/[id]/route.ts` - Add GET, PATCH
- `app/api/onboarding/response/route.ts` - Add GET

---

## PHASE 6: UI WIRING (Replace Mock Data)

**Goal:** Connect all UI surfaces to real APIs

### 6.1 Schedule Event Modal

**Current:** Passes empty arrays to EventDetailModal
**Target:** Fetch full event bundle on open

**Changes:**
- Add `useEffect` in page.tsx to fetch `/api/events/${id}` when modal opens
- Replace hardcoded empty arrays with fetched data
- Add loading state
- Refetch on mutations

**Files:**
- `app/page.tsx` (Schedule page)
- `components/events/EventDetailModal.tsx`

### 6.2 My Time Page

**Current:** Hardcoded MOCK_DATA, GOALS, INSIGHTS
**Target:** Fetch from API

**Changes:**
- Create `/api/insights` endpoints (placeholder for now)
- Wire goals to Task API (taskType="goal")
- Wire check-in questions to Note API or new CheckIn model
- Replace all mock data with API calls

**Files:**
- `app/my-time/page.tsx`
- `app/api/insights/route.ts` - NEW (stub)
- `app/api/tasks/route.ts` - Filter by taskType

### 6.3 Groups Page

**Current:** Hardcoded MOCK_GROUPS
**Target:** Fetch from Group API

**Changes:**
- Create Group CRUD API
- Create GroupMember API
- Fetch groups on page load
- Wire group chat to Conversation API (conversationType="group")
- Wire group files to File API (groupId filter)

**Files:**
- `app/groups/page.tsx`
- `app/api/groups/route.ts` - NEW
- `app/api/groups/[id]/route.ts` - NEW
- `app/api/groups/[id]/members/route.ts` - NEW

### 6.4 Files Page

**Current:** Hardcoded mock files
**Target:** Fetch from File API

**Changes:**
- Fetch all user files on load
- Filter by context (personal vs group)
- Wire file upload/delete to API
- Show real file metadata

**Files:**
- `app/files/page.tsx`
- `app/api/files/route.ts` - GET all user files

### 6.5 Event Detail Components

**Current:** Show data but no create/edit functionality
**Target:** Full CRUD

**Changes:**
- ClassEventDetail: Wire assignment creation to Task API
- WorkoutEventDetail: Wire workout log creation to WorkoutLog API
- All detail views: Wire file attachment to File API
- All detail views: Wire notes to Note API
- Add loading/error states

**Files:**
- `components/events/ClassEventDetail.tsx`
- `components/events/WorkoutEventDetail.tsx`
- `components/events/WorkEventDetail.tsx`
- `components/events/FilesPanel.tsx`

---

## PHASE 7: POLISH & PRODUCTION

**Goal:** Production-ready reliability

### 7.1 Error Boundaries

**Changes:**
- Add error boundary around EventDetailModal
- Add error boundary around main app sections
- Toast notifications for failures

**Files:**
- `components/ErrorBoundary.tsx` - NEW
- `app/layout.tsx`

### 7.2 Loading States

**Changes:**
- Skeleton loaders for modal content
- Button loading states during mutations
- Optimistic updates with rollback

**Files:**
- All detail components
- `components/ui/Skeleton.tsx` - NEW

### 7.3 Validation Everywhere

**Changes:**
- Client-side validation on forms
- Server-side Zod validation on all routes
- Clear error messages

**Files:**
- All form components
- All API routes

---

## MIGRATION STRATEGY

### Phase Execution Order:
1. **Phase 1** (Critical bugs) - Execute immediately, fixes broken reminders
2. **Phase 2** (Canonical systems) - Foundation for everything else
3. **Phase 3** (Hubs) - Optional but enables rich class/workout features
4. **Phase 4** (Schema refinements) - Can run in parallel with Phase 5
5. **Phase 5** (API improvements) - Before Phase 6
6. **Phase 6** (UI wiring) - Final connection
7. **Phase 7** (Polish) - Ongoing

### Database Migrations:
- Each sub-phase with schema changes = one migration
- Run `npx prisma migrate dev --name <descriptive_name>`
- Never skip migrations (breaks production)
- Keep migration scripts in `/prisma/migrations`

### Data Backfill Scripts:
- For EventNote → Note: `/scripts/migrate-event-notes.ts`
- For Assignment → Task: `/scripts/migrate-assignments.ts`
- Run via `tsx scripts/<name>.ts` after migration

### Testing After Each Phase:
- Verify old functionality still works
- Test new endpoints via Postman/curl
- Check UI pages load without errors
- Verify data appears correctly

---

## SUCCESS CRITERIA

After full implementation:

✅ **All data persists in Postgres**
- Events, notes, files, tasks, conversations, groups, onboarding

✅ **Connected data graph**
- User → Events → Notes/Files/Tasks
- ClassHub → Events → Notes/Files/Tasks
- Group → Members/Chat/Files/Tasks

✅ **No duplicated systems**
- One Note model (not EventNote + separate notes)
- One Task model (not Assignment + goals + tasks)
- One Conversation model (user + group modes)
- One File model (all contexts)

✅ **AI-ready**
- Normalized eventType, taskType, conversationType
- Searchable titles and content
- Proper timestamps and indexes
- Clear retrieval paths

✅ **UI fully wired**
- Schedule modal fetches real data
- My Time shows real goals/insights
- Groups page uses real Group API
- Files page shows real files
- All mutations persist

✅ **Validated & safe**
- Zod validation on all routes
- No unsafe body spreads
- Proper auth checks
- Error boundaries

---

## IMPLEMENTATION START: PHASE 1.1

Begin with fixing Reminder model bug (most critical, affects existing functionality).

**Next file to edit:** `prisma/schema.prisma`
