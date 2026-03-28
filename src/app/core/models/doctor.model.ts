export interface Doctor {
  id: number;
  name: string;
  email: string;
  specializations: string[];
  hospitals: string[];
  cases: number;
  rating: number;
  status: 'Active' | 'Inactive' | 'Pending';
  avatarInitials: string;
  avatarColor: string;
  joined: string;
  phone?: string;
  pmdc?: string;
}

export interface HospitalEntry {
  name: string;
  city: string;
}
