import { Component, Input, OnInit, signal } from '@angular/core';
import { ChannelsService } from '../../../services/channels/channels.service';

import { CommonModule } from '@angular/common';
import { MainNavService } from '../../../pageServices/navigates/main-nav.service';
import { OverlayService } from '../../../pageServices/overlays/overlay.service';
import { DirectMessagesService } from '../../../services/directMessages/direct-messages.service';
import { doc, getDoc, Timestamp } from '@angular/fire/firestore';
import { UsersService } from '../../../services/users/users.service';
import { FormsModule } from '@angular/forms';
import { FilterService } from '../../../pageServices/filters/filter.service';
import { Channel } from '../../../classes/channel.class';
import { User } from '../../../classes/user.class';
import { UserComponent } from '../user/user.component';

@Component({
  selector: 'app-chat-header',
  imports: [
    CommonModule,
    FormsModule,
    UserComponent
  ],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss'
})
export class ChatHeaderComponent implements OnInit {
  @Input() chatType: 'new' | 'channel' | 'thread' | 'dm' = 'new';
  timeChecker = Timestamp.now();
  isOnline = false;


  constructor(
    public channelService: ChannelsService,
    public mainNavService: MainNavService,
    public overlayService: OverlayService,
    public dmService: DirectMessagesService,
    public userService: UsersService,
    public filterService: FilterService
  ) {
    UserComponent
  }


  /**
   * Angular lifecycle hook that runs once after component initialization.
   * Starts periodic check for the user's online status.
   */
  ngOnInit(): void {
    this.updateOnlineStatus();
    setInterval(() => this.updateOnlineStatus(), 1000);
  }


  /**
   * Updates the online status of the current chat partner.
   * If the user is not found in the local cache, fetches data from Firestore.
   */
  updateOnlineStatus() {
    const user = this.userService.users.find(u => u.id === this.dmService.chatPartner.id);
    if (!user) {
      this.loadUserDirectly();
      return;
    }
    this.isOnline = this.userService.isUserOnline(user.online);
  }


  /**
   * Loads user data directly from Firestore when not available in local state.
   * Updates the `isOnline` property based on the retrieved data.
   * @private
   */
  private async loadUserDirectly() {
    if (!this.dmService.chatPartner?.id) {
      return;
    }
    const userDoc = doc(this.userService.usersCollection, this.dmService.chatPartner.id);
    const snapshot = await getDoc(userDoc);
    if (snapshot.exists()) {
      this.isOnline = this.userService.isUserOnline(snapshot.data()['online']);
    }
  }


  /**
   * Type guard to check if the provided item is a User.
   * 
   * @param item - The object to check.
   * @returns True if the item is a User.
   */
  isUser(item: any): item is User {
    return 'name' in item && 'avatar' in item; // Anpassen an Ihre User-Properties
  }


  /**
   * Type guard to check if the provided item is a Channel.
   * 
   * @param item - The object to check.
   * @returns True if the item is a Channel.
   */
  isChannel(item: any): item is Channel {
    return 'name' in item && 'id' in item; // Anpassen an Ihre Channel-Properties
  }
}