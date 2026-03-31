import {Component, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ToastService} from '../../core/services/toast.service';
import {AuthService} from "../../core/services/auth.service";

interface NavItem {
  key: string;
  label: string;
  icon: string;
  cmd?: () => void;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: 'settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private toastService = inject(ToastService);
  private authServicee = inject(AuthService);
  navItems: NavItem[] = [
    {key: 'general', label: 'General', icon: '⚙️'},
    {key: 'notifications', label: 'Notifications', icon: '🔔'},
    {key: 'permissions', label: 'Permissions', icon: '🔒'},
    {key: 'integrations', label: 'Integrations', icon: '🔗'},
    {key: 'danger', label: 'Danger Zone', icon: '⚠️'},
    {key: 'logout', label: 'Logout', icon: '⚠️', cmd: () => this.logout()}
  ]
  activeSection = signal<'general' | 'notifications' | 'permissions' | 'integrations' | 'danger'>('general');

  general = {
    platformName: 'DataNurse',
    timezone: 'Asia/Karachi',
    language: 'English (UK)',
    dateFormat: 'DD/MM/YYYY',
    currency: 'PKR',
    maintenanceMode: false,
  };

  notifications = {
    emailNewDoctor: true,
    emailNewCase: true,
    emailReports: false,
    emailSystem: true,
    pushAll: true,
    pushCritical: true,
  };

  timezones = ['Asia/Karachi', 'Asia/Dubai', 'Europe/London', 'America/New_York', 'UTC'];
  languages = ['English (UK)', 'English (US)', 'Urdu', 'Arabic'];
  dateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

  saveGeneral(): void {
    this.toastService.show('General settings saved!', 'success');
  }

  saveNotifications(): void {
    this.toastService.show('Notification preferences updated!', 'success');
  }

  clearCache(): void {
    this.toastService.show('Cache cleared successfully.', 'success');
  }

  dangerAction(action: string): void {
    this.toastService.show(`${action} — This is a demo environment.`, 'error');
  }

  onItemClick(item: any) {
    this.activeSection.set(item.key);

    if (item.cmd) {
      item.cmd();
    }
  }

  logout() {
    this.authServicee.logout()
  }
}
