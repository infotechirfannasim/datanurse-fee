import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {MatTooltip} from "@angular/material/tooltip";

@Component({
    selector: 'app-public-layout',
    standalone: true,
    imports: [RouterModule, CommonModule, MatTooltip],
    templateUrl: './public-layout.component.html',
    styleUrls: ['./public-layout.component.scss'],
})
export class PublicLayoutComponent {
    menuOpen = false;
    currentYear = new Date().getFullYear();
}
