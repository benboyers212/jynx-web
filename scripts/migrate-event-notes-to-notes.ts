/**
 * Data migration script: Migrate EventNote → Note
 * Creates Note records from existing EventNotes and creates File links
 *
 * Run with: npx tsx scripts/migrate-event-notes-to-notes.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting EventNote → Note migration...\n');

  // Get all EventNotes
  const eventNotes = await prisma.eventNote.findMany({
    include: {
      event: {
        select: { title: true, category: true }
      }
    }
  });

  console.log(`Found ${eventNotes.length} EventNotes to migrate\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const eventNote of eventNotes) {
    try {
      // Check if Note already exists for this EventNote
      const existingNote = await prisma.note.findFirst({
        where: {
          userId: eventNote.userId,
          eventId: eventNote.eventId,
          content: eventNote.content,
        }
      });

      if (existingNote) {
        console.log(`✓ Note already exists for EventNote ${eventNote.id}`);
        skipped++;
        continue;
      }

      // Create Note
      const note = await prisma.note.create({
        data: {
          userId: eventNote.userId,
          eventId: eventNote.eventId,
          content: eventNote.content,
          title: `Note - ${eventNote.event.title}`,
          createdAt: eventNote.createdAt,
          updatedAt: eventNote.updatedAt,
        }
      });

      // Create File entry for this note
      await prisma.file.create({
        data: {
          userId: eventNote.userId,
          eventId: eventNote.eventId,
          noteId: note.id,
          name: `Note - ${new Date(note.createdAt).toLocaleDateString()}`,
          type: 'note',
          category: eventNote.event.category.charAt(0).toUpperCase() + eventNote.event.category.slice(1),
          createdAt: eventNote.createdAt,
          updatedAt: eventNote.updatedAt,
        }
      });

      console.log(`✓ Migrated EventNote ${eventNote.id} → Note ${note.id}`);
      created++;
    } catch (error) {
      console.error(`✗ Error migrating EventNote ${eventNote.id}:`, error);
      errors++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total processed: ${eventNotes.length}`);

  if (created === eventNotes.length) {
    console.log('\n✓ All EventNotes successfully migrated to Note!');
    console.log('Note: EventNote table is kept for backward compatibility.');
    console.log('New notes should use the Note model going forward.');
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
