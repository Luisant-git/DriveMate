# Database Migration Instructions

## Run this command in the backend directory to apply the schema changes:

```bash
cd backend
npx prisma migrate dev --name add_payment_method_to_booking
```

This will:
1. Create a new migration file
2. Add the `paymentMethod` field to the `bookings` table
3. Update the Prisma Client

After running the migration, restart your backend server.
