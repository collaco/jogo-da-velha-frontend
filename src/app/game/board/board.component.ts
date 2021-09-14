import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

import { TypePlayer } from '@app/enums/type-player.enum';
import { Position } from '@app/models/position.model';
import { Player } from '@models/player.model';
import { WebSocketService } from '@services/web-socket.service';
import { ThisReceiver } from '@angular/compiler';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.css']
})
export class BoardComponent implements OnInit {

  @Input() personalPlayer: Player;
  @Input() computerPlayer: Player;
  @Input() level: number;

  _currentPlayer: Player;

  // Canvas
  _canvasWidth: number;
  _canvasHeight: number;
  _canvasContext: any;
  _cells: Array<any>;
  _isRunning: boolean;

  /* Dimensões do tabuleiro */
  _colWidth: number;
  _colHeight: number;
  _rowHeight: number;

  _blockPlay: boolean;
  _winner: boolean;
  _tie: boolean;
  message: string;
  messageResult: string;

  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;

  constructor(
    private _webSocketService: WebSocketService
  ) {
    this._currentPlayer = this.personalPlayer;
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
    this._colWidth = 0;
    this._colHeight = 0;
    this._rowHeight = 0;
    this._isRunning = false;
    this._blockPlay = false;
    this._winner = false;
    this._tie = false;
    this.message = '';
    this.messageResult = '';

    this.initCanvas();
  }

  initCanvas(): void {

    this._canvasWidth = 400;
    this._canvasHeight = 400;

    this.canvas.nativeElement.width = this._canvasWidth;
    this.canvas.nativeElement.height = this._canvasHeight;
    this.canvas.nativeElement.style.width = String(this._canvasWidth);
    this.canvas.nativeElement.style.height = String(this._canvasHeight);

    this._colWidth = this._canvasWidth / 3;
    this._rowHeight = this._canvasHeight / 3;

    this._canvasContext = this.canvas.nativeElement.getContext('2d');
  }

  nextLevel = () => {
    this._winner = false;
    this._tie = false;
    this.startGame(true);
  }

  startGame = (nextLevel = false): void => {
    if (nextLevel) {
      this._currentPlayer = this.computerPlayer;
      this._webSocketService.emit('next-level-game', this._currentPlayer);
    } else {
      this._currentPlayer = this.personalPlayer;
      this._webSocketService.emit('start-game', this._currentPlayer);
    }

    this.createBoard();
    this._blockPlay = false;
    this._isRunning = true;
  }

  clearBoard = () => {
    this.clearResult();
    this.clearCanvas();
    this.clearCells();
  }

  clearResult = () => {
    this.setResult('');
  }

  clearCells = (): void => {
    this._cells = [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ];
  }

  playComputer = (position: Position): void => {
    if (this._isRunning) {
      this.renderSymbol(position, this.computerPlayer.symbol);
      this.changePlayer();
    }
  }

  play = (event): void => {
    if (this.canPlay()) {
      const position = this.calcClickPosition(event);
      if (this.isEmptyPosition(position)) {
        this.renderSymbol(position, this.personalPlayer.symbol);
        this._webSocketService.emit('new-play', { row: position.row, col: position.col, symbol: this._currentPlayer.symbol });
        this.changePlayer();
      }
    }
  }

  isEmptyPosition = (position: Position): boolean => {
    return (this._cells[position.row][position.col] === '');
  }

  canPlay = (): boolean => {
    return (this._isRunning && !this._blockPlay);
  }

  calcClickPosition = (event: any): Position => {
    return {
      col: Math.floor(event.offsetX / this._colWidth),
      row: Math.floor(event.offsetY / this._rowHeight)
    };
  }

  changePlayer = (): void => {
    if (this.isConputePlayer()) {
      this._currentPlayer = this.personalPlayer;
      this._blockPlay = false;
    } else {
      this._currentPlayer = this.computerPlayer;
      this._blockPlay = true;
    }
  }

  isConputePlayer = (): boolean => {
    return (this._currentPlayer.type === TypePlayer.ComputerPlayer);
  }

  isPersonalPlayer = (): boolean => {
    return (this._currentPlayer.type === TypePlayer.PersonalPlayer);
  }

  isValidPosition = (position: Position): boolean => {
    return (position.row !== -1 && position.col !== -1);
  }

