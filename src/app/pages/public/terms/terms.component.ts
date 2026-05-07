import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './terms.component.html',
  styleUrls: ['../../../shared/scss/doc-pages.scss'],
})
export class TermsComponent {
  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
