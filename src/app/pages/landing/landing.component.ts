import {Component, OnInit} from '@angular/core';
import {RouterModule} from '@angular/router';
import {RequestService} from "../../core/services/request.service";
import {PUBLIC_STATS_API_URL} from "../../utils/api.url.constants";
import {HttpResponse} from "@angular/common/http";

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
    stats = {doctors: 0, cases: 0, patients: 0};

    constructor(private requestService: RequestService) {
    }

    ngOnInit() {
        this.requestService.getUnAuthRequest(PUBLIC_STATS_API_URL).subscribe({
            next: (res: HttpResponse<any>) => this.stats = res.body.data,
            error: () => {
            }
        });
    }
}
