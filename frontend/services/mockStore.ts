
import { Driver, Customer, Trip, BookingType, UserRole, Package, PaymentRecord } from '../types';

// Mock Data Initialization
const MOCK_DRIVERS: Driver[] = [
  {
    id: 'd1',
    name: 'Ragul V',
    role: UserRole.DRIVER,
    email: 'ragul@example.com',
    phone: '9876543210',
    aadharNo: '1234-5678-9012',
    licenseNo: 'DL-1234567890',
    altPhone: ['9876543211', '9876543212'],
    upiId: 'ragul@okhdfc',
    isVerified: true,
    rating: 4.8,
    completedTrips: 142,
    packageSubscription: 'ALL',
    documents: {
      photo: 'https://picsum.photos/200?random=1',
      dl: 'valid',
      pan: 'valid'
    },
    avatarUrl: 'https://picsum.photos/200?random=1'
  },
  {
    id: 'd2',
    name: 'Suresh Singh',
    role: UserRole.DRIVER,
    email: 'suresh@example.com',
    phone: '9876543211',
    aadharNo: '1234-5678-9013',
    licenseNo: 'DL-1234567891',
    altPhone: [],
    upiId: 'suresh@ybl',
    isVerified: false,
    rating: 4.2,
    completedTrips: 30,
    packageSubscription: null,
    documents: {},
    avatarUrl: 'https://picsum.photos/200?random=2'
  }
];

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Ragul V',
    role: UserRole.CUSTOMER,
    email: 'ragul@example.com',
    phone: '9988776655',
    advancePaymentBalance: 500,
    addressProofUrl: 'verified_doc.jpg',
    address: '#42, 5th Main, Indiranagar, Bangalore',
    avatarUrl: 'https://picsum.photos/200?random=3'
  }
];

const MOCK_TRIPS: Trip[] = [
  {
    id: 't1',
    customerId: 'c1',
    driverId: 'd1',
    type: BookingType.LOCAL_HOURLY,
    pickupLocation: 'Indiranagar, Bangalore',
    dropLocation: 'Koramangala, Bangalore',
    startDate: '2023-10-25',
    startTime: '10:00',
    duration: '4 hours',
    status: 'COMPLETED',
    estimatedCost: 800,
    rating: 5
  },
  {
    id: 't2',
    customerId: 'c1',
    driverId: undefined,
    type: BookingType.OUTSTATION,
    pickupLocation: 'Bangalore',
    dropLocation: 'Mysore',
    startDate: '2023-11-01',
    startTime: '06:00',
    duration: '2 Days',
    status: 'PENDING',
    estimatedCost: 3500
  }
];

const MOCK_PACKAGES: Package[] = [
  { id: 'p1', name: 'Local Driver Pass', type: 'LOCAL', price: 499, durationDays: 30, description: 'Accept unlimited local hourly rides for 30 days' },
  { id: 'p2', name: 'Outstation Pro', type: 'OUTSTATION', price: 999, durationDays: 30, description: 'Accept outstation and long-distance trips' },
  { id: 'p3', name: 'All Access Premium', type: 'ALL', price: 1299, durationDays: 30, description: 'Access to all trip types + Priority support' },
];

const MOCK_PAYMENTS: PaymentRecord[] = [
    { id: 'pay1', userId: 'd1', amount: 1299, date: '2023-10-01', type: 'SUBSCRIPTION', status: 'SUCCESS' }
];

class MockStore {
  drivers: Driver[] = MOCK_DRIVERS;
  customers: Customer[] = MOCK_CUSTOMERS;
  trips: Trip[] = MOCK_TRIPS;
  packages: Package[] = MOCK_PACKAGES;
  payments: PaymentRecord[] = MOCK_PAYMENTS;

  constructor() {
    this.load();
  }

  save() {
    localStorage.setItem('drivemate_data_v2', JSON.stringify({
      drivers: this.drivers,
      customers: this.customers,
      trips: this.trips,
      packages: this.packages,
      payments: this.payments
    }));
  }

  load() {
    const data = localStorage.getItem('drivemate_data_v2');
    if (data) {
      const parsed = JSON.parse(data);
      this.drivers = parsed.drivers || MOCK_DRIVERS;
      this.customers = parsed.customers || MOCK_CUSTOMERS;
      this.trips = parsed.trips || MOCK_TRIPS;
      this.packages = parsed.packages || MOCK_PACKAGES;
      this.payments = parsed.payments || MOCK_PAYMENTS;
    }
  }

  getDriver(id: string) {
    return this.drivers.find(d => d.id === id);
  }

  getTripsForCustomer(customerId: string) {
    return this.trips.filter(t => t.customerId === customerId);
  }

  getTripsForDriver(driverId: string) {
    return this.trips.filter(t => t.driverId === driverId || (t.status === 'PENDING' && !t.driverId));
  }

  addTrip(trip: Trip) {
    this.trips.push(trip);
    this.save();
  }

  updateTripStatus(tripId: string, status: Trip['status'], driverId?: string) {
    const trip = this.trips.find(t => t.id === tripId);
    if (trip) {
      trip.status = status;
      if (driverId) trip.driverId = driverId;
      
      // Update Driver completed trips count if completed
      if (status === 'COMPLETED' && trip.driverId) {
          const driver = this.drivers.find(d => d.id === trip.driverId);
          if (driver) {
              const completedCount = this.trips.filter(t => t.driverId === driver.id && t.status === 'COMPLETED').length;
              driver.completedTrips = completedCount;
          }
      }

      this.save();
    }
  }

  rateTrip(tripId: string, rating: number) {
      const trip = this.trips.find(t => t.id === tripId);
      if (trip) {
          trip.rating = rating;
          
          if (trip.driverId) {
              const driver = this.drivers.find(d => d.id === trip.driverId);
              if (driver) {
                  // Re-calculate average rating
                  const allRatedTrips = this.trips.filter(t => t.driverId === driver.id && t.status === 'COMPLETED' && t.rating);
                  if (allRatedTrips.length > 0) {
                      const sum = allRatedTrips.reduce((acc, curr) => acc + (curr.rating || 0), 0);
                      driver.rating = parseFloat((sum / allRatedTrips.length).toFixed(1));
                  } else {
                      driver.rating = rating; // Fallback for first rating
                  }
              }
          }
          this.save();
      }
  }

  addPayment(payment: PaymentRecord) {
      this.payments.push(payment);
      this.save();
  }

  updateDriverSubscription(driverId: string, type: 'LOCAL' | 'OUTSTATION' | 'ALL') {
      const driver = this.drivers.find(d => d.id === driverId);
      if(driver) {
          driver.packageSubscription = type;
          this.save();
      }
  }

  // Helpers
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const store = new MockStore();
