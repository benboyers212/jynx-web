/**
 * Data migration script: Fix Reminder.userId to use User.id instead of clerkUserId
 *
 * Run with: npx tsx scripts/fix-reminder-user-ids.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Reminder userId fix...\n');

  // Get all reminders
  const reminders = await prisma.reminder.findMany();
  console.log(`Found ${reminders.length} reminders to check\n`);

  let fixed = 0;
  let notFound = 0;
  let errors = 0;

  for (const reminder of reminders) {
    try {
      // Check if userId is already a valid User.id
      const userById = await prisma.user.findUnique({
        where: { id: reminder.userId }
      });

      if (userById) {
        console.log(`✓ Reminder ${reminder.id} already has correct userId`);
        continue;
      }

      // Try to find user by clerkUserId (assuming current userId is actually clerkUserId)
      const userByClerkId = await prisma.user.findUnique({
        where: { clerkUserId: reminder.userId }
      });

      if (userByClerkId) {
        // Update reminder to use correct User.id
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { userId: userByClerkId.id }
        });
        console.log(`✓ Fixed Reminder ${reminder.id}: ${reminder.userId} → ${userByClerkId.id}`);
        fixed++;
      } else {
        // No matching user found - this reminder is orphaned
        console.log(`✗ Reminder ${reminder.id} has no matching user (userId: ${reminder.userId})`);
        console.log(`  → Will delete orphaned reminder`);
        await prisma.reminder.delete({ where: { id: reminder.id } });
        notFound++;
      }
    } catch (error) {
      console.error(`✗ Error processing reminder ${reminder.id}:`, error);
      errors++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Fixed: ${fixed}`);
  console.log(`Deleted (orphaned): ${notFound}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total processed: ${reminders.length}`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
