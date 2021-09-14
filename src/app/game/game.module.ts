import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameComponent } from './game/game.component';
import { BoardComponent } from './board/board.component';



@NgModule({
  declarations: [
    GameComponent,
    BoardComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    GameComponent
  ]
})
export class GameModule { }
