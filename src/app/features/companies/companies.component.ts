import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-companies',
  imports: [],
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.css',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompaniesComponent {

}
