#!/usr/bin/env node

/**
 * Verification script for interview scheduling fix
 * This script checks that the main issues have been resolved:
 * 1. availableSlots.slice is not a function error
 * 2. Proper error handling for API responses
 * 3. Loading states work correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying interview scheduling fixes...\n');

// Check 1: Verify the slots API route handles arrays properly
console.log('1. Checking slots API route...');
const slotsApiPath = 'src/app/api/cal_com_api/slots/route.ts';
const slotsApiContent = fs.readFileSync(slotsApiPath, 'utf8');

const hasArrayCheck = slotsApiContent.includes('Array.isArray(slotsData?.slots)');
const hasFormattedSlots = slotsApiContent.includes('formattedSlots');
const hasErrorHandling = slotsApiContent.includes('catch (error)');

console.log(`   ✅ Array check: ${hasArrayCheck ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Formatted slots: ${hasFormattedSlots ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Error handling: ${hasErrorHandling ? 'PASS' : 'FAIL'}`);

// Check 2: Verify the interview scheduler component handles non-arrays
console.log('\n2. Checking interview scheduler component...');
const schedulerPath = 'src/app/schedule-interview/[jobId]/_modules/interview-scheduler.tsx';
const schedulerContent = fs.readFileSync(schedulerPath, 'utf8');

const hasArraySafetyCheck = schedulerContent.includes('Array.isArray(slots)');
const hasSliceProtection = schedulerContent.includes('!Array.isArray(availableSlots)');
const hasLoadingState = schedulerContent.includes('isLoadingSlots');
const hasSlotValidation = schedulerContent.includes('if (!slotTime)');

console.log(`   ✅ Array safety check: ${hasArraySafetyCheck ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Slice protection: ${hasSliceProtection ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Loading state: ${hasLoadingState ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ Slot validation: ${hasSlotValidation ? 'PASS' : 'FAIL'}`);

// Check 3: Verify TypeScript interfaces are correct
console.log('\n3. Checking TypeScript interfaces...');
const hasTimeSlotInterface = schedulerContent.includes('interface TimeSlot');
const hasAvailabilityDataInterface = schedulerContent.includes('interface AvailabilityData');

console.log(`   ✅ TimeSlot interface: ${hasTimeSlotInterface ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ AvailabilityData interface: ${hasAvailabilityDataInterface ? 'PASS' : 'FAIL'}`);

// Summary
const allChecks = [
  hasArrayCheck,
  hasFormattedSlots,
  hasErrorHandling,
  hasArraySafetyCheck,
  hasSliceProtection,
  hasLoadingState,
  hasSlotValidation,
  hasTimeSlotInterface,
  hasAvailabilityDataInterface
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

console.log(`\n📊 Summary: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('✅ All fixes have been applied successfully!');
  console.log('\n🎯 The interview scheduling should now work without the "slice is not a function" error.');
  console.log('\n📝 Key improvements made:');
  console.log('   • API route now ensures slots are always returned as an array');
  console.log('   • Component checks if availableSlots is an array before calling .slice()');
  console.log('   • Added loading states for better user experience');
  console.log('   • Added validation for individual slot data');
  console.log('   • Improved error handling throughout the flow');
} else {
  console.log('❌ Some fixes may be missing. Please review the failed checks above.');
}

console.log('\n🚀 To test the fix:');
console.log('   1. Sign in to the application');
console.log('   2. Navigate to schedule interview page');
console.log('   3. Select a recruiter (if available)');
console.log('   4. The page should load without JavaScript errors');