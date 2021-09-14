import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Status } from '@app/enums/status.enum';
import { TypePlayer } from '@app/enums/type-player.enum';
import { Position } from '@app/models/position.model';

import { Player } from '@models/player.model';
import { WebSocketService } from 'src/app/web-socket.service';


@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit {

  @Input() personalPlayer: Player;
  @Input() computerPlayer: Player;
  @Input() level: number;

  private status: Status;
  private currentPlayer: Player;

  // Canvas
  private canvasWidth = 400;
  private canvasHeight = 400;
  private canvasContext = null;


  // Matriz representando o tabuleiro
  private cells = null;

  // Indica se a partida está em andamento ou não
  private isRunning = false;

  /* Dimensões do tabuleiro */
  private colWidth: number;
  private colHeight: number;
  private rowHeight: number;



  // Bloqueia jogadas para o jogador
  private blockPlay: boolean = false;

  public message: string = '';
  messageResult: string;
  _winner: boolean = false;
  _tie: boolean = false;

  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;

  constructor(
    private _webSocketService: WebSocketService
  ) {
    this.currentPlayer = this.personalPlayer;
  }

  ngOnInit(): void {

    this.init();
    this.startGame();

    this._webSocketService.listen('new-play').subscribe(data => {
      this.playComputer({ row: data.row, col: data.col });
    });

    this._webSocketService.listen('update-level').subscribe(level => {
      this.level = level;
    });
  }

  init(): void {
    this.colWidth = 0;
    this.colHeight = 0;
    this.rowHeight = 0;
    this.isRunning = false;
    this._winner = false;
    this._tie = false;
    this.message = '';
    this.messageResult = '';
    this.status = Status.Undefined;

    this.initCanvas();
  }

  initCanvas(): void {
    // Dimensões do canvas
    this.canvas.nativeElement.width = this.canvasWidth;
    this.canvas.nativeElement.height = this.canvasHeight;
    this.canvas.nativeElement.style.width = String(this.canvasWidth);
    this.canvas.nativeElement.style.height = String(this.canvasHeight);

    this.colWidth = this.canvasWidth / 3;
    this.rowHeight = this.canvasHeight / 3;

    this.canvasContext = this.canvas.nativeElement.getContext('2d');
  }

  nextLevel = () => {
    this._winner = false;
    this._tie = false;
    this.startGame(true);
  }

  startGame = (nextLevel = false): void => {

    this.message = 'Jogo Iniciado';
    if (nextLevel) {
      this.currentPlayer = this.computerPlayer;
      this._webSocketService.emit('next-level-game', this.currentPlayer);
    } else {
      this.currentPlayer = this.personalPlayer;
      this._webSocketService.emit('start-game', this.currentPlayer);
    }

    this._createBoard();
    this.blockPlay = false;
    this.isRunning = true;
  }

  clearBoard = () => {
    this.clearStatus();
    this.clearResult();
    this._clearCanvas();
    this.clearCells();
  }

  clearResult = () => {
    this._setResult('');
  }

  clearStatus = () => {
    this.setStatus(Status.Undefined);
  }

  setStatus = (status: Status): void => {
    this.status = status;
  }

  clearCells = (): void => {
    this.cells = [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ];
  }

  playComputer = (position: Position): void => {
    if (this.isRunning) {
      this.renderSymbol(position, this.computerPlayer.symbol);
      this.changePlayer();
    }
  }

  play = (event): void => {
    if (this.canPlay()) {
      const position = this.calcClickPosition(event);
      if (this.isEmptyPosition(position)) {
        this.renderSymbol(position, this.personalPlayer.symbol);
        this._webSocketService.emit('new-play', {
          row: position.row,
          col: position.col,
          symbol: this.currentPlayer.symbol
        });

        this.changePlayer();
      }
    }
    this.renderSymbol({ row: -1, col: -1 }, this.personalPlayer.symbol);
  }

  isEmptyPosition = (position: Position): boolean => {
    return (this.cells[position.row][position.col] === '');
  }

  canPlay = (): boolean => {
    return (this.isRunning && !this.blockPlay);
  }

  calcClickPosition = (event: any): Position => {
    return {
      col: Math.floor(event.offsetX / this.colWidth),
      row: Math.floor(event.offsetY / this.rowHeight)
    };
  }

  changePlayer = (): void => {
    if (this.isConputePlayer()) {
      this.currentPlayer = this.personalPlayer;
      this.blockPlay = false;
    } else {
      this.currentPlayer = this.computerPlayer;
      this.blockPlay = true;
    }
  }

  isConputePlayer = (): boolean => {
    return (this.currentPlayer.type === TypePlayer.ComputerPlayer);
  }

  isPersonalPlayer = (): boolean => {
    return (this.currentPlayer.type === TypePlayer.PersonalPlayer);
  }

  isValidPosition = (position: Position): boolean => {
    return (position.row !== -1 && position.col !== -1);
  }

  configCanvasToRenderPosition = (position: Position): void => {
    this.canvasContext.fillStyle = this.currentPlayer.color;
    this.canvasContext.font = (this.canvasWidth / 5) + 'px Arial';
    this.canvasContext.textAlign = 'center';
    this.canvasContext.textBaseline = 'middle';
    this.canvasContext.fillText(
      this.currentPlayer.symbol, position.col * this.colWidth + this.colWidth / 2, position.row * this.rowHeight + this.rowHeight / 2);
  }


  // Desenha um símbolo no tabuleiro
  renderSymbol = (position: Position, symbol: string): void => {
    if (this.isValidPosition(position)) {
      this.configCanvasToRenderPosition(position);
      this.cells[position.row][position.col] = symbol;

      // Verifica se houve vitória ou empate e encerra o jogo
      if (this._isVictory()) {
        this._winner = (this.currentPlayer.name == this.personalPlayer.name);
        this._tie = false;
        this._setResult(this.currentPlayer.name + ' venceu!');
        this.isRunning = false;
      }
      else if (this._isTie()) {
        this._tie = true;
        this._setResult('Empate!');
        this.isRunning = false;
      }
    }
  };

  // Verifica se houve empate
  _isTie = function () {
    var count = 0;
    var cols = this.cells[0].length;
    var rows = this.cells.length;

    // Conta a quantidade de posições com algum símbolo e compara com o total de posições
    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        if (this.cells[i][j] != '') {
          count++;
        }
      }
    }

    var isTie = count == cols * rows;

    if (isTie) {
      this._winner = false;
      this.status = Status.Tie;
    }

    return isTie;
  };

  _isVictory = (): boolean => {
    if (
      this._compareSymbols(this.cells[0][0], this.cells[1][0], this.cells[2][0]) ||
      this._compareSymbols(this.cells[0][1], this.cells[1][1], this.cells[2][1]) ||
      this._compareSymbols(this.cells[0][2], this.cells[1][2], this.cells[2][2]) ||
      this._compareSymbols(this.cells[0][0], this.cells[0][1], this.cells[0][2]) ||
      this._compareSymbols(this.cells[1][0], this.cells[1][1], this.cells[1][2]) ||
      this._compareSymbols(this.cells[2][0], this.cells[2][1], this.cells[2][2]) ||
      this._compareSymbols(this.cells[0][0], this.cells[1][1], this.cells[2][2]) ||
      this._compareSymbols(this.cells[0][2], this.cells[1][1], this.cells[2][0])) {

      this.setStatus(Status.Victory);

      return true;
    }
    return false;
  }

  _compareSymbols = (a, b, c): boolean => {
    return (a === b && b === c && c !== '');
  }

  _setResult = (text): void => {
    this.messageResult = text;
  }

  _clearCanvas = (): void => {
    this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  drawVerticalLineOne = (): void => {
    this.canvasContext.beginPath();
    this.canvasContext.moveTo(this.colWidth, 0);
    this.canvasContext.lineTo(this.colWidth, this.canvasHeight);
    this.canvasContext.stroke();
  }

  drawVerticalLineTwo = (): void => {
    this.canvasContext.beginPath();
    this.canvasContext.moveTo(2 * this.colWidth, 0);
    this.canvasContext.lineTo(2 * this.colWidth, this.canvasHeight);
    this.canvasContext.stroke();
  }

  drawHorizontalLineOne = (): void => {
    this.canvasContext.beginPath();
    this.canvasContext.moveTo(0, this.rowHeight);
    this.canvasContext.lineTo(this.canvasWidth, this.rowHeight);
    this.canvasContext.stroke();
  }

  drawHorizontalLineTwo = (): void => {
    this.canvasContext.beginPath();
    this.canvasContext.moveTo(0, 2 * this.rowHeight);
    this.canvasContext.lineTo(this.canvasWidth, 2 * this.rowHeight);
    this.canvasContext.stroke();
  }

  _createBoard = (): void => {

    this.clearBoard();

    this.canvasContext.strokeStyle = '#596575';
    this.canvasContext.lineWidth = 3;

    this.drawVerticalLineOne();
    this.drawVerticalLineTwo();
    this.drawHorizontalLineOne();
    this.drawHorizontalLineTwo();
  }
}
