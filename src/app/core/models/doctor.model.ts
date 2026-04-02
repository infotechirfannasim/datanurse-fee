export interface Doctor {
  _id: number;
  firstName: string;
  lastName: string;
  email: string;
  specialities: string[];
  hospitalAffiliations: any[];
  cases: number;
  rating: number;
  status: 'Active' | 'Inactive' | 'Pending';
  avatarInitials: string;
  avatarColor: string;
  createdAt: string;
  phone?: string;
  pmdc?: string;
  profileImage: any;
  role: any;
}

export interface HospitalEntry {
  name: string;
  city: string;
}
