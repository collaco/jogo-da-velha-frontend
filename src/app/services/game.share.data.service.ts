import { Injectable } from '@angular/core';
import { ShareDataService } from './share.data.service';

/**
 * Dados do Jogo
 */
@Injectable({
  providedIn: 'root'
})
export class GameShareDataService extends ShareDataService<any> {
  /**
   * Default class constructor.
   */
  constructor() {
    super('game');
  }
}
