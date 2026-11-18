import type { GlyphId } from './types'
import { box, canvas, line, oval, poly, shade, type Ink } from './pixelInk'

export const ICON_SIZE=24
const outline='#221922',brass='#b98751',gold='#f4ce8a',white='#fff0cd',steel='#9daec3',steelHi='#e1eced'
const cache=new Map<string,HTMLCanvasElement>()

function crystal(c:Ink,x:number,y:number,r:number,tone:string){
  poly(c,outline,[x,y-r-1,x+r+1,y,x,y+r+1,x-r-1,y])
  poly(c,shade(tone,-50),[x,y-r,x+r,y,x,y+r,x-r,y]);poly(c,tone,[x,y-r,x+1,y+1,x,y+r,x-r,y]);poly(c,shade(tone,56),[x,y-r,x+2,y,x-1,y+2,x-4,y-1]);box(c,white,x-1,y-4,1,3)
}
function spark(c:Ink,x:number,y:number,r:number,tone:string){
  poly(c,tone,[x,y-r,x+1,y-1,x+r,y,x+1,y+1,x,y+r,x-1,y+1,x-r,y,x-1,y-1]);box(c,white,x,y,1,1)
}
function sword(c:Ink,glint:string){
  poly(c,outline,[-9,6,-6,3,-5,1,-3,1,5,-8,10,-10,10,-5,1,5,2,7,-1,9,-3,7,-6,10,-9,10]);
  poly(c,'#768199',[-4,3,6,-7,9,-9,9,-5,0,5]);poly(c,steelHi,[-3,3,7,-7,9,-9,8,-5,-1,4]);line(c,glint,-1,4,6,-3)
  line(c,brass,-5,1,1,7,3);line(c,gold,-5,1,1,7);line(c,'#71463b',-7,8,-4,5,3);box(c,gold,-8,8,3,2);box(c,white,-4,2,1,1)
}
function bottle(c:Ink,tone:string){
  poly(c,outline,[-4,-8,4,-8,4,-4,7,-1,8,2,7,7,4,9,-5,9,-8,6,-8,1,-4,-4]);
  poly(c,'#9cabc1',[-2,-7,2,-7,2,-3,5,-1,6,2,6,6,4,8,-4,8,-6,5,-6,1,-2,-3]);
  poly(c,shade(tone,-49),[-6,1,-3,0,2,1,5,0,6,3,5,6,3,7,-4,7,-6,5]);poly(c,tone,[-5,1,-2,0,4,1,5,3,3,6,-4,6,-5,4]);
  line(c,shade(tone,54),-4,2,-4,5);box(c,'#e5e7e2',-5,0,1,2);box(c,'#a57349',-4,-9,8,3);box(c,gold,-3,-9,5,1);box(c,'#f8eed9',-3,-5,6,1)
}
function arrow(c:Ink,tone:string){
  line(c,outline,-9,7,8,-7,3);line(c,steelHi,-8,6,8,-7);poly(c,tone,[5,-8,10,-9,9,-3,7,-4,7,-6]);poly(c,gold,[-8,5,-5,1,-3,2,-6,6,-3,7,-6,9,-8,9]);
}

