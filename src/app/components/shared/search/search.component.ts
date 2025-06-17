import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterService } from '../../../pageServices/filters/filter.service';
import { Channel } from '../../../classes/channel.class';
import { User } from '../../../classes/user.class';
import { MainNavService } from '../../../pageServices/navigates/main-nav.service';
import { UserComponent } from '../user/user.component';
import { DirectMessagesService } from '../../../services/directMessages/direct-messages.service';
import { ChannelsService } from '../../../services/channels/channels.service';
import { MessagesService } from '../../../services/messages/messages.service';
import { Message } from '../../../classes/message.class';
import { UsersService } from '../../../services/users/users.service';

@Component({
  selector: 'app-search',
  imports: [
    FormsModule,
    CommonModule,
    UserComponent
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent {
  devspace = ''


  constructor(
    public filterService: FilterService,
    public mainNavService: MainNavService,
    public dmService: DirectMessagesService,
    public channelService: ChannelsService,
    public messageService: MessagesService,
    public usersService: UsersService
  ) { }

  user = new User();
  channel = new Channel();


  /**
   * Checks if an item is a User.
   * @param {any} item - The item to check.
   * @returns {boolean} - `true` if the item is a User.
   */
  isUser(item: any): item is User {
    return 'name' in item && 'avatar' in item; // Anpassen an Ihre User-Properties
  }


  /**
   * Checks if an item is a Channel.
   * @param {any} item - The item to check.
   * @returns {boolean} - `true` if the item is a Channel.
   */
  isChannel(item: any): item is Channel {
    return 'name' in item && 'id' in item; // Anpassen an Ihre Channel-Properties
  }


  /**
    * Checks if an item is a Message.
    * @param {any} item - The item to check.
    * @returns {boolean} - `true` if the item is a Message.
   */
  isMessage(item: any): item is Message {
    return 'message' in item && 'timestamp' in item;
  }


  /**
   * Opens or creates a direct message conversation with the selected user.
   * @param {User} item - The selected user.
   */
  clickUser(item: User) {
    this.dmService.openOrCreateDirectMessageConversation(item);
    this.mainNavService.openChannel(true);
    this.filterService.searchValue.set('');
  }


  /**
   * Opens a channel and loads its messages.
   * @param {Channel} item - The selected channel.
   */
  clickChannel(item: Channel) {
    this.mainNavService.openChannel();
    this.channelService.openChannel(item);
    this.messageService.getMessages(item);
    this.mainNavService.markedChannel(item);
    this.filterService.searchValue.set('')
  }


  /**
   * Checks if the current user is a member of a channel.
   * @param {Channel} channel - The channel to check.
   * @returns {boolean} - `true` if the user is a member.
   */
  isMember(channel: Channel): boolean {
    return channel.members.some(memberId => memberId === this.usersService.currentUser.id);
  }


  /**
   * Handles clicking on a message:
   * - Scrolls to and highlights the message (for channel messages).
   * - Opens the DM conversation (for direct messages).
   * @param {any} item - The selected message.
   */
  clickMessage(item: any) {
    if (item.type === 'channelMessage') {
      const channel = this.channelService.channels.find(c => c.id === item.channelId);
      if (channel) {
        this.channelService.openChannel(channel);
        this.messageService.getMessages(channel);
        setTimeout(() => {
          const element = document.getElementById(`message-${item.id}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element?.classList.add('highlight-message');
          setTimeout(() => element?.classList.remove('highlight-message'), 2000);
        }, 500);
      }
    } else if (item.type === 'dmMessage') {
      const userId = item.sender === this.usersService.currentUser.id ?
        this.dmService.directMessage.participants.user2 :
        this.dmService.directMessage.participants.user1;
      const user = this.usersService.users.find(u => u.id === userId);
      if (user) {
        this.dmService.openOrCreateDirectMessageConversation(user);
      }
    }
    this.filterService.searchValue.set('');
  }



}
