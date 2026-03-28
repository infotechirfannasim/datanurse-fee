import { Component, signal, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {
  private toastService = inject(ToastService);

  activeTab = signal<'overview' | 'doctors' | 'cases' | 'financial'>('overview');

  kpis = [
    { label: 'Total Cases YTD',    value: '12,483', trend: '+18%', trendType: 'up',  color: 'var(--blue)',   bg: 'rgba(34,81,204,0.08)' },
    { label: 'Avg Recovery Rate',  value: '94.2%',  trend: '+2%',  trendType: 'up',  color: 'var(--teal)',   bg: 'rgba(14,165,160,0.08)' },
    { label: 'Doctors Onboarded',  value: '284',    trend: '+12',  trendType: 'up',  color: 'var(--indigo)', bg: 'rgba(91,79,207,0.08)' },
    { label: 'Pending Reviews',    value: '43',     trend: '−6',   trendType: 'down', color: 'var(--amber)',  bg: 'rgba(245,158,11,0.08)' },
  ];

  savedReports = [
    { name: 'Q1 2026 Summary Report',       date: 'Mar 31, 2026', type: 'Quarterly', size: '2.4 MB' },
    { name: 'Doctor Performance – Feb 2026', date: 'Feb 28, 2026', type: 'Monthly',   size: '1.1 MB' },
    { name: 'Case Volume Analysis Q4 2025',  date: 'Dec 31, 2025', type: 'Quarterly', size: '3.2 MB' },
    { name: 'Recovery Rate Trends 2025',     date: 'Dec 15, 2025', type: 'Annual',    size: '5.8 MB' },
  ];

  monthlyData = [
    { month: 'Jan', cases: 60, resolved: 48 },
    { month: 'Feb', cases: 75, resolved: 60 },
    { month: 'Mar', cases: 55, resolved: 44 },
    { month: 'Apr', cases: 90, resolved: 72 },
    { month: 'May', cases: 70, resolved: 56 },
    { month: 'Jun', cases: 85, resolved: 68 },
    { month: 'Jul', cases: 65, resolved: 52 },
    { month: 'Aug', cases: 80, resolved: 64 },
    { month: 'Sep', cases: 95, resolved: 76 },
    { month: 'Oct', cases: 72, resolved: 58 },
    { month: 'Nov', cases: 88, resolved: 70 },
    { month: 'Dec', cases: 78, resolved: 62 },
  ];

  exportReport(): void {
    this.toastService.show('Report exported successfully!', 'success');
  }

  downloadReport(name: string): void {
    this.toastService.show(`Downloading: ${name}`, 'info');
  }
}