/** Pixel symbols for the real item and skill catalogs. Shared cached textures avoid redrawing on HUD ticks. */
export function iconTexture(id:GlyphId,tone:string,charged=false){
  const key=`${id}/${tone}/${charged}`,cached=cache.get(key);if(cached)return cached
  const {a,c}=canvas(ICON_SIZE,ICON_SIZE),mid=shade(tone,-40),deep=shade(tone,-79),light=shade(tone,56)
  c.translate(12,12)
  if(charged){
    poly(c,`${tone}36`,[-10,3,-5,-8,1,-11,9,-7,10,0,5,9,-2,10]);
    line(c,`${tone}58`,-10,8,-3,1);line(c,`${tone}6c`,1,6,9,-8)
    box(c,`${light}92`,-9,-6,2,1);box(c,`${light}92`,8,6,1,2);box(c,`${tone}9d`,7,-9,2,1)
  }
  switch(id){
    case 'sword':sword(c,charged?tone:gold);break
    case 'blades':{
      for(const s of [-1,1]){c.save();c.scale(s,1);line(c,outline,-7,9,8,-8,4);poly(c,steel,[-4,3,4,-6,9,-9,8,-4,-2,6]);line(c,steelHi,-3,3,8,-7);line(c,brass,-5,1,-1,6,2);box(c,gold,-4,3,3,2);box(c,'#8b5148',-7,7,2,3);c.restore()}
      if(charged)spark(c,0,-1,3,light);break
    }
    case 'bow':{
      poly(c,outline,[-8,-10,-2,-9,2,-6,5,-2,4,4,0,9,-7,11,-4,6,-1,2,-1,-3,-4,-7]);line(c,steelHi,-7,-8,-6,8)
      line(c,brass,-7,-9,-1,-6,2);line(c,gold,-1,-6,3,-1,2);line(c,brass,3,-1,2,4,2);line(c,gold,2,4,-5,9,2);arrow(c,charged?light:steelHi);break
    }
    case 'shield':{
      poly(c,outline,[-9,-7,0,-11,9,-7,8,3,4,8,0,11,-5,7,-8,3]);poly(c,brass,[-8,-6,0,-9,8,-6,7,3,3,8,0,9,-4,6,-7,2]);
      poly(c,mid,[-6,-5,0,-7,6,-5,5,2,2,6,0,7,-3,4,-5,1]);line(c,gold,-7,-6,0,-9);line(c,light,-4,-4,0,-6);crystal(c,0,0,4,tone);break
    }
    case 'sparkle':{
      poly(c,deep,[-9,1,-4,-3,-1,-9,4,-3,9,-1,5,5,0,10,-4,5]);spark(c,1,0,9,mid);spark(c,1,0,6,light);spark(c,-6,-5,3,tone);spark(c,7,5,3,tone);break
    }
    case 'sun':{
      oval(c,outline,0,0,8,8);oval(c,deep,0,0,7,7);oval(c,brass,0,0,5,5);oval(c,light,-1,-1,3,3)
      for(let i=0;i<8;i++){const a=i*Math.PI/4;line(c,i%2?gold:white,Math.cos(a)*7,Math.sin(a)*7,Math.cos(a)*10,Math.sin(a)*10)}
      spark(c,0,0,4,white);break
    }
    case 'cross':case 'wand':{
      line(c,outline,-7,8,4,-6,4);line(c,'#9b6343',-6,8,5,-6,2);line(c,gold,-5,7,5,-5)
      if(id==='cross'){poly(c,brass,[0,-7,3,-9,9,-9,7,-4,9,-2,7,1,4,-1,0,-1,-1,-3,2,-5]);line(c,gold,2,-2,7,-9,2);line(c,light,0,-7,8,-4,2);box(c,white,4,-6,2,2)}
      else{crystal(c,5,-6,4,tone);spark(c,-2,-7,2,light);box(c,white,9,-1,1,2)}break
    }
    case 'flame':{
      poly(c,deep,[-9,2,-7,-4,-4,-2,-2,-10,2,-7,4,-2,7,-5,9,3,5,8,-1,10,-7,7]);
      poly(c,tone,[-7,1,-5,-1,-3,0,-1,-7,2,-4,3,1,6,-2,7,4,4,7,-1,8,-5,6]);
      poly(c,light,[-4,4,-1,1,1,-3,3,3,4,5,1,7,-2,7]);box(c,white,0,4,2,2);spark(c,6,-7,2,tone);break
    }
    case 'orb':{
      oval(c,outline,0,0,10,9);oval(c,deep,0,0,8,8);oval(c,tone,0,0,7,7);oval(c,'#292039',2,-1,6,6)
      line(c,light,-6,-5,-8,0,2);line(c,tone,-7,2,-3,6,2);line(c,light,-3,6,3,7);box(c,white,-5,-4,2,2);spark(c,6,-6,3,light);break
    }
    case 'heart':{
      const shape=[0,-5,4,-9,8,-7,10,-3,7,2,0,10,-7,2,-10,-3,-8,-7,-4,-9]
      poly(c,outline,shape);poly(c,mid,[0,-3,4,-8,8,-6,9,-3,6,1,0,8,-6,1,-9,-3,-7,-6,-4,-8]);poly(c,tone,[-7,-4,-4,-7,-1,-4,4,-6,6,-4,5,0,0,6,-5,1]);line(c,light,-6,-4,-4,-6,2);box(c,white,-6,-4,2,1);break
    }
    case 'roots':{
      line(c,outline,0,8,-1,-7,3);line(c,tone,0,7,-1,-7,2);line(c,light,0,0,4,-7,2);
      for(const k of [-1,1]){line(c,mid,k*8,7,k*2,3,2);line(c,tone,k*2,2,k*7,-3,2);line(c,light,k*5,-3,k*8,-6);line(c,tone,k*7,6,k*8,3);box(c,light,k*8,-4,2,2)}break
    }
    case 'target':{
      oval(c,deep,0,0,9,8);oval(c,tone,0,0,8,7);oval(c,'#251d2d',0,0,6,5);oval(c,mid,0,0,4,4);oval(c,light,0,0,2,2)
      for(const k of [-1,1]){line(c,tone,0,k*7,0,k*10,2);line(c,light,k*7,0,k*10,0,2)}box(c,white,0,0,1,1);break
    }
    case 'ghost':{
      poly(c,deep,[-9,-1,-8,-7,-2,-10,4,-9,8,-4,7,2,10,7,6,9,2,6,-1,10,-4,7,-8,8]);poly(c,tone,[-7,-1,-6,-6,-2,-8,4,-7,6,-3,5,2,8,7,3,6,0,8,-4,5,-7,6]);
      line(c,light,-6,-3,-2,-8,2);box(c,outline,-4,-3,2,3);box(c,outline,2,-3,2,3);box(c,light,5,1,2,1);break
    }
    case 'wind':case 'waves':{
      for(let i=0;i<3;i++){const y=-6+i*5,x=(i%2)*3;line(c,deep,-10+x,y+1,6,y-1,3);line(c,tone,-9+x,y,4,y-1,2);line(c,light,2,y-1,9-i,y-4,1);box(c,white,6-i,y-3,1,1)}break
    }
    case 'hammer':{
      line(c,outline,-8,8,3,-5,4);line(c,'#ac724b',-7,8,3,-5,2);poly(c,outline,[-3,-9,4,-11,10,-5,8,0,1,2,-6,-4]);poly(c,steel,[-2,-8,4,-10,9,-5,7,-1,1,1,-4,-4]);line(c,steelHi,-2,-8,4,-9,2);box(c,brass,2,-6,4,2);if(charged)spark(c,7,-8,3,light);break
    }
    case 'gem':crystal(c,0,0,8,tone);spark(c,7,-6,2,light);box(c,light,-8,5,1,2);break
    case 'bottle':bottle(c,tone);break
    case 'stone':{
      poly(c,outline,[-10,4,-7,-4,-1,-9,5,-5,8,-3,10,4,5,8,-6,8]);poly(c,deep,[-8,4,-5,-3,-1,-7,4,-5,7,-2,8,3,4,7,-5,6]);
      poly(c,tone,[-7,3,-5,-2,-1,-6,5,-3,2,2,-2,4]);poly(c,mid,[2,2,6,-2,8,3,4,7,0,5]);line(c,light,-6,0,-1,-5,2);box(c,light,2,3,2,1);break
    }
    case 'bell':{
      oval(c,outline,0,8,3,2);oval(c,gold,0,8,2,1);poly(c,outline,[-3,-10,3,-10,5,-6,6,2,9,6,6,8,-6,8,-9,6,-6,2,-5,-6]);
      poly(c,brass,[-2,-8,2,-8,4,-5,5,2,7,6,-7,6,-5,2,-4,-5]);poly(c,gold,[-3,-5,0,-7,1,3,-4,5,-5,4]);box(c,white,-2,-9,4,1);line(c,gold,-7,5,7,5,2);break
    }
    case 'leaf':{
      line(c,'#72654a',-7,9,7,-9,2)
      for(const [x,y,s] of [[-1,-5,1],[3,1,-1],[-5,1,1]]){poly(c,deep,[x,y,x-2*s,y-4,x-7*s,y-8,x-7*s,y-2]);poly(c,tone,[x,y-1,x-2*s,y-4,x-6*s,y-7,x-6*s,y-3]);line(c,light,x,y-1,x-5*s,y-5)}
      poly(c,tone,[5,-5,5,-9,9,-11,9,-7]);line(c,light,5,-6,8,-9);break
    }
    case 'scroll':{
      poly(c,outline,[-9,-8,6,-10,9,-7,8,-3,5,-3,7,5,9,7,6,10,-8,9,-10,6,-9,3,-6,3,-8,-3]);poly(c,'#cbae7d',[-7,-7,5,-9,8,-7,5,-4,4,-3,6,6,8,7,6,8,-7,8,-8,6,-5,4,-6,-3]);
      box(c,'#f2d9a6',-7,-6,12,2);line(c,'#926851',-4,-2,3,-3);line(c,'#926851',-3,0,2,-1);line(c,gold,-8,6,5,6);oval(c,'#a04b4b',3,3,2,2);box(c,'#da7865',2,2,2,1);break
    }
    case 'helmet':{
      poly(c,outline,[-8,8,-9,-4,-5,-9,2,-10,8,-7,10,-2,9,7,4,10,-2,9]);poly(c,mid,[-6,7,-7,-4,-4,-8,2,-9,7,-6,8,-2,7,6,3,8,-2,7]);line(c,light,-6,-3,-2,-7,2);
      box(c,'#2a2230',-5,-2,12,4);box(c,gold,-4,-3,10,1);box(c,tone,0,-7,2,11);box(c,light,1,-6,1,7);box(c,brass,-3,4,7,2);break
    }
    case 'mail':{
      poly(c,outline,[-9,-8,-3,-10,0,-7,3,-10,9,-8,11,-1,6,0,7,8,1,10,-7,8,-6,0,-11,-2]);poly(c,mid,[-8,-6,-3,-8,0,-5,4,-8,8,-6,9,-2,4,-1,5,7,0,8,-5,7,-4,-1,-9,-3]);
      line(c,light,-8,-5,-4,-7,2);line(c,light,4,-7,8,-5,2);line(c,brass,-5,6,4,6,2);for(let i=0;i<3;i++){line(c,tone,-3,-2+i*2,3,-3+i*2);box(c,light,-2,-2+i*2,2,1)}break
    }
    case 'hand':{
      poly(c,outline,[-5,10,-7,4,-9,-1,-7,-5,-4,-3,-4,-8,-2,-10,1,-9,5,-9,7,-5,7,4,3,10]);poly(c,mid,[-4,8,-5,3,-7,-1,-6,-3,-3,0,-3,-7,-1,-8,0,-4,1,-8,5,-7,5,-3,6,-3,6,3,2,8]);
      line(c,tone,-3,3,4,2,2);line(c,light,-3,5,3,5);box(c,brass,-4,7,7,2);box(c,light,2,-7,2,2);break
    }
    case 'boots':{
      for(const shift of [4,-4]){c.save();c.translate(shift,shift<0?2:-3);poly(c,outline,[-4,-7,3,-7,4,2,7,4,6,7,-5,7,-5,2]);poly(c,mid,[-3,-6,2,-6,2,2,5,4,5,6,-4,6,-4,2]);box(c,brass,-4,-6,7,2);box(c,tone,-3,0,5,2);box(c,light,0,3,3,1);line(c,gold,-3,5,4,5);c.restore()}break
    }
    case 'ring':{
      oval(c,outline,0,2,8,7);oval(c,brass,0,2,7,6);oval(c,'#282132',0,2,5,4);line(c,gold,-5,4,0,7,2);line(c,gold,5,1,5,4);crystal(c,0,-5,4,tone);break
    }
    case 'chest':case 'bag':{
      const bag=id==='bag'
      poly(c,outline,bag?[-7,8,-9,2,-8,-6,-4,-8,-3,-10,3,-10,4,-8,8,-6,9,4,7,8]:[-10,-5,-6,-8,7,-8,10,-4,10,8,-10,8]);
      poly(c,mid,[-8,-4,-5,-7,6,-7,8,-4,8,6,-8,6]);poly(c,tone,[-7,-5,-4,-6,5,-6,7,-4,7,0,-7,0]);box(c,brass,-8,1,16,2);box(c,brass,-3,1,6,5);box(c,gold,-2,2,4,3);box(c,outline,0,2,1,2);line(c,light,-6,-4,5,-5);break
    }
  }
  cache.set(key,a);return a
}
