import {Component, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ToastService} from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  private toastService = inject(ToastService);

  activeTab = signal<'personal' | 'security' | 'activity'>('personal');

  profile = {
    firstName: 'Dr. Admin',
    lastName: 'Shah',
    name: 'Dr. Admin Shah',
    email: 'admin.shah@datanurse.pk',
    phone: '+92-300-0000000',
    role: 'Super Admin',
    department: 'Administration',
    joined: 'January 2024',
    bio: 'Platform administrator responsible for overseeing the DataNurse medical data management system. Managing 284+ registered physicians and 1,800+ patient cases.',
    location: 'Lahore, Pakistan',
  };

  password = { current: '', newPwd: '', confirm: '' };

  recentActivity = [
    { action: 'Added Dr. Omar Farooq to the registry', time: '2 minutes ago', type: 'create' },
    { action: 'Updated Case PT-2024-8892 status to Recovered', time: '18 minutes ago', type: 'update' },
    { action: 'Generated Q1-2026 Summary Report', time: '1 hour ago', type: 'report' },
    { action: 'Removed Dr. Bilal Ahmed (archived)', time: '3 hours ago', type: 'delete' },
    { action: 'Logged in from Lahore, PK', time: 'Today, 9:00 AM', type: 'login' },
  ];

  saveProfile(): void {
    this.toastService.show('Profile updated successfully!', 'success');
  }

  changePassword(): void {
    if (!this.password.current || !this.password.newPwd) {
      this.toastService.show('Please fill in all password fields.', 'error');
      return;
    }
    if (this.password.newPwd !== this.password.confirm) {
      this.toastService.show('New passwords do not match.', 'error');
      return;
    }
    this.toastService.show('Password changed successfully!', 'success');
    this.password = { current: '', newPwd: '', confirm: '' };
  }

  getActivityColor(type: string): string {
    const m: Record<string, string> = { create: '#22C55E', update: '#2251CC', report: '#F59E0B', delete: '#E8344A', login: '#5B4FCF' };
    return m[type] ?? '#7A8BB0';
  }
}
