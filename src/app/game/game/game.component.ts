import { Component, OnInit } from '@angular/core';
import { TypePlayer } from '@app/enums/type-player.enum';
import { WebSocketService } from '@app/web-socket.service';
import { Symbol } from 'src/app/enums/symbol.enum';
import { Player } from 'src/app/models/player.model';

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

  constructor(private webSocketService: WebSocketService) {
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

  /* nextLevel = () => {
    this.winner = false;
    this.tie = false;
    this.startGame(true);
  }

  startGame(nextLevel: boolean = false): void {

    this.message = 'Jogo Iniciado';

    let eventName = 'start-game';
    if (nextLevel) {
      eventName = 'next-level-game';
      this.currentPlayer = this.computerPlayer;
    } else {
      this.currentPlayer = this.personalPlayer;
    }

    this.webSocketService.emit(eventName, this.currentPlayer);

    this.setResult('');
    this.isRunning = true;
  }

  setResult = (msg: string): void => {
    this.messageResult = msg;
  } */
}
