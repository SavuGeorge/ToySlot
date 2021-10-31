import * as PIXI from 'pixi.js';
import {Howl, Howler} from 'howler';
import Utility from './util';
import SpinButton from './spinButton';
import { banana } from '../assets/loader';
import { sfx } from '../assets/loader';
import { SlotArea } from './gameReels';
import { SymbolAnimationState } from './gameReels';

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

    private canSpin : boolean = false;
    private symbolIdList : number[] = [];

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
        this.peanutButterJellyTime.y = 50000;
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
        this.peanutButterJellyTime.y = 50000;

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
        GameApp.instance.symbolIdList = Utility.getRandomIntArray(GameApp.instance.symbolTypeCount, GameApp.instance.totalPositions);
        GameApp.instance.gameHolder.SetSymbolSprites(GameApp.instance.symbolIdList);
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
            this.SpinFinished();
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
    private SpinFinished() : void{
        this.SetCanSpin(true);
        this.ComputeToyWinLines();
    }
    private ComputeToyWinLines() : void{   // Hard coded extra for fun. 2 or more consecutive symbols on a row are a win.
        let lineResult1 = this.ComputeToyWinLine(0, 5); 
        let lineResult2 = this.ComputeToyWinLine(5, 10);
        let lineResult3 = this.ComputeToyWinLine(10, 15);
        if(lineResult1 || lineResult2 || lineResult3) {  // if at least one win we do some cheering!
            sfx['yay'].play();
            this.peanutButterJellyTime.y = 300;
        }
    }
    private ComputeToyWinLine(rowStart : number, rowEnd : number) : boolean{
        let firstSymbol : number = this.symbolIdList[rowStart];
        let foundWin : boolean = false;
        for(let i = rowStart+1; i < rowEnd; i++){
            if(this.symbolIdList[i] === firstSymbol){
                foundWin = true;
                this.gameHolder.symbolHolders[i].SetAnimationState(SymbolAnimationState.Winning);
            }
            else{ // line broke :(
                break;
            }
        }
        if(foundWin){
            this.gameHolder.symbolHolders[rowStart].SetAnimationState(SymbolAnimationState.Winning);
        }
        return foundWin;
    }
    
    public GetSymbolIndex(i : number, j : number) : number{
        return i * this.reelCount + j;
    }

}
