import { PrismaClient } from '@prisma/client';

const basePrisma = new PrismaClient();

const prisma = basePrisma.$extends({
  result: {
    customer: {
      phone: {
        needs: { phone: true },
        compute(data) {
          return data.phone?.startsWith('deleted_') ? 'N/A (Anonymized)' : data.phone;
        }
      },
      email: {
        needs: { email: true },
        compute(data) {
          return data.email?.startsWith('deleted_') ? 'N/A (Anonymized)' : data.email;
        }
      }
    },
    driver: {
      phone: {
        needs: { phone: true },
        compute(data) {
          return data.phone?.startsWith('deleted_') ? 'N/A (Anonymized)' : data.phone;
        }
      },
      email: {
        needs: { email: true },
        compute(data) {
          return data.email?.startsWith('deleted_') ? 'N/A (Anonymized)' : data.email;
        }
      }
    },
    lead: {
      phone: {
        needs: { phone: true },
        compute(data) {
          return data.phone?.startsWith('deleted_') ? 'N/A (Anonymized)' : data.phone;
        }
      },
      email: {
        needs: { email: true },
        compute(data) {
          return data.email?.startsWith('deleted_') ? 'N/A (Anonymized)' : data.email;
        }
      }
    }
  }
});

export default prisma;