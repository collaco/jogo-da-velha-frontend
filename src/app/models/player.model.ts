import { TypePlayer } from "@enums/type-player.enum";

export interface Player {
    name: string;
    symbol: string;
    color: string;
    type: TypePlayer
}
