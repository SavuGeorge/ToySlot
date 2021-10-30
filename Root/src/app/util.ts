export default class Utility{
    public static getRandomInt(max : number) : number {
        return Math.floor(Math.random() * max);
    }
    public static getRandomIntArray(max : number, count : number) : number[]{
        let ret = [];
        for(let i = 0; i < count; i++){
            ret[i] = Utility.getRandomInt(max);
        }
        return ret;
    }
}