@echo off
echo Removing Finance System Files...

REM Remove migration files
echo Removing migration files...
del /q "supabase\migrations\060_finance_management_system.sql" 2>nul
del /q "supabase\migrations\061_finance_integration_triggers.sql" 2>nul

REM Remove finance components
echo Removing finance components...
del /q "components\admin\FinanceManagement.tsx" 2>nul
del /q "components\admin\FinanceDashboard.tsx" 2>nul
del /q "components\admin\RealTimeFinanceMonitor.tsx" 2>nul
del /q "components\admin\VendorPayoutManagement.tsx" 2>nul
del /q "components\admin\RevenueManagement.tsx" 2>nul
del /q "components\admin\FinanceReports.tsx" 2>nul
del /q "components\admin\FinanceSubNavigation.tsx" 2>nul

REM Remove finance pages
echo Removing finance pages...
rmdir /s /q "app\admin\finance" 2>nul

REM Remove test scripts
echo Removing test scripts...
del /q "scripts\test-finance-integration.js" 2>nul
del /q "scripts\cleanup-incorrect-finance-data.sql" 2>nul
del /q "scripts\selective-finance-cleanup.sql" 2>nul
del /q "scripts\quick-finance-cleanup.sql" 2>nul

echo Finance system files removed successfully!
echo.
echo NOTE: You still need to manually:
echo 1. Remove finance-related types from types/database.ts
echo 2. Remove Finance tab from AdminLayoutWrapper.tsx navigation
echo 3. Remove finance integration from checkout/page.tsx
echo 4. Run the database cleanup SQL script
pause







