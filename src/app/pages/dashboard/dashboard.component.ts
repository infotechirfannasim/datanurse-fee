import {Component, inject, OnInit, signal} from '@angular/core';
import {ToastService} from '../../core/services/toast.service';
import {AuthService} from "../../core/services/auth.service";
import {User} from "../../core/models/user.model";
import {
    CASE_DISTRIBUTION_API_URL,
    DEMOGRAPHICS_API_URL,
    FOLLOWUP_OUTCOMES_API_URL,
    GET_LOV_BULK_API_URL,
    STATS_API_URL,
    TOP_SURGEONS_API_URL
} from "../../utils/api.url.constants";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {RequestService} from "../../core/services/request.service";
import {FindObjByKeyPipe} from "../../core/pipe/find-obj-by-key";
import {RouterLink} from "@angular/router";
import {MatTooltip} from '@angular/material/tooltip';
import {FormsModule} from "@angular/forms";

interface StatCard {
    icon: string;
    _id: number;
    label: string;
    value: number;
    target?: number;
    trend?: string;
    trendType?: 'up' | 'down' | 'neu';
    accentColor?: string;
    bgColor?: string;
    barColor?: string;
    barWidth?: string;
    suffix?: string;
    route: string;
    trendTooltip: string;
}

interface RecentCase {
    patientName: string;
    patientId: string;
    avatarColor: string;
    initials: string;
    surgeon: string;
    procedure: string;
    status: 'Active' | 'Recovered' | 'Pending' | 'Critical';
    date: string;
}

interface ProcedureItem {
    label: string;
    percentage: number;
    color: string;
    cases: number;
    count: number
}

interface AgeGroupItem {
    label: string;
    percentage: number;
    color: string;
}

interface ProvinceItem {
    label: string;
    percentage: number;
    color: string;
}

interface FollowupItem {
    label: string;
    rate: number;
    color: string;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [FindObjByKeyPipe, RouterLink, MatTooltip, FormsModule],
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
    specialtyOptions: any[] = [];
    isLoading: boolean = false;
    isLoadingStats = true;
    isLoadingTopSurgeons = false;
    isLoadingCaseDist = false;
    isLoadingFollowup = false;
    isLoadingDemo = false;
    topSurgeonFilter: 'all' | 'month' | 'year' = 'year';
    caseDistFilter: 'all' | 'month' | 'year' = 'year';
    followupFilter: 'all' | 'month' | 'year' = 'year';
    demoFilter: 'all' | 'month' | 'year' = 'year';

    constructor() {
        this.authService.currentUser$.subscribe((user: any) => {
            this.userInfo.set(user);
        });
    }

    statCards: StatCard[] = [
        {
            _id: 1,
            label: 'Total Patients',
            value: 0,
            trend: '0%',
            trendType: 'neu',
            trendTooltip: 'compared to last month',
            barWidth: '0%',
            barColor: '#2251CC',
            accentColor: '#2251CC',
            bgColor: '#EEF2FF',
            icon: './assets/images/pending.svg',
            route: '/patients'
        },
        {
            _id: 2,
            label: 'Total Cases',
            value: 0,
            trend: '0%',
            trendType: 'neu',
            trendTooltip: 'compared to last month',
            barWidth: '0%',
            barColor: '#0EA5A0',
            accentColor: '#0EA5A0',
            bgColor: '#F0FDFA',
            icon: './assets/images/ActiveCases.svg',
            route: '/cases'
        },
        {
            _id: 3,
            label: 'Active Doctors',
            value: 0,
            trend: '0%',
            trendType: 'neu',
            trendTooltip: 'compared to last month',
            barWidth: '0%',
            barColor: '#5B4FCF',
            accentColor: '#5B4FCF',
            bgColor: '#F5F3FF',
            icon: './assets/images/doctor.svg',
            route: '/doctors'
        },
        {
            _id: 4,
            label: 'Cases This Month',
            value: 0,
            trend: '0%',
            trendType: 'neu',
            trendTooltip: 'compared to last month',
            barWidth: '0%',
            barColor: '#F59E0B',
            accentColor: '#F59E0B',
            bgColor: '#FFFBEB',
            icon: './assets/images/RecoveryRate.svg',
            route: '/cases'
        },
    ];
    totalCases: number = 0;
    ringSegments: any[] = [];
    outcomes: any = {};
    followupOverallRate: number = 0;

    procedures: ProcedureItem[] = [];

    topSurgeons: any[] = [];

    ageGroups: AgeGroupItem[] = [];

    provinces: ProvinceItem[] = [];

    followups: FollowupItem[] = [];
    chartPeriod = 'month';
    genderMale = 0;
    genderFemale = 0;

