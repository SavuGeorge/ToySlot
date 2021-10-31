import Symbol01 from './images/symbols/symbol_1.png';
import Symbol02 from './images/symbols/symbol_2.png';
import Symbol03 from './images/symbols/symbol_3.png';
import Symbol04 from './images/symbols/symbol_4.png';
import Symbol05 from './images/symbols/symbol_5.png';
import Symbol06 from './images/symbols/symbol_6.png';
import Symbol07 from './images/symbols/symbol_7.png';
import Symbol08 from './images/symbols/symbol_8.png';

import buttonDisabled from './images/ui/btn_spin_disabled.png';
import buttonHover from './images/ui/btn_spin_hover.png';
import buttonNormal from './images/ui/btn_spin_normal.png';
import buttonPressed from './images/ui/btn_spin_pressed.png';

import bananaFrames from './images/PeanutButterJellyTime/*.png'

import {Howl, Howler} from 'howler';

import spinSFX from './sounds/Start_Button.mp3';
import stop1 from './sounds/Reel_Stop_1.mp3';
import stop2 from './sounds/Reel_Stop_2.mp3';
import stop3 from './sounds/Reel_Stop_3.mp3';
import stop4 from './sounds/Reel_Stop_4.mp3';
import stop5 from './sounds/Reel_Stop_5.mp3';

export const button = {
    'disabled' : buttonDisabled,
    'hover' : buttonHover,
    'normal' : buttonNormal,
    'pressed' : buttonPressed,
}

export const symbols = {
    0 : Symbol01,
    1 : Symbol02,
    2 : Symbol03,
    3 : Symbol04,
    4 : Symbol05,
    5 : Symbol06,
    6 : Symbol07,
    7 : Symbol08,
};

export const banana = {
    'idle' : Object.values(bananaFrames),
}

export const sfx = {
    'spin' : new Howl({src : spinSFX}),
    's1' : new Howl({src : stop1}),
    's2' : new Howl({src : stop2}),
    's3' : new Howl({src : stop3}),
    's4' : new Howl({src : stop4}),
    's5' : new Howl({src : stop5}),
}