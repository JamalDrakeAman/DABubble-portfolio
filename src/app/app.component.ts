import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainNavService } from './pageServices/navigates/main-nav.service';
import { CommonModule } from '@angular/common';
import { OverlayService } from './pageServices/overlays/overlay.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dabubble';

  constructor(
    private mainNavService: MainNavService,
    public overlayService: OverlayService) {
    this.mainNavService.checkScreenView();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.mainNavService.checkScreenView();
  }


  isAnyOverlayOpen(): boolean {
    const os = this.overlayService;
    return !os.hideAddChannel || !os.hideAddUser || !os.hideAddMembersOverlay
      || !os.hideEditChannel || !os.hideProfileOverlay || !os.hideLogoutOverlay
      || !os.hideMembersOverlay || !os.hideConfirmLeaveChannel;
  }
}