    ngOnInit(): void {
        this.loadLovs();
        this.loadStatsCards();
        this.loadTopSurgeons();
        this.loadCaseDistribution();
        this.loadFollowUpAndOutcomes();
        this.loadDemographics();
    }

    loadLovs() {
        const payload = {
            types: ['specialty', 'hospitals', 'city'],
        };
        this.requestService.postRequest(GET_LOV_BULK_API_URL, payload).subscribe({
            next: (response: HttpResponse<any>) => {
                if (response.status == 200 && response.body.data) {
                    this.specialtyOptions = response.body.data['specialty'];
                } else {
                    this.specialtyOptions = [];
                }
            },
            error: (error: HttpErrorResponse) => {
                this.specialtyOptions = [];
                const errMsg = error.error.message || error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error')
            },
        });
    }

    // ====================== STATS CARDS (No Filter) ======================
    loadStatsCards() {
        this.isLoadingStats = true;
        this.requestService.getRequest(STATS_API_URL).subscribe({
            next: (res: HttpResponse<any>) => {
                this.mapStatCards(res.body.data.stats);
                this.isLoadingStats = false;
            },
            error: () => this.isLoadingStats = false
        });
    }

    // ====================== TOP SURGEONS ======================
    loadTopSurgeons() {
        this.isLoadingTopSurgeons = true;
        this.requestService.getRequest(`${TOP_SURGEONS_API_URL}?filter=${this.topSurgeonFilter}`)
            .subscribe({
                next: (res: HttpResponse<any>) => {
                    this.topSurgeons = res.body.data.topSurgeons || [];
                    this.isLoadingTopSurgeons = false;
                },
                error: () => this.isLoadingTopSurgeons = false
            });
    }

    // ====================== CASE DISTRIBUTION ======================
    loadCaseDistribution() {
        this.isLoadingCaseDist = true;
        this.requestService.getRequest(`${CASE_DISTRIBUTION_API_URL}?filter=${this.caseDistFilter}`)
            .subscribe({
                next: (res: HttpResponse<any>) => {
                    this.procedures = res.body.data.caseDistribution || [];
                    this.totalCases = this.procedures.reduce((a, b) => a + b.count, 0);
                    this.ringSegments = this.buildRingSegments(this.procedures);
                    this.isLoadingCaseDist = false;
                },
                error: () => this.isLoadingCaseDist = false
            });
    }

    // ====================== FOLLOW-UP & OUTCOMES ======================
    loadFollowUpAndOutcomes() {
        this.isLoadingFollowup = true;
        this.requestService.getRequest(`${FOLLOWUP_OUTCOMES_API_URL}?filter=${this.followupFilter}`)
            .subscribe({
                next: (res: HttpResponse<any>) => {
                    const data = res.body.data;
                    this.outcomes = data.outcomes || {};
                    this.followupOverallRate = data.followup?.overallRate ?? 0;
                    this.followups = data.followup?.breakdown || [];
                    this.isLoadingFollowup = false;
                },
                error: () => this.isLoadingFollowup = false
            });
    }

    // ====================== DEMOGRAPHICS ======================
    loadDemographics() {
        this.isLoadingDemo = true;
        this.requestService.getRequest(`${DEMOGRAPHICS_API_URL}?filter=${this.demoFilter}`)
            .subscribe({
                next: (res: HttpResponse<any>) => {
                    const data = res.body.data;
                    this.ageGroups = data.ageGroups || [];
                    this.genderMale = data.gender?.malePercent ?? 0;
                    this.genderFemale = data.gender?.femalePercent ?? 0;
                    this.provinces = data.provinces || [];
                    this.isLoadingDemo = false;
                },
                error: () => this.isLoadingDemo = false
            });
    }

    /* loadDashboard() {
         this.isLoading = true;
         forkJoin({
             summary: this.requestService.getRequest(SUMMARY_API_URL),
             analytics: this.requestService.getRequest(ANALYTICS_API_URL),
             demographics: this.requestService.getRequest(DEMOGRAPHICS_API_URL),
         }).subscribe({
             next: ({summary, analytics, demographics}: any) => {
                 if (summary.status !== 200 || analytics.status !== 200 || demographics.status !== 200) return;
 
                 // Summary
                 this.mapStatCards(summary.body.data.stats);
                 this.topSurgeons = summary.body.data.topSurgeons ?? [];
 
                 // Analytics
                 const analyticsData = analytics.body.data;
                 this.totalCases = analyticsData.totalCases ?? 0;
                 this.procedures = analyticsData.caseDistribution ?? [];
                 this.outcomes = analyticsData.outcomes ?? {};
                 this.followupOverallRate = analyticsData.followup?.overallRate ?? 0;
                 this.followups = analyticsData.followup?.breakdown ?? [];
                 this.ringSegments = this.buildRingSegments(analyticsData.caseDistribution ?? []);
 
                 // Demographics
                 const demoData = demographics.body.data;
                 this.ageGroups = demoData.ageGroups ?? [];
                 this.genderMale = demoData.gender?.malePercent ?? 0;
                 this.genderFemale = demoData.gender?.femalePercent ?? 0;
                 this.provinces = demoData.provinces ?? [];
                 this.isLoading = false;
             },
             error: (err) => {
                 this.isLoading = false;
             },
         });
     }*/

