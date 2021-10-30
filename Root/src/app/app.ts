import * as PIXI from 'pixi.js';
import { symbols } from '../assets/loader';

export class GameApp {

    
    private app: PIXI.Application; 

    constructor(parent: HTMLElement, width: number, height: number, symbolSize : number) {

        this.app = new PIXI.Application({width, height, backgroundColor : 0x000000});
        parent.replaceChild(this.app.view, parent.lastElementChild); // Hack for parcel HMR

        // init Pixi loader
        let loader = new PIXI.Loader();

        // Load assets
        loader.load(this.onAssetsLoaded.bind(this));
    }

    private onAssetsLoaded() {

        let testSprite = new PIXI.Sprite();
        testSprite.x = 300;
        testSprite.y = 300;
        testSprite.anchor.set(0.5, 0.5);
        testSprite.texture = PIXI.Texture.from(symbols[1]);
    
        this.app.stage.addChild(testSprite);

    }

}
