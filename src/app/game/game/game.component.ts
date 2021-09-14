import { Component, OnInit } from '@angular/core';

import { TypePlayer } from '@app/enums/type-player.enum';
import { Symbol } from '@enums/symbol.enum';
import { Player } from '@models/player.model';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {

  title: string;
  level: number;

  personalPlayer: Player;
  computerPlayer: Player;

  constructor() {
    this.init();
  }

  init(): void {
    this.title = 'Jogo da Velha';
    this.level = 1;
    this.personalPlayer = { name: 'Você', symbol: Symbol.X, color: '#33b4d6', type: TypePlayer.PersonalPlayer};
    this.computerPlayer = { name: 'Computador', symbol: Symbol.O, color: '#2ce0b7', type: TypePlayer.ComputerPlayer };
  }

  ngOnInit(): void {
  }
}