    // Converts procedure distribution % into SVG stroke-dasharray values
    // circumference of r=48 circle = 2 * π * 48 ≈ 301.6
    buildRingSegments(procedures: any[]): any[] {
        const CIRCUMFERENCE = 301.6;
        const COLORS = ['#2251CC', '#E8344A', '#0EA5A0', '#F59E0B', '#5B4FCF', '#10B981'];
        let offset = -90; // start at top

        return procedures.map((p, i) => {
            const arc = (p.percentage / 100) * CIRCUMFERENCE;
            const gap = CIRCUMFERENCE - arc;
            const rotation = offset;
            offset += (p.percentage / 100) * 360;

            return {
                label: p.label,
                percentage: p.percentage,
                count: p.count,
                color: COLORS[i % COLORS.length],
                dasharray: `${arc.toFixed(1)} ${gap.toFixed(1)}`,
                rotation: `rotate(${rotation} 60 60)`,
            };
        });
    }

    getUserInitials(surgeon: any): string {
        if (!surgeon?.name) return '?';
        const parts = surgeon.name.trim().split(' ');
        return parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0][0].toUpperCase();
    }

    mapStatCards(stats: any) {
        this.statCards = [
            {
                _id: 1, label: 'Total Patients',
                value: stats.totalPatients.value,
                trend: stats.totalPatients.trend,
                trendType: stats.totalPatients.trendType,
                trendTooltip: `${stats.totalPatients.trend} compared to last month`,
                barWidth: stats.totalPatients.barWidth,
                barColor: '#2251CC', accentColor: '#2251CC',
                bgColor: '#EEF2FF', icon: './assets/images/pending.svg',
                route: '/patients'
            },
            {
                _id: 2, label: 'Total Cases',
                value: stats.totalCases.value,
                trend: stats.totalCases.trend,
                trendType: stats.totalCases.trendType,
                trendTooltip: `${stats.totalCases.trend} compared to last month`,
                barWidth: stats.totalCases.barWidth,
                barColor: '#0EA5A0', accentColor: '#0EA5A0',
                bgColor: '#F0FDFA', icon: './assets/images/ActiveCases.svg',
                route: '/cases'
            },
            {
                _id: 3, label: 'Active Doctors',
                value: stats.activeDoctors.value,
                trend: stats.activeDoctors.trend,
                trendType: stats.activeDoctors.trendType,
                trendTooltip: `${stats.activeDoctors.trend} compared to last month`,
                barWidth: stats.activeDoctors.barWidth,
                barColor: '#5B4FCF', accentColor: '#5B4FCF',
                bgColor: '#F5F3FF', icon: './assets/images/doctor.svg',
                route: '/doctors'
            },
            {
                _id: 4, label: 'Cases This Month',
                value: stats.casesThisMonth.value,
                trend: stats.casesThisMonth.trend,
                trendType: stats.casesThisMonth.trendType,
                trendTooltip: `${stats.casesThisMonth.trend} compared to last month`,
                barWidth: stats.casesThisMonth.barWidth,
                barColor: '#F59E0B', accentColor: '#F59E0B',
                bgColor: '#FFFBEB', icon: './assets/images/RecoveryRate.svg',
                route: '/cases'
            },
        ];
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
                // card.value = Math.round(ease * target);
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

    getBarHeightPercent(value: number, data: { cases: number, resolved: number }[]): string {
        const max = Math.max(...data.map(d => d.cases));
        return ((value / max) * 90) + '%';
    }

    getGreeting(): string {
        const hours = new Date().getHours();

        if (hours < 12) {
            return 'Good Morning';
        } else if (hours < 17) {
            return 'Good Afternoon';
        } else if (hours < 21) {
            return 'Good Evening';
        } else {
            return 'Good Night';
        }
    }

    setFilter(value: any) {
        this.followupFilter = value;
        this.loadFollowUpAndOutcomes();
    }

    setFilterCaseDistribution(value: any) {
        this.caseDistFilter = value;
        this.loadCaseDistribution();
    }

    setFilterPatientDemographics(value: any) {
        this.demoFilter = value;
        this.loadDemographics();
    }

    setFilterTopSurgeons(value: any) {
        this.topSurgeonFilter = value;
        this.loadTopSurgeons();
    }
}
