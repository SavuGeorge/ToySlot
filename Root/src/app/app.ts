import * as PIXI from 'pixi.js';
import Utility from './util';
import { symbols } from '../assets/loader';

export class SymbolHolder{
    private sprite : PIXI.Sprite;
    private defaultX : number;
    private defaultY : number;

    constructor(symbolSize : number){
        this.sprite = new PIXI.Sprite();
        this.sprite.width = symbolSize;
        this.sprite.height = symbolSize;
        this.sprite.anchor.set(0.5, 0.5);
        GameApp.app.stage.addChild(this.sprite);
    }
    public SetSprite(symbolIndex : number){
        this.sprite.texture = PIXI.Texture.from(symbols[Utility.getRandomInt(8)]);
    }
    public SetPosOffset(x : number, y : number){
        this.sprite.x = this.defaultX + x;
        this.sprite.y = this.defaultY + y;
    }
    public SetDefaultPosition(x : number, y : number){
        this.defaultX = x;
        this.defaultY = y;
        this.SetPosOffset(0, 0);
    }
}

export class Reel{
    public readonly reelLength : number;
    public holders : SymbolHolder[] = [];

    constructor(len : number, symbolSize : number){
        this.reelLength = len;
        for(let i = 0; i < len; i++){
            this.holders[i] = new SymbolHolder(symbolSize);
        }
    }
}

export class SlotArea{
    private readonly reelCount : number;
    private readonly reelLength : number;
    private reels : Reel[] = [];

    constructor(reelLength : number, reelNr: number, symbolSize : number){
        this.reelCount = reelNr;
        this.reelLength = reelLength;
        for(let i = 0; i < reelNr; i++){
            this.reels[i] = new Reel(reelLength, symbolSize); 
        }
    }
    
    // 0 3 6 9  12 
    // 1 4 7 10 13
    // 2 5 8 11 14
    public SetSymbolSprites(symbolIds : number[]) : void{
        for(let i = 0; i < this.reelCount; i++){
            for(let j = 0; j < this.reelLength; j++){
                this.reels[i].holders[j].SetSprite(symbolIds[i * this.reelLength + j]);
            }
        }
    }

    public ArrangeSymbolDefaultPositions(gameOffsetX : number, gameOffsetY : number, symbolSize : number){
        for(let i = 0; i < this.reelCount; i++){
            for(let j = 0; j < this.reelLength; j++){
                this.reels[i].holders[j].SetDefaultPosition(gameOffsetX + symbolSize * i, gameOffsetY + symbolSize * j);
            }
        }
    }
}

export class GameApp {

    // Made some public static stuff for ease of use in prototype, not worrying too much about architecture, would typically mostly avoid globals. 
    public static app: PIXI.Application; 
    public static reelLength : number = 3;
    public static reelCount : number = 5;
    public static totalPositions : number = GameApp.reelLength * GameApp.reelCount;
    public static symbolSize : number = 200;
    public static symbolTypeCount : number = 8;
    
    private gameHolder : SlotArea = null;

    constructor(parent: HTMLElement, width: number, height: number, symbolSize : number) {

        GameApp.app = new PIXI.Application({width, height, backgroundColor : 0x000000});
        parent.replaceChild(GameApp.app.view, parent.lastElementChild); // Hack for parcel HMR

        // init Pixi loader
        let loader = new PIXI.Loader();

        // Load assets
        loader.load(this.onAssetsLoaded.bind(this));
    }

    private onAssetsLoaded() {
        
        this.gameHolder = new SlotArea(GameApp.reelLength, GameApp.reelCount, GameApp.symbolSize);                    // generating Sprite holders, grouped by reels
        this.gameHolder.SetSymbolSprites(Utility.getRandomIntArray(GameApp.symbolTypeCount, GameApp.totalPositions)); // initing with a set of random symbols.
        this.gameHolder.ArrangeSymbolDefaultPositions(200, 200, GameApp.symbolSize);                                  // setting default positions for all symbolHolders

    }

}
