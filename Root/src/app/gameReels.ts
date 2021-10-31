import { symbols } from '../assets/loader';
import { GameApp } from './app';
import * as PIXI from 'pixi.js';

export enum SymbolAnimationState {
    Idle,
    Entry,
    Exit,
    Winning,
}
export class SymbolHolder{
    private sprite : PIXI.Sprite;
    private symbolIndex : number;

    // would have probably been better to use PIXI transforms, but the docs seemed a bit bare-bones, so I'm just handling positions myself. 
    private defaultX : number; private defaultY : number; // default position when idle on reels
    private offsetX : number; private offsetY : number; 

    private animationState : SymbolAnimationState = SymbolAnimationState.Idle;
    private velocity : number = 0;
    private maxVelocity : number = 100;
    private acceleration : number = 4;

    constructor(symbolSize : number, index : number){
        this.sprite = new PIXI.Sprite();
        this.sprite.width = symbolSize;
        this.sprite.height = symbolSize;
        this.sprite.anchor.set(0.5, 0.5);
        GameApp.instance.app.stage.addChild(this.sprite);

        this.symbolIndex = index;
    }

    public SetAnimationState(state : SymbolAnimationState) : void{
        this.animationState = state;
        switch(this.animationState){
            case SymbolAnimationState.Idle:
                this.SetDefaultValues();
                break;

            case SymbolAnimationState.Entry:
                this.sprite.rotation = 0;
                this.SetPosOffset(0, -800);
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
                if(newOffset > 0){  // Entry animation is finished
                    this.SetAnimationState(SymbolAnimationState.Idle);
                    GameApp.instance.SymbolSpinFinishedCallback(this.symbolIndex);
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
                this.sprite.rotation += deltaTime * 0.1;
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

export class SlotArea{
    private readonly reelCount : number;
    private readonly reelLength : number;
    public symbolHolders : SymbolHolder[] = [];

    constructor(reelLength : number, reelNr: number, symbolSize : number){
        this.reelCount = reelNr;
        this.reelLength = reelLength;
        for(let i = 0; i < reelNr * reelLength; i++){
            this.symbolHolders[i] = new SymbolHolder(symbolSize, i); 
        }
    }
    
    // 10 11 12 13 14
    // 5  6  7  8  9
    // 0  1  2  3  4 
    public SetSymbolSprites(symbolIds : number[]) : void{
        for(let i = 0; i < this.symbolHolders.length; i++){
            this.symbolHolders[i].SetSprite(symbolIds[i]);
        }
    }

    public ArrangeSymbolDefaultPositions(gameOffsetX : number, gameOffsetY : number, symbolSize : number) : void{
        for(let i = 0; i < this.reelLength; i++){
            for(let j = 0; j < this.reelCount; j++){
                this.symbolHolders[GameApp.instance.GetSymbolIndex(i,j)].SetDefaultPosition(gameOffsetX + symbolSize * j, gameOffsetY + symbolSize * (this.reelLength - i));
            }
        }
    }

    public UpdateSymbols(deltaTime : number): void{
        for(let i = 0; i < this.reelLength; i++){
            for(let j = 0; j < this.reelCount; j++){
                this.symbolHolders[GameApp.instance.GetSymbolIndex(i,j)].UpdateSymbolHolder(deltaTime);
            }
        }
    }
}
