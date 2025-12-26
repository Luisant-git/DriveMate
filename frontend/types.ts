
export enum UserRole {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  CUSTOMER = 'CUSTOMER',
  GUEST = 'GUEST'
}

export enum BookingType {
  LOCAL_HOURLY = 'Local - Hourly',
  OUTSTATION = 'Outstation',
  MONTHLY = 'Monthly Driver',
  SPARE = 'Spare Driver',
  TEMPORARY = 'Temporary Driver',
  WEEKLY = 'Weekly Driver',
  DAILY = 'Daily Driver',
  VALET = 'Valet/Wallet Parking',
  ONEWAY = 'One-way Drop',
  TWOWAY = 'Two-way Drop'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  avatarUrl?: string;
  password?: string; // Mock password for change password feature
}

export interface Driver extends User {
  aadharNo: string;
  licenseNo: string;
  altPhone: string[]; // Up to 4 numbers
  upiId?: string; // GPay/PhonePe
  isVerified: boolean;
  packageSubscription?: 'LOCAL' | 'OUTSTATION' | 'ALL' | null;
  subscriptionExpiry?: string;
  documents: {
    photo?: string;
    dl?: string;
    pan?: string;
    aadhar?: string;
  };
  rating: number;
  completedTrips: number;
}

export interface Customer extends User {
  advancePaymentBalance: number;
  addressProofUrl?: string; // Any address id proof
  address?: string;
}

export interface Trip {
  id: string;
  customerId: string;
  driverId?: string;
  type: BookingType;
  pickupLocation: string;
  dropLocation: string;
  startDate: string;
  startTime: string;
  duration?: string; // hours or days
  status: 'PENDING' | 'ACCEPTED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  estimatedCost: number;
  notes?: string;
  rating?: number; // 1-5 stars
}

export interface Package {
  id: string;
  name: string;
  type: 'LOCAL' | 'OUTSTATION' | 'ALL';
  price: number;
  durationDays: number;
  description: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  date: string;
  type: 'SUBSCRIPTION' | 'WALLET_TOPUP' | 'TRIP_COMMISSION';
  status: 'SUCCESS' | 'PENDING';
}
