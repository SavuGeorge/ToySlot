import * as PIXI from 'pixi.js';
import Utility from './util';
import { symbols } from '../assets/loader';

enum SymbolAnimationState {
    Idle,
    Entry,
    Exit,
    Winning,
}
export class SymbolHolder{
    private sprite : PIXI.Sprite;

    // would have probably been better to use PIXI transforms, but the docs seemed a bit bare-bones, so I'm just handling positions myself. 
    private defaultX : number; private defaultY : number; // default position when idle on reels
    private offsetX : number; private offsetY : number; 

    private animationState : SymbolAnimationState = SymbolAnimationState.Idle;
    private velocity : number = 0;
    private maxVelocity : number = 100;
    private acceleration : number = 1;

    constructor(symbolSize : number){
        this.sprite = new PIXI.Sprite();
        this.sprite.width = symbolSize;
        this.sprite.height = symbolSize;
        this.sprite.anchor.set(0.5, 0.5);
        GameApp.instance.app.stage.addChild(this.sprite);
    }

    public SetAnimationState(state : SymbolAnimationState) : void{
        this.animationState = state;
        switch(this.animationState){
            case SymbolAnimationState.Idle:
                this.SetDefaultValues();

                break;

            case SymbolAnimationState.Entry:
                this.sprite.rotation = 0;
                this.SetPosOffset(0, -1000);
                this.velocity = 0;

                break;

            case SymbolAnimationState.Exit:
                this.SetDefaultValues();


                break;

            case SymbolAnimationState.Winning:
                this.SetDefaultValues();
                
                break;  
        }
    }

    

    public UpdateSymbolHolder(deltaTime : number){
        switch(this.animationState){
            case SymbolAnimationState.Idle: 
                break;

            case SymbolAnimationState.Entry: // move until reaching position on reel
                this.velocity += this.acceleration * deltaTime;
                if(this.velocity > this.maxVelocity){
                    this.velocity = this.maxVelocity;
                }
                let newOffset : number = this.offsetY + this.velocity * deltaTime;
                if(newOffset < 0){  // Entry animation is finished
                    this.SetAnimationState(SymbolAnimationState.Idle);
                }   
                else{
                    this.SetPosOffsetY(newOffset);
                }             
                break;

            case SymbolAnimationState.Exit: // just keep falling down
                this.velocity += this.acceleration * deltaTime;
                if(this.velocity > this.maxVelocity){
                    this.velocity = this.maxVelocity;
                }
                this.SetPosOffsetY(this.offsetY + this.velocity * deltaTime); 
                break;

            case SymbolAnimationState.Winning: // Spin for the win! :D
                this.sprite.rotation += deltaTime * 10;
                break;  
        }
    }

    // resting on default pos with no rotation or velocity.
    private SetDefaultValues() : void{
        this.sprite.rotation = 0;
        this.SetPosOffset(0,0);
        this.velocity = 0;
    }
    
    public SetSprite(symbolIndex : number){
        this.sprite.texture = PIXI.Texture.from(symbols[symbolIndex]);
    }
    public SetPosOffset(x : number, y : number){
        this.offsetX = x;
        this.offsetY = y;
        this.sprite.x = this.defaultX + x;
        this.sprite.y = this.defaultY + y;
    }
    public SetPosOffsetX(x : number){
        this.offsetX = x;
        this.sprite.x = this.defaultX + x;
    }
    public SetPosOffsetY(y : number){
        this.offsetY = y;
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
    public reels : Reel[] = [];

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

    public ArrangeSymbolDefaultPositions(gameOffsetX : number, gameOffsetY : number, symbolSize : number) : void{
        for(let i = 0; i < this.reelCount; i++){
            for(let j = 0; j < this.reelLength; j++){
                this.reels[i].holders[j].SetDefaultPosition(gameOffsetX + symbolSize * i, gameOffsetY + symbolSize * j);
            }
        }
    }

    public UpdateSymbols(deltaTime : number): void{
        for(let i = 0; i < this.reelCount; i++){
            for(let j = 0; j < this.reelLength; j++){
                this.reels[i].holders[j].UpdateSymbolHolder(deltaTime);
            }
        }
    }
}

export class GameApp {

    public static instance: GameApp;
    private gameHolder : SlotArea = null;
    public canSpin : boolean = false;

    // Some random game configuration variables. Could be better placed
    public app: PIXI.Application; 

    public reelLength : number = 3;
    public reelCount : number = 5;
    public totalPositions : number = 0;

    public symbolSize : number = 200;
    public symbolTypeCount : number = 8;

    public reelStartDelay : number = 100;
    public symbolStartDelay : number = 30;    



    constructor(parent: HTMLElement, width: number, height: number, symbolSize : number) {

        GameApp.instance = this;

        GameApp.instance.app = new PIXI.Application({width, height, backgroundColor : 0x000000});
        parent.replaceChild(GameApp.instance.app.view, parent.lastElementChild); // Hack for parcel HMR

        this.totalPositions = this.reelLength * this.reelCount;

        // init Pixi loader
        let loader = new PIXI.Loader();

        // Load assets
        loader.load(this.onAssetsLoaded.bind(this));
    }

    private onAssetsLoaded() : void {
        
        this.gameHolder = new SlotArea(this.reelLength, this.reelCount, this.symbolSize);                            // generating Sprite holders, grouped by reels
        this.gameHolder.SetSymbolSprites(Utility.getRandomIntArray(this.symbolTypeCount, this.totalPositions));      // initing with a set of random symbols.
        this.gameHolder.ArrangeSymbolDefaultPositions(200, 200, this.symbolSize);                                    // setting default positions for all symbolHolders
        this.canSpin = true;

        // Adding update method 
        this.app.ticker.add(this.Update);

        // Space bar spins
        window.addEventListener('keydown', event => {
            if (event.code === 'Space') {
                this.TrySpin();
            }});
    }

    private TrySpin() : void{
        if(GameApp.instance.canSpin){
            for(let i = 0; i < this.reelCount; i++){
                for(let j = 0; j < this.reelLength; j++){
                    this.SetSymbolAnimState(i, j, SymbolAnimationState.Idle);
                    setTimeout(this.SetSymbolAnimState, i * this.reelStartDelay + (this.reelLength - j) * this.symbolStartDelay, i, j, SymbolAnimationState.Exit);
                }
            }
        }
    }
    private SetSymbolAnimState(i : number, j : number, state : SymbolAnimationState) : void{ // using this to use setTimeout for easy delays, not ideal
        GameApp.instance.gameHolder.reels[i].holders[j].SetAnimationState(state);
    }

    private Update(this: any, delta: number) : void {
        GameApp.instance.gameHolder.UpdateSymbols(delta);
    }

}
