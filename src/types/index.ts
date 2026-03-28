export type UserRole = 'passenger' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoUrl?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
}

export type TripStatus = 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
export type SeatClass = 'Economy' | 'Business' | 'First Class';

export interface Trip {
  id: string;
  tripName: string;
  vesselName: string;
  vesselImage?: string;
  origin: string;
  destination: string;
  departureDate: string; // ISO string
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
  status: TripStatus;
  totalSeats: number;
  availableSeats: number;
  totalCargoCapacity: number; // kg
  availableCargoCapacity: number;
  pricing: {
    economy: number;
    business: number;
    firstClass: number;
  };
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PassengerType = 'adult' | 'student' | 'child' | 'senior' | 'infant';

export interface PassengerDetail {
  firstName: string;
  lastName: string;
  age: number;
  type: PassengerType;
  idType?: string;
  idNumber?: string;
  seatNumber?: string;
  seatClass: SeatClass;
}

export interface CargoDetail {
  description: string;
  weight: number; // kg
  dimensions?: string;
}

export type VehicleWheels = '2-wheel' | '4-wheel';

export interface VehicleDetail {
  plateNumber: string;
  vehicleType: string; // e.g. "🏍️ Motorcycle", "🚗 Sedan / Car"
  wheels: VehicleWheels; // kept for backward compat
  fare: number;
}

export interface Booking {
  id: string;
  bookingRef: string;
  passengerId: string;
  passengerName: string;
  passengerEmail: string;
  tripId: string;
  trip?: Trip;
  passengers: PassengerDetail[];
  cargo?: CargoDetail[];
  vehicles?: VehicleDetail[];
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  paymentMethod?: string;
  qrCodeUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManifestEntry {
  bookingRef: string;
  passengerName: string;
  origin: string;
  destination: string;
  departureDate: string;
  seatClass: string;
  seatNumber?: string;
  idType?: string;
  idNumber?: string;
  status: BookingStatus;
}

export interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalPassengers: number;
  activeTrips: number;
}
