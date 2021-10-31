import * as PIXI from 'pixi.js';
import { button } from '../assets/loader';
import {GameApp} from './app';

enum ButtonState{
    normal,
    hover,
    pressed,
    disabled,
}

export default class SpinButton{

    private sprite : PIXI.Sprite = null;
    private text : PIXI.Text = null;
    private state  : ButtonState = ButtonState.normal;
    private hovering : boolean = false; 

    constructor(app : PIXI.Application, x : number, y : number, width : number, height : number){
        this.sprite = new PIXI.Sprite();
        this.sprite.texture = PIXI.Texture.from(button.normal);
        this.sprite.width = width;
        this.sprite.height = height;
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.anchor.set(0.5, 0.5);
        
        this.sprite.interactive = true;
        this.sprite.buttonMode = true;
        

        this.sprite.on('pointerdown', this.ClickDown, this);
        this.sprite.on('pointerup', this.ClickUp, this);
        this.sprite.on('pointerover', this.MouseEnter, this);
        this.sprite.on('pointerout', this.MouseExit, this);
        

        app.stage.addChild(this.sprite);

        this.text = new PIXI.Text('Spin', {dropShadow : true, dropShadowBlur : 4, dropShadowDistance : 0, fontFamily : 'Arial', fontSize: 40, fill : 0xffffff, align : 'center'});
        this.text.x = -33;
        this.text.y = -55;
        this.sprite.addChild(this.text);

    }


    private MouseEnter() : void{
        this.hovering = true;
        if(this.state === ButtonState.normal){
            this.SetState(ButtonState.hover);
        }
    }
    private MouseExit() : void{
        this.hovering = false;
        if(this.state === ButtonState.hover){
            this.SetState(ButtonState.normal);
        }
    }
    private ClickDown() : void{
        if(this.state === ButtonState.hover || this.state === ButtonState.normal){
            this.SetState(ButtonState.pressed);
        }
    }
    private ClickUp() : void{
        GameApp.instance.TrySpin();
    }


    public EnableButton() : void{
        if(this.hovering){
            this.SetState(ButtonState.hover);
        }
        else{
            this.SetState(ButtonState.normal);
        }
    }
    public DisableButton() : void{
        this.SetState(ButtonState.disabled);
    }
    
    

    private SetState(newState : ButtonState) : void{
        this.state = newState;
        switch(this.state){
            case ButtonState.normal:
                this.sprite.texture = PIXI.Texture.from(button.normal);
                this.sprite.buttonMode = true;
                break;
            case ButtonState.pressed:
                this.sprite.buttonMode = true;
                this.sprite.texture = PIXI.Texture.from(button.pressed);
                break;
            case ButtonState.hover:
                this.sprite.buttonMode = true;
                this.sprite.texture = PIXI.Texture.from(button.hover);
                break;
            case ButtonState.disabled:
                this.sprite.buttonMode = false;
                this.sprite.texture = PIXI.Texture.from(button.disabled);
                break;
        }
    }
    

}