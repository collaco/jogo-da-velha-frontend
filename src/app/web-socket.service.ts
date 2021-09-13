import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as io from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private socket: any;
  readonly uri: string = "ws://localhost:3000";

  constructor() {
    this.socket = io.io(this.uri);
  }

  listen(eventName: string): Observable<any> {
    return new Observable(subscriber => {
      this.socket.on(eventName, data => {
        subscriber.next(data);
      })
    });
  }

  emit(eventName: string, data: any): void {
    this.socket.emit(eventName, data);
  }

  getSocketId() {
    return this.socket.id;
  }
}
