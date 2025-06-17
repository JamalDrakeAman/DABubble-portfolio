import { Injectable, OnDestroy, inject } from '@angular/core';
import { User } from '../../classes/user.class';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection, doc, onSnapshot, updateDoc } from '@firebase/firestore';
import { Timestamp } from '@firebase/firestore';
import { query, where, getDocs } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService implements OnDestroy {
  private onlineUsers = new BehaviorSubject<User[]>([]);
  onlineUsers$ = this.onlineUsers.asObservable();
  private previousOnlineStatus: { [key: string]: boolean } = {};
  private unsubscribe: () => void = () => { }; // Initialisierung hinzufügen
  private firestore = inject(Firestore);
  usersCollection = collection(this.firestore, 'users');
  users: User[] = [];
  tempUser: Partial<User> = {};
  currentUser: User = new User();
  componentExsits = false;
  private onUserOnlineCallback: ((user: User) => void) | null = null;

  GuestUser = {
    id: '8GCDt8zCXnKuGU9sLT2l',
    name: 'Gast',
    email: 'gast@user.de',
    avatar: 'assets/imgs/avatar4.svg'
  }


  constructor() {
    this.initUsersListener();
    const reloaded = sessionStorage.getItem('reloaded');
    if (reloaded === null) {
      let id = setTimeout(() => {
        sessionStorage.setItem('reloaded', 'true');
        clearTimeout(id);
      }, 100);
    }
  }


  /**
   * Returns the list of users with the current user at the top.
   */
  getUsersWithCurrentFirst(): User[] {
    if (!this.currentUser?.id) return this.users;
    const usersCopy = [...this.users];
    const currentUserIndex = usersCopy.findIndex(u => u.id === this.currentUser.id);
    if (currentUserIndex > -1) {
      const [currentUser] = usersCopy.splice(currentUserIndex, 1);
      usersCopy.unshift(currentUser);
    }
    return usersCopy;
  }


  /**
   * Initializes the Firestore snapshot listener to track all users.
   */
  private initUsersListener() {
    this.unsubscribe = onSnapshot(this.usersCollection, (snapshot) => {
      const users = snapshot.docs.map(doc => {
        const data = doc.data() as User;
        data.id = doc.id;
        return data;
      });
      this.users = users;
      this.checkOnlineStatusChanges(users);
    });
  }


  /**
   * Updates the current user's online timestamp in Firestore every 15 seconds.
   */
  updateOnlineStatus() {
    if (this.currentUser.id !== this.GuestUser.id) {
      const update = async () => {
        try {
          if (!this.currentUser.id) return;
          const userRef = doc(this.usersCollection, this.currentUser.id);
          await updateDoc(userRef, { online: Timestamp.now() });
        } catch (error) {
          console.error('Update failed, retrying...', error);
        } finally {
          this.currentUser.online = Timestamp.now();
          setTimeout(update, 15000);
        }
      };
      update();
    }
  }


  /**
  * Checks if a user is considered online based on their last activity timestamp.
  * @param lastOnline The timestamp of the user's last activity
  * @param thresholdSeconds Maximum seconds since last activity to be considered online
  * @returns True if user is online, false otherwise
  */
  isUserOnline(lastOnline: Timestamp | undefined, thresholdSeconds = 20): boolean {
    if (!lastOnline) return false;
    const now = Timestamp.now().toMillis();
    const lastOnlineMillis = lastOnline.toMillis();
    return (now - lastOnlineMillis) < thresholdSeconds * 1000;
  }


  /**
   * Detects users who have newly come online and emits updates.
   * @param users List of users from Firestore
   */
  private checkOnlineStatusChanges(users: User[]) {
    const currentlyOnline = users.filter(user => this.isUserOnline(user.online));
    const newOnlineUsers = currentlyOnline.filter(user => {
      const wasOnline = this.previousOnlineStatus[user.id] || false;
      const isNowOnline = this.isUserOnline(user.online);
      this.previousOnlineStatus[user.id] = isNowOnline;
      return isNowOnline && !wasOnline && user.id !== this.currentUser.id;
    });
    if (newOnlineUsers.length > 0) {
      this.showOnlineNotification(newOnlineUsers[0]);
    }
    this.onlineUsers.next(currentlyOnline);
  }


  /**
  * Shows a notification when a user comes online.
  * @param user The user who just came online
  */
  showOnlineNotification(user: User) {
    if (this.onUserOnlineCallback) {
      this.onUserOnlineCallback(user);
    }
  }


  /**
   * Sets the callback to be triggered when a user comes online.
   * @param callback Function to handle online notification
   */
  setOnlinePopupCallback(callback: (user: User) => void) {
    this.onUserOnlineCallback = callback;
  }


  /**
   * Waits until user data has been loaded from Firestore.
   * @returns Promise that resolves when user data is available
   */
  async waitUntilUsersLoaded(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.users.length > 0) {
          resolve();
        } else {
          setTimeout(check, 100); // prüfe erneut in 100ms
        }
      };
      check();
    });
  }


  /**
   * Cleans up the Firestore listener on destroy.
   */
  ngOnDestroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }


  /**
   * Adds a new user to the Firestore users collection.
   */
  async addUser() {
    const user = new User(this.tempUser);
    try {
      const docRef = await addDoc(this.usersCollection, user.toJSON());
    } catch (error) {
      console.error('Fehler beim Erstellen des Users:', error);
    }
  }


  /**
   * Sets temporary user data (e.g., for form input).
   * Also sets the current user.
   * @param data Partial user data
   */
  setTempUser(data: Partial<User>) {
    this.tempUser = { ...this.tempUser, ...data };
    this.currentUser = { ...this.tempUser, ...data } as User;
  }


  /**
  * Gets the currently set temporary user.
  * @returns Partial user object
  */
  getTempUser() {
    return this.tempUser;
  }


  /**
   * Retrieves a user from local state by email.
   * @param email User email
   * @returns Matching user or undefined
   */
  getUserByEmail(email: string): User | undefined {
    return this.users.find(user => user.email === email);
  }


  /**
   * Updates a user document in Firestore with new data.
   * @param userId Firestore document ID
   * @param updatedData Partial user fields to update
   */
  async updateUser(userId: string, updatedData: Partial<User>) {
    const userDocRef = doc(this.firestore, 'users', userId);
    try {
      await updateDoc(userDocRef, updatedData);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Users:', error);
      throw error;
    }
  }


  /**
   * Retrieves a user from local state by ID.
   * @param id User ID
   * @returns Matching user or undefined
   */
  getUserById2(id: string): User | undefined {
    return this.users.find((user) => id === user.id);
  }


  /**
  * Checks if the given ID belongs to the current user.
  * @param id User ID to check
  * @returns True if ID belongs to current user
  */
  fromCurrentUser(id: string): boolean {
    if (id === this.currentUser.id) {
      return true;
    } else {
      return false;
    }
  }


  /**
   * Retrieves a user by email with a real-time Firestore query.
   * @param email Email address to query
   * @returns Matching user or undefined
   */
  async getUserByEmailRealtime(email: string): Promise<User | undefined> {
    const q = query(this.usersCollection, where('email', '==', email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data() as User;
      data.id = docSnap.id;
      return data;
    }
    return undefined;
  }
}