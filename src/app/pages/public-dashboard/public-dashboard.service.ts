import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, map, shareReplay} from 'rxjs';
import {RequestService} from '../../core/services/request.service';
import {PUBLIC_DASHBOARD_API_URL} from '../../utils/api.url.constants';
import {FILTER_KEYS, PakistanMapAsset, PublicDashboardData, PublicFilters} from './public-dashboard.models';

@Injectable({providedIn: 'root'})
export class PublicDashboardService {
    private http = inject(HttpClient);
    private requestService = inject(RequestService);
    private map$?: Observable<PakistanMapAsset>;

    /** One call returns every card for the given global filters. */
    getDashboard(filters: PublicFilters): Observable<PublicDashboardData> {
        let params = new HttpParams().set('scope', filters.scope || 'national');
        FILTER_KEYS.forEach((k) => {
            const v = filters[k];
            if (v) params = params.set(k, String(v));
        });
        return this.http
            .get<{ data: PublicDashboardData }>(this.requestService.getBEAPIServer() + PUBLIC_DASHBOARD_API_URL, {params})
            .pipe(map((r) => r.data));
    }

    /** Official political map geometry (static asset, cached for the session). */
    getMap(): Observable<PakistanMapAsset> {
        this.map$ ??= this.http.get<PakistanMapAsset>('assets/maps/pakistan-official-map.json').pipe(shareReplay(1));
        return this.map$;
    }
}
