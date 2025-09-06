#!/bin/bash

# Cal.com Migration Cleanup Script
# This script removes the old calendar components after successful migration

echo "🧹 Cal.com Migration Cleanup Script"
echo "This will remove old calendar components that are no longer needed."
echo ""

# List files to be removed
echo "Files to be removed:"
echo "  - src/components/availability-calendar.tsx"
echo "  - src/components/availability-list.tsx"
echo "  - src/components/availability-slot-form.tsx"
echo "  - src/app/recruiter/calendar/_modules/availability-selector.tsx"
echo "  - src/app/recruiter/calendar/_modules/calendar-integration.tsx"
echo "  - src/app/recruiter/calendar/_modules/calendar-view.tsx"
echo ""

# Confirm with user
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled."
    exit 1
fi

echo "🗑️  Removing old calendar components..."

# Remove old availability components
if [ -f "src/components/availability-calendar.tsx" ]; then
    rm "src/components/availability-calendar.tsx"
    echo "✅ Removed availability-calendar.tsx"
else
    echo "⚠️  availability-calendar.tsx not found"
fi

if [ -f "src/components/availability-list.tsx" ]; then
    rm "src/components/availability-list.tsx"
    echo "✅ Removed availability-list.tsx"
else
    echo "⚠️  availability-list.tsx not found"
fi

if [ -f "src/components/availability-slot-form.tsx" ]; then
    rm "src/components/availability-slot-form.tsx"
    echo "✅ Removed availability-slot-form.tsx"
else
    echo "⚠️  availability-slot-form.tsx not found"
fi

# Remove old recruiter calendar modules
if [ -f "src/app/recruiter/calendar/_modules/availability-selector.tsx" ]; then
    rm "src/app/recruiter/calendar/_modules/availability-selector.tsx"
    echo "✅ Removed availability-selector.tsx"
else
    echo "⚠️  availability-selector.tsx not found"
fi

if [ -f "src/app/recruiter/calendar/_modules/calendar-integration.tsx" ]; then
    rm "src/app/recruiter/calendar/_modules/calendar-integration.tsx"
    echo "✅ Removed calendar-integration.tsx"
else
    echo "⚠️  calendar-integration.tsx not found"
fi

if [ -f "src/app/recruiter/calendar/_modules/calendar-view.tsx" ]; then
    rm "src/app/recruiter/calendar/_modules/calendar-view.tsx"
    echo "✅ Removed calendar-view.tsx"
else
    echo "⚠️  calendar-view.tsx not found"
fi

echo ""
echo "🎉 Cleanup completed!"
echo ""
echo "Next steps:"
echo "1. Test the application to ensure everything works correctly"
echo "2. Remove any unused imports in TypeScript files"
echo "3. Run 'pnpm build' to verify no build errors"
echo "4. Consider removing related types if no longer used"
echo ""
echo "If you need to restore any files, they should be available in your git history."