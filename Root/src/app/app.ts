import * as PIXI from 'pixi.js';
import {Howl, Howler} from 'howler';
import Utility from './util';
import SpinButton from './spinButton';
import { symbols } from '../assets/loader';
import { banana } from '../assets/loader';
import { sfx } from '../assets/loader';

enum SymbolAnimationState {
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
    public SetRandomSymbolSprites(symbolIds : number[]) : void{
        for(let i = 0; i < this.reelLength; i++){
            for(let j = 0; j < this.reelCount; j++){
                this.symbolHolders[GameApp.instance.GetSymbolIndex(i,j)].SetSprite(symbolIds[GameApp.instance.GetSymbolIndex(i,j)]);
            }
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

export class GameApp {

    public static instance: GameApp;

    public app: PIXI.Application; 

    private gameHolder : SlotArea = null;
    private button : SpinButton = null;
    private buttonX : number = 1250;
    private buttonY : number = 725;
    private buttonWidth : number = 200;
    private buttonHeight : number = 200;

    private peanutButterJellyTime : PIXI.AnimatedSprite;

    public reelLength : number = 3;
    public reelCount : number = 5;
    public totalPositions : number = 0;
    public gameOffsetX : number = 200;
    public gameOffsetY : number = 50;

    public symbolSize : number = 200;
    public symbolTypeCount : number = 8;


    public rowStartDelay : number = 150;
    public symbolStartDelay : number = 40;    
    public spinEntryDelay : number = 800;

    public canSpin : boolean = false;

    constructor(parent: HTMLElement, width: number, height: number, symbolSize : number) {

        GameApp.instance = this;

        GameApp.instance.app = new PIXI.Application({width, height, backgroundColor : 0xFCFCFC});
        parent.replaceChild(GameApp.instance.app.view, parent.lastElementChild); // Hack for parcel HMR

        this.totalPositions = this.reelLength * this.reelCount;

        this.button = new SpinButton(this.app, this.buttonX, this.buttonY, this.buttonWidth, this.buttonHeight);

        // init Pixi loader
        let loader = new PIXI.Loader();

        // Load assets
        loader.load(this.OnAssetsLoaded.bind(this));
    }
    private OnAssetsLoaded() : void {
        this.gameHolder = new SlotArea(this.reelLength, this.reelCount, this.symbolSize);                            // generating Sprite holders, grouped by reels
        this.RandomizeSymbols();                                                                                     // initing with a set of random symbols.
        this.gameHolder.ArrangeSymbolDefaultPositions(this.gameOffsetX, this.gameOffsetY, this.symbolSize);          // setting default positions for all symbolHolders
        this.SetCanSpin(true);

        // Adding update method 
        this.app.ticker.add(this.Update);

        // Space bar spins
        window.addEventListener('keydown', event => {
            if (event.code === 'Space') {
                this.TrySpin();
            }});

            
        this.peanutButterJellyTime = new PIXI.AnimatedSprite(banana['idle'].map(path => PIXI.Texture.from(path)));
        this.peanutButterJellyTime.x = 1400;
        this.peanutButterJellyTime.y = 300;
        this.peanutButterJellyTime.anchor.set(0.5, 0.5);
        this.peanutButterJellyTime.animationSpeed = 0.1;
        this.peanutButterJellyTime.play();

        this.app.stage.addChild(this.peanutButterJellyTime);
    }



    public TrySpin() : void{
        if(GameApp.instance.canSpin){
            GameApp.instance.SetCanSpin(false);
            this.Spin();
        }
    }
    private Spin() : void{
        sfx['spin'].play();

        for(let i = 0; i < this.reelLength; i++){
            for(let j = 0; j < this.reelCount; j++){
                // If this was a real game we would need a separate waitingForResponse state before going into Entry. Just waiting a constant time instead here.
                this.SetSymbolAnimState(i, j, SymbolAnimationState.Idle);
                setTimeout(this.SetSymbolAnimState, i * this.rowStartDelay + j * this.symbolStartDelay, i, j, SymbolAnimationState.Exit);
                
                setTimeout(this.RandomizeSymbols, this.spinEntryDelay);
                setTimeout(this.SetSymbolAnimState, this.spinEntryDelay + i * this.rowStartDelay + j * this.symbolStartDelay, i, j, SymbolAnimationState.Entry);
            }
        }
    }
    private Update(this: any, delta: number) : void {
        GameApp.instance.gameHolder.UpdateSymbols(delta);
    }



     // using singleton access here to use setTimeout for easy delays, could definitely be done better.
    private SetSymbolAnimState(i : number, j : number, state : SymbolAnimationState) : void{
        GameApp.instance.gameHolder.symbolHolders[GameApp.instance.GetSymbolIndex(i,j)].SetAnimationState(state);
    }
    private RandomizeSymbols() : void{
        GameApp.instance.gameHolder.SetRandomSymbolSprites(Utility.getRandomIntArray(GameApp.instance.symbolTypeCount, GameApp.instance.totalPositions));
    }
    public SetCanSpin(status : boolean) : void{
        this.canSpin = status;
        if(this.canSpin){
            this.button.EnableButton();
        }
        else{
            this.button.DisableButton();
        }
    }


    public SymbolSpinFinishedCallback(symbolIndex : number) : void{ 
        // when the last symbol finishes spinning we enabled spins again
        if(symbolIndex === this.totalPositions-1){
            this.SetCanSpin(true);
        }
        else if(symbolIndex === 0){  // Very hard coded way of playing sounds here, could be done a lot better
            sfx['s1'].play();
        }
        else if(symbolIndex === 1){
            sfx['s2'].play();
        }
        else if(symbolIndex === 2){
            sfx['s3'].play();
        }
        else if(symbolIndex === 3){
            sfx['s4'].play();
        }
        else if(symbolIndex === 4){
            sfx['s5'].play();
        }
    }

    
    public GetSymbolIndex(i : number, j : number) : number{
        return i * this.reelCount + j;
    }

}
