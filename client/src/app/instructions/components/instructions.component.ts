// Angular
import { Component } from '@angular/core';
// App
import { AppConfig } from '@gcv/app.config';


declare var scrollToSelector: any;  // src/assets/js/utils


@Component({
  selector: 'instructions',
  styleUrls: [ './instructions.component.scss' ],
  templateUrl: './instructions.component.html',
})
export class InstructionsComponent {

  brand = AppConfig.BRAND;
  dashboard = AppConfig.DASHBOARD;
  copyrightYear = (new Date()).getFullYear();

  private searchPopover = false;
  private multiPopover = false;

  scrollTo(event, selector): void {
    event.preventDefault();
    scrollToSelector('html, body', selector);
  }

}
