import {Component, inject, OnInit, signal} from '@angular/core';
import {NgClass} from '@angular/common';
import {ToastService} from '../../core/services/toast.service';
import {AuthService} from "../../core/services/auth.service";
import {FilterParams, User} from "../../core/models/user.model";
import {USERS_API_URL} from "../../utils/api.url.constants";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {ROLES} from "../../utils/app-constants";
import {RequestService} from "../../core/services/request.service";
import {getUserInitials} from "../../utils/global.utils";

interface StatCard {
  icon: string;
  id: string;
  label: string;
  value: number;
  target: number;
  trend: string;
  trendType: 'up' | 'down' | 'neu';
  accentColor: string;
  bgColor: string;
  barColor: string;
  barWidth: string;
}

interface RecentCase {
  patientName: string;
  patientId: string;
  avatarColor: string;
  initials: string;
  doctor: string;
  diagnosis: string;
  status: 'Active' | 'Recovered' | 'Pending' | 'Critical';
  date: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private requestService = inject(RequestService);
  pagination = signal<any>(null);
  userInfo = signal<User | null>(null);
  searchQuery = signal('');
  pageQuery = signal(1);

  doctors: User[] = [];

  constructor() {
    this.authService.currentUser$.subscribe((user: any) => {
      this.userInfo.set(user);
    })
  }

  statCards: StatCard[] = [
    {
      icon: './assets/images/doctor.svg',
      id: 'cnt-doctors',
      label: 'Registered Doctors',
      value: 0,
      target: 284,
      trend: '+12 this month',
      trendType: 'up',
      accentColor: 'var(--blue)',
      bgColor: 'rgba(34,81,204,0.08)',
      barColor: 'var(--blue)',
      barWidth: '78%'
    },
    {
      icon: './assets/images/ActiveCases.svg',
      id: 'cnt-cases',
      label: 'Active Cases',
      value: 0,
      target: 1847,
      trend: '+89 this week',
      trendType: 'up',
      accentColor: 'var(--indigo)',
      bgColor: 'rgba(245,158,11,0.08)',
      barColor: 'var(--indigo)',
      barWidth: '65%'
    },
    {
      icon: './assets/images/doctor.svg',
      id: 'cnt-pending',
      label: 'Pending Reviews',
      value: 0,
      target: 43,
      trend: '−6 vs last week',
      trendType: 'down',
      accentColor: 'var(--amber)',
      bgColor: 'rgba(245,158,11,0.08)',
      barColor: 'var(--amber)',
      barWidth: '32%'
    },
    {
      icon: './assets/images/RecoveryRate.svg',
      id: 'cnt-rate',
      label: 'Recovery Rate',
      value: 0,
      target: 94,
      trend: '±0 stable',
      trendType: 'neu',
      accentColor: 'var(--teal)',
      bgColor: 'rgba(14,165,160,0.08)',
      barColor: 'var(--teal)',
      barWidth: '94%'
    },
  ];

  recentCases: RecentCase[] = [
    {
      patientName: 'Ayesha Raza',
      patientId: 'PT-2024-8901',
      avatarColor: '#2251CC',
      initials: 'AR',
      doctor: 'Dr. Salman Shah',
      diagnosis: 'Type II Diabetes',
      status: 'Active',
      date: 'Mar 22, 2026'
    },
    {
      patientName: 'Bilal Hussain',
      patientId: 'PT-2024-8892',
      avatarColor: '#5B4FCF',
      initials: 'BH',
      doctor: 'Dr. Omar Farooq',
      diagnosis: 'Hypertension',
      status: 'Recovered',
      date: 'Mar 21, 2026'
    },
    {
      patientName: 'Sana Malik',
      patientId: 'PT-2024-8887',
      avatarColor: '#0EA5A0',
      initials: 'SM',
      doctor: 'Dr. Amna Tariq',
      diagnosis: 'Pulmonary Infection',
      status: 'Critical',
      date: 'Mar 20, 2026'
    },
    {
      patientName: 'Haris Khan',
      patientId: 'PT-2024-8876',
      avatarColor: '#F0659A',
      initials: 'HK',
      doctor: 'Dr. Zaid Awan',
      diagnosis: 'Appendicitis',
      status: 'Pending',
      date: 'Mar 19, 2026'
    },
    {
      patientName: 'Nida Siddiqui',
      patientId: 'PT-2024-8862',
      avatarColor: '#E8344A',
      initials: 'NS',
      doctor: 'Dr. Salman Shah',
      diagnosis: 'Kidney Stone',
      status: 'Active',
      date: 'Mar 18, 2026'
    },
  ];

  chartPeriod = 'month';

  ngOnInit(): void {
    this.animateCounters();
    this.loadDoctors();
  }

  loadDoctors() {
    const filters: FilterParams = {
      search: this.searchQuery().toLowerCase() || '',
      page: this.pageQuery(),
      limit: 10
    };
    this.requestService.getRequest(USERS_API_URL, filters).subscribe({
      next: (response: HttpResponse<any>) => {
        if (response.status == 200 && response.body.data) {
          this.doctors = Array.isArray(response.body.data)
            ? response.body.data.filter((dr: any) => dr.role.name == ROLES.DOCTOR)
            : [];
          this.pagination.set(response.body.meta?.pagination || null);
        } else {
          this.doctors = [];
          this.pagination.set(null);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.doctors = [];
        this.pagination.set(null);
      },
    });
  }

  private animateCounters(): void {
    this.statCards.forEach(card => {
      const target = card.target;
      const duration = 1400;
      const start = performance.now();
      const update = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        card.value = Math.round(ease * target);
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Active: 'badge-blue', Recovered: 'badge-green',
      Pending: 'badge-amber', Critical: 'badge-rose'
    };
    return map[status] ?? 'badge-gray';
  }

  setPeriod(p: string): void {
    this.chartPeriod = p;
  }

  onQuickAction(action: string): void {
    this.toastService.show(`${action} opened`, 'info');
  }

  protected readonly getUserInitials = getUserInitials;
}