  configCanvasToRenderPosition = (position: Position): void => {
    this._canvasContext.fillStyle = this._currentPlayer.color;
    this._canvasContext.font = (this._canvasWidth / 5) + 'px Arial';
    this._canvasContext.textAlign = 'center';
    this._canvasContext.textBaseline = 'middle';
    this._canvasContext.fillText(
      this._currentPlayer.symbol, position.col * this._colWidth + this._colWidth / 2, position.row * this._rowHeight + this._rowHeight / 2);
  }

  renderSymbol = (position: Position, symbol: string): void => {
    if (this.isValidPosition(position)) {
      this.configCanvasToRenderPosition(position);
      this.setCell(position, symbol);
      this.updateStatus();
    }
  }

  updateStatus = () => {
    if (this.isVictory()) {
      this._winner = (this._currentPlayer.type === this.personalPlayer.type);
      this._tie = false;
      this.setResult(this._currentPlayer.name + ' venceu!');
      this._isRunning = false;
    } else if (this.isTie()) {
      this._tie = true;
      this._winner = false;
      this.setResult('Empate!');
      this._isRunning = false;
    }
  }

  setCell = (position: Position, symbol: string): void => {
    this._cells[position.row][position.col] = symbol;
  }

  isTie = () => {
    const isTie = (!this.isVictory() && this.isCompleted());
    if (isTie) {
      this._winner = false;
    }

    return isTie;
  }

  isCompleted = (): boolean => {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (!this.isBusyCell(row, col)) {
          return false;
        }
      }
    }
    return true;
  }

  isBusyCell = (row, col) => {
    return (this._cells[row][col] !== '');
  }

  isVictory = (): boolean => {
    if (
      this.compareSymbols(this._cells[0][0], this._cells[1][0], this._cells[2][0]) ||
      this.compareSymbols(this._cells[0][1], this._cells[1][1], this._cells[2][1]) ||
      this.compareSymbols(this._cells[0][2], this._cells[1][2], this._cells[2][2]) ||
      this.compareSymbols(this._cells[0][0], this._cells[0][1], this._cells[0][2]) ||
      this.compareSymbols(this._cells[1][0], this._cells[1][1], this._cells[1][2]) ||
      this.compareSymbols(this._cells[2][0], this._cells[2][1], this._cells[2][2]) ||
      this.compareSymbols(this._cells[0][0], this._cells[1][1], this._cells[2][2]) ||
      this.compareSymbols(this._cells[0][2], this._cells[1][1], this._cells[2][0])) {

      return true;
    }
    return false;
  }

  compareSymbols = (a, b, c): boolean => {
    return (a === b && b === c && c !== '');
  }

  setResult = (text): void => {
    this.messageResult = text;
  }

  clearCanvas = (): void => {
    this._canvasContext.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
  }

  drawVerticalLineOne = (): void => {
    this._canvasContext.beginPath();
    this._canvasContext.moveTo(this._colWidth, 0);
    this._canvasContext.lineTo(this._colWidth, this._canvasHeight);
    this._canvasContext.stroke();
  }

  drawVerticalLineTwo = (): void => {
    this._canvasContext.beginPath();
    this._canvasContext.moveTo(2 * this._colWidth, 0);
    this._canvasContext.lineTo(2 * this._colWidth, this._canvasHeight);
    this._canvasContext.stroke();
  }

  drawHorizontalLineOne = (): void => {
    this._canvasContext.beginPath();
    this._canvasContext.moveTo(0, this._rowHeight);
    this._canvasContext.lineTo(this._canvasWidth, this._rowHeight);
    this._canvasContext.stroke();
  }

  drawHorizontalLineTwo = (): void => {
    this._canvasContext.beginPath();
    this._canvasContext.moveTo(0, 2 * this._rowHeight);
    this._canvasContext.lineTo(this._canvasWidth, 2 * this._rowHeight);
    this._canvasContext.stroke();
  }

  createBoard = (): void => {

    this.clearBoard();

    this._canvasContext.strokeStyle = '#596575';
    this._canvasContext.lineWidth = 3;

    this.drawVerticalLineOne();
    this.drawVerticalLineTwo();
    this.drawHorizontalLineOne();
    this.drawHorizontalLineTwo();
  }
}
