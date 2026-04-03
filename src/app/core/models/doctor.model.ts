import {User} from "./user.model";

export interface Doctor extends User {
  specialities: string[];
  hospitalAffiliations: any[];
  rating: number;
  status: 'Active' | 'Inactive' | 'Pending';
  avatarInitials: string;
  avatarColor: string;
  pmdc?: string;
  profileImage: any;
  role: any;
}

export interface HospitalEntry {
  name: string;
  city: string;
}
