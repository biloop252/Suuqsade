@echo off
REM Promotional Media System Setup Script for Windows

echo 🚀 Setting up Promotional Media System...

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found. Please install it first:
    echo    npm install -g supabase
    pause
    exit /b 1
)

REM Check if we're in a Supabase project
if not exist "supabase\config.toml" (
    echo ❌ Not in a Supabase project directory
    echo    Please run this script from your project root
    pause
    exit /b 1
)

echo 📋 Running database migrations...

REM Run migration 051 (main promotional media tables)
echo 1. Running migration 051 (promotional media tables)...
supabase db push --include-all

if %errorlevel% equ 0 (
    echo ✅ Migration 051 completed successfully
) else (
    echo ❌ Migration 051 failed
    echo    Check the error messages above
    pause
    exit /b 1
)

REM Try migration 052 (storage bucket) - optional
echo 2. Running migration 052 (storage bucket)...
supabase db push --include-all

if %errorlevel% equ 0 (
    echo ✅ Migration 052 completed successfully
) else (
    echo ⚠️  Migration 052 failed (this is optional)
    echo    Storage functionality will be limited
    echo    You can set up storage policies manually later
)

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Start your development server: npm run dev
echo 2. Navigate to: http://localhost:3000/admin/promotional-media
echo 3. Create your first promotional media item
echo.
echo If you encounter errors:
echo 1. Check the browser console for specific error messages
echo 2. Run: node scripts/check-promotional-media-db.js
echo 3. Verify your Supabase connection in .env.local
echo.
pause


