export interface Case {
  id: string;
  patientName: string;
  patientId: string;
  avatarColor: string;
  avatarInitials: string;
  doctor: string;
  diagnosis: string;
  status: 'Active' | 'Recovered' | 'Pending' | 'Critical';
  date: string;
  priority: 'High' | 'Medium' | 'Low';
}
