@echo off
echo Running Prisma migration for Lead module...
cd backend
call npx prisma migrate dev --name add_lead_module
call npx prisma generate
echo Migration completed!
pause
