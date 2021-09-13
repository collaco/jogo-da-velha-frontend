import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { WebSocketService } from './web-socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  // Jogador 1
  player1 = { name: "Você", symbol: "X", color: "#33b4d6" };

  // Jogador 2
  player2 = { name: "Computador", symbol: "O", color: "#2ce0b7" };

  // Status do jogo (vitoria ou empate)
  status = "";

  // Jogador atual
  currentPlayer;

  // Largura do canvas
  canvasWidth = 400;

  // Altura do canvas
  canvasHeight = 400;

  // Contexto de renderização do canvas
  _ctx = null;

  // Matriz representando o tabuleiro
  _matrix = null;

  // Indica se a partida está em andamento ou não
  _isRunning = false;

  // Largura da coluna no tabuleiro
  _colWidth = 0;

  // Altura da linha no tabuleiro
  _colHeight = 0;

  _rowHeight = 0;

  title: string = 'Jogo da Velha';

  _blockPlay: boolean = false;

  _message: string;

  _messageResult: string;

  _level: number = 1;

  _winner: boolean = false;

  _tie: boolean = false;

  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;

  constructor(private _webSocketService: WebSocketService) {
    this.currentPlayer = this.player1;
  }

  ngOnInit() {

    // Dimensões do canvas
    this.canvas.nativeElement.width = this.canvasWidth;
    this.canvas.nativeElement.height = this.canvasHeight;
    this.canvas.nativeElement.style.width = String(this.canvasWidth);
    this.canvas.nativeElement.style.height = String(this.canvasHeight);

    // Dimensões das colunas (um terço da largura e da altura do canvas, respectivamente)
    this._colWidth = this.canvasWidth / 3;
    this._rowHeight = this.canvasHeight / 3;

    this._ctx = this.canvas.nativeElement.getContext('2d');

    this.newGame();

    this._webSocketService.listen('new-play').subscribe(data => {
      this.newPlayComputer(data.row, data.col);
    });

    this._webSocketService.listen('update-level').subscribe(level => {
      this._level = level;
    });
  }

  nextLevel = function() {
    this._winner = false;
    this._tie = false;
    this.newGame(true);
  }

  newGame = function (nextLevel = false) {

    this._message = "Jogo Iniciado"
    this._blockPlay = false;

    if (nextLevel) {
      this.currentPlayer = this.player2;
      this._webSocketService.emit('next-level-game', this.currentPlayer);
    } else {
      this.currentPlayer = this.player1;
      this._webSocketService.emit('start-game', this.currentPlayer);
    }

    // Limpa o status
    this.status = "";

    // Limpa o canvas
    this._clearCanvas();

    // Limpa a matriz
    this._matrix = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ];

    // Limpa o resultado
    this._setResult('');

    // Cria um novo tabuleiro
    this._createBoard();

    // Altera a flag de jogo em andamento
    this._isRunning = true;
  };

  newPlayComputer(row, col) {
    if (this._isRunning) {
      this.renderSymbol(row, col);
      this.changePlayer();
    }
  }

  // Define uma nova jogada quando o jogador clica em uma região do canvas
  newPlay = function (event) {

    console.log('new play');

    if (this._isRunning && !this._blockPlay) {

      // Obtem a coluna e a linha onde o jogador clicou
      var col = Math.floor(event.offsetX / this._colWidth);
      var row = Math.floor(event.offsetY / this._rowHeight);

      // Verifica se a posição na matriz está vazia
      if (this._matrix[row][col] == "") {
        console.log('entrou');

        this.renderSymbol(row, col);
        this._webSocketService.emit('new-play', {
          row: row,
          col: col,
          symbol: this.currentPlayer.symbol
        });

        this.changePlayer();
      }
    }
    this.renderSymbol(-1, -1);
  };

  // Alterna entre um jogador e outro
  changePlayer = function () {
    if (this.currentPlayer.name == this.player2.name) {
      this.currentPlayer = this.player1;
      this._blockPlay = false;
    } else {
      this.currentPlayer = this.player2;
      this._blockPlay = true;
    }
  };


  // Desenha um símbolo no tabuleiro
  renderSymbol = function (row, col) {

    if (row != -1 && col != -1) {

      // Configura o canvas antes de desenhar o símbolo
      this._ctx.fillStyle = this.currentPlayer.color;
      this._ctx.font = (this.canvasWidth / 5) + "px Arial";
      this._ctx.textAlign = "center";
      this._ctx.textBaseline = "middle";
      this._ctx.fillText(this.currentPlayer.symbol, col * this._colWidth + this._colWidth / 2, row * this._rowHeight + this._rowHeight / 2);
      this._matrix[row][col] = this.currentPlayer.symbol;

      // Verifica se houve vitória ou empate e encerra o jogo
      if (this._isVictory()) {
        this._winner = (this.currentPlayer.name == this.player1.name);
        this._tie = false;
        this._setResult(this.currentPlayer.name + " venceu!");
        this._isRunning = false;
      }
      else if (this._isTie()) {
        this._tie = true;
        this._setResult("Empate!");
        this._isRunning = false;
      }
    }
  };

  // Verifica se houve empate
  _isTie = function () {
    var count = 0;
    var cols = this._matrix[0].length;
    var rows = this._matrix.length;

    // Conta a quantidade de posições com algum símbolo e compara com o total de posições
    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        if (this._matrix[i][j] != "") {
          count++;
        }
      }
    }

    var isTie = count == cols * rows;

    if (isTie) {
      this._winner = false;
      this.status = "empate";
    }

    return isTie;
  };

  // Verifica se houve vitória
  _isVictory = function () {
    if (
      // Compara os símbolos na vertical
      this._compareSymbols(this._matrix[0][0], this._matrix[1][0], this._matrix[2][0]) ||
      this._compareSymbols(this._matrix[0][1], this._matrix[1][1], this._matrix[2][1]) ||
      this._compareSymbols(this._matrix[0][2], this._matrix[1][2], this._matrix[2][2]) ||

      // Compara os símbolos na horizontal
      this._compareSymbols(this._matrix[0][0], this._matrix[0][1], this._matrix[0][2]) ||
      this._compareSymbols(this._matrix[1][0], this._matrix[1][1], this._matrix[1][2]) ||
      this._compareSymbols(this._matrix[2][0], this._matrix[2][1], this._matrix[2][2]) ||

      // Compara os símbolos na diagonal
      this._compareSymbols(this._matrix[0][0], this._matrix[1][1], this._matrix[2][2]) ||
      this._compareSymbols(this._matrix[0][2], this._matrix[1][1], this._matrix[2][0])) {

      // Houve vitória
      this.status = "vitoria";

      return true;
    }
    return false;
  };

  // Compara três símbolos
  _compareSymbols = function (a, b, c) {
    return a == b && b == c && c != "";
  };

  // Exibe o resultado
  _setResult = function (text) {
    this._messageResult = text;
  };

  // Limpa o canvas
  _clearCanvas = function () {
    this._ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  };

  // Cria o tabuleiro
  _createBoard = function () {

    // Cor da linhas
    this._ctx.strokeStyle = "#596575";

    // Espessura das linhas
    this._ctx.lineWidth = 3;

    // Desenha a linha vertical 1
    this._ctx.beginPath();
    this._ctx.moveTo(this._colWidth, 0);
    this._ctx.lineTo(this._colWidth, this.canvasHeight);
    this._ctx.stroke();

    // Desenha a linha vertical 2
    this._ctx.beginPath();
    this._ctx.moveTo(2 * this._colWidth, 0);
    this._ctx.lineTo(2 * this._colWidth, this.canvasHeight);
    this._ctx.stroke();

    // Desenha a linha horizontal 1
    this._ctx.beginPath();
    this._ctx.moveTo(0, this._rowHeight);
    this._ctx.lineTo(this.canvasWidth, this._rowHeight);
    this._ctx.stroke();

    // Desenha a linha horizontal 2
    this._ctx.beginPath();
    this._ctx.moveTo(0, 2 * this._rowHeight);
    this._ctx.lineTo(this.canvasWidth, 2 * this._rowHeight);
    this._ctx.stroke();
  };
}
