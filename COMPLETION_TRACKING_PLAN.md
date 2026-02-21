# Event Completion & Pattern Learning Implementation Plan

## Overview
Add completion tracking to events so AI can learn actual time spent vs scheduled time, improving future scheduling accuracy.

## Database Changes

### New Model: EventCompletion
```prisma
model EventCompletion {
  id                String        @id @default(cuid())
  eventId           String
  event             ScheduleBlock @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId            String

  // Time tracking
  scheduledDuration Int           // minutes (from event start/end)
  actualDuration    Int           // minutes (user reported)
  variance          String        // "just_right" | "shorter" | "longer"

  // AI learning notes
  notes             String?       @db.Text  // Optional feedback for optimization

  completedAt       DateTime      @default(now())

  @@index([eventId])
  @@index([userId])
  @@index([completedAt])
}
```

## UI Components

### 1. Completion Modal (`components/CompletionModal.tsx`)
- Triggered by "Mark Complete" button on events
- Shows:
  - Event title & scheduled duration
  - "How long did this take?"
    - Button: "Just right" (variance: just_right, actual = scheduled)
    - Custom: Hour/minute picker + "Shorter"/"Longer" toggle
  - Optional notes textbox
  - Submit button

### 2. Update EventDetailModal
- Add "Mark Complete" button next to "Drop" button
- Opens CompletionModal when clicked
- Grays out if already completed

## API Routes

### POST /api/events/[id]/complete
```typescript
Body: {
  variance: "just_right" | "shorter" | "longer",
  actualDuration?: number,  // minutes, required if not just_right
  notes?: string
}
Response: { ok: boolean, completion: EventCompletion }
```

## Quick Add Improvements

### Category Filter in Adjust Modal
- Add category toggles: All / Class / Work / Life / Health / etc.
- Filter quick add suggestions by selected category
- Persists selection in local storage

## Pattern Recognition Updates

### AI System Prompt Changes
1. **Don't suggest classes in quick add**
   - Classes are fixed recurring events (already in calendar)
   - Only suggest flexible/new events

2. **Slower pattern detection for meetings**
   - Detect: Same title + similar time + occurs 2-3x/month
   - Only suggest after 3+ occurrences
   - Track: Person name, typical duration, common days

3. **Use completion data for learning**
   - Track actual vs scheduled time per event type
   - Track per-user patterns (e.g., "gym always takes 90min not 60min")
   - Adjust future suggestions based on historical variance

## Smart Note Organization

### When AI receives notes about an event:
1. **Parse for assignments/due dates**
   - Regex: "assignment", "due", "homework", dates
   - Extract: title, due date, description

2. **Route to appropriate section**
   - If class event + assignment mentioned → create Task/Assignment
   - If workout + exercise mentioned → add to workout log
   - Otherwise → add to event description

3. **Context-aware display**
   - Only show assignments in related class events
   - Don't stuff everything in overview
   - Use tabs/sections appropriately

## Implementation Order
1. Database schema + migration
2. CompletionModal component
3. Update EventDetailModal with button
4. API route for saving completions
5. Quick add category filter
6. AI prompt updates for pattern recognition
7. Smart note parsing logic

## Questions to Confirm
- Should completion be required or optional? (Currently: optional, can still just close event)
- Should we track partial completions? (e.g., attended 30 of 50 minutes)
- How many historical completions before AI adjusts? (Suggested: 3+)
