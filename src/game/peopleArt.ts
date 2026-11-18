import { CLASS_ART } from '../data/art'
import { DYES, SKINS } from '../data/classes'
import { SPRITE_FRAMES, atlasCell, box, canvas, line, oval, poly, shade, type Ink } from './pixelInk'
import type { ClassId, Facing } from './types'

export const DIRECTIONS:Facing[]=['south','west','east','north']
export const HUMAN_W=60,HUMAN_H=54,PORTRAIT_W=56,PORTRAIT_H=51
const edge='#171522',brass='#b48652',shine='#f3d49b',leather='#4a3034'
const hairByPerson:Record<string,string>={tarek:'#89736b',lyra:'#c29a64',seris:'#c2b7cd',veyra:'#333044',iona:'#9f8b76'}

function jewel(c:Ink,x:number,y:number,color:string){
  poly(c,edge,[x,y-4,x+4,y,x,y+4,x-4,y]);poly(c,color,[x,y-3,x+3,y,x,y+3,x-3,y]);box(c,shade(color,57),x,y-2,1,2)
}
function blade(c:Ink,x:number,y:number,tx:number,ty:number,width:number,trim:string){
  line(c,edge,x-2,y-1,tx,ty,width+2)
  line(c,'#69758f',x,y,tx,ty,width)
  line(c,'#cbd3df',x+1,y-1,tx+1,ty,1)
  if(width>3)line(c,'#9ca8bd',x+3,y,tx+2,ty+1)
  line(c,'#43313a',x-4,y+2,x+5,y+1,3);line(c,trim,x-3,y+1,x+6,y);box(c,shine,x,y,2,2)
  box(c,edge,x-2,y+2,4,4);box(c,'#8b674e',x-1,y+2,2,3)
}
function shield(c:Ink,x:number,y:number,panel:string){
  poly(c,edge,[x-8,y,x,y-5,x+8,y,x+7,y+10,x,y+16,x-7,y+11]);poly(c,brass,[x-6,y,x,y-3,x+6,y,x+5,y+9,x,y+14,x-5,y+10]);
  poly(c,panel,[x-4,y+1,x,y-1,x+4,y+1,x+3,y+8,x,y+11,x-3,y+9]);line(c,shine,x-5,y,x,y-3);box(c,'#cfb98b',x-1,y+3,2,4);box(c,'#cfb98b',x-2,y+4,4,2)
}

/** Sprite cells are always planted at the actor's feet, independent of walk phase and facing. */
export function human(c:Ink,cls:ClassId,dye:number,skin:number,style:number,facing:Facing,frame:number,person?:string) {
  const knight=cls==='knight',heavy=knight||cls==='warrior',monk=cls==='priest',caster=cls==='warlock'||monk,ranger=cls==='ranger',rogue=cls==='assassin'
  const hood=cls==='warlock'||ranger,back=facing==='north',side=facing==='east'||facing==='west'
  const slash=frame===5,cast=frame===6,hurt=frame===7,dash=frame===8,walking=frame>0&&frame<5
  const stride=walking?[-2,-4,2,4][frame-1]:slash?4:dash?6:0,bob=walking&&frame%2===0?-1:hurt||dash?2:0
  const dyeColor=DYES[dye]??DYES[0],medium=shade(dyeColor,6),deep=shade(dyeColor,-61),light=shade(dyeColor,39)
  const hair=person&&hairByPerson[person]||CLASS_ART[cls].hair,face=SKINS[skin]??SKINS[0],faceShade=shade(face,-40),hairShade=shade(hair,-41)
  const steel=knight?'#4c516a':'#8799b4',steelLight=knight?'#8b96b3':'#d7e3e9',steelShade=knight?'#303447':'#4c566d',accent=CLASS_ART[cls].accent
  const lean=slash||dash?2:hurt?-2:0,hx=(side?3:0)+lean,sw=(walking?stride*.66:0)+(dash?-6:slash?3:0)
  c.save();if(facing==='west')c.scale(-1,1)

  // Rear cloth is visible in every facing; the split and folds move with the boots.
  if(!rogue||person==='veyra'){
    const tail=(side?-4:0)+sw
    poly(c,edge,[-8,-28+bob,7,-28+bob,12,-20+bob,13+tail,-6,17+tail,1,6+tail,0,0+tail,-2,-8+tail,1,-16+tail,-2,-13,-16+bob]);
    poly(c,deep,[-7,-27+bob,7,-27+bob,11,-18+bob,12+tail,-4,15+tail,-1,6+tail,-1,-1+tail,-4,-8+tail,-1,-14+tail,-2,-11,-14+bob]);
    poly(c,medium,[-7,-26+bob,2,-27+bob,5+tail,-5,-1+tail,-6,-10+tail,-3,-10,-14+bob]);
    line(c,light,-8,-23+bob,-10+tail,-5,1);line(c,shade(dyeColor,-25),4,-22+bob,9+tail,-4,2)
    if(back){line(c,shade(dyeColor,-31),-1,-21+bob,0+tail,-8,2);jewel(c,-1,-22+bob,brass)}
  }else if(dash||walking){poly(c,deep,[-7,-21,-13+sw,-14,-20+sw,-13,-14+sw,-19,-5,-25]);line(c,medium,-9,-23,-19+sw,-14)}

  for(const k of [-1,1]){
    const xx=k*(side?3:5)+ (side?k*stride*.87:k*stride*.35)+(dash?2:0),yy=side?Math.abs(stride)*-.13:k*stride*.40
    const vx=xx+(side?3:0),top=-13+bob
    poly(c,edge,[xx-4,top,xx+4,top,xx+3,yy-6,vx+4,yy-4,vx+5,yy,vx-5,yy+1,xx-4,yy-4]);
    poly(c,heavy?steelShade:leather,[xx-3,top+1,xx+3,top+1,xx+2,yy-5,vx+4,yy-3,vx+4,yy-1,vx-3,yy,xx-3,yy-4]);
    box(c,heavy?steel:'#89593e',xx-2,yy-8,4,3);box(c,heavy?steelLight:'#c99962',xx-2,yy-8,2,1);box(c,'#72594b',vx-3,yy-2,6,1)
  }

  // Body and class-specific tailoring: fitted cuirass, wrap, vestments or hunting leathers.
  c.save();c.translate(lean,bob)
  poly(c,edge,[-10,-26,-5,-29,6,-29,11,-25,10,-17,8,-13,9,-9,2,-7,-1,-10,-6,-8,-10,-11,-8,-16]);
  poly(c,heavy?steelShade:deep,[-8,-26,-5,-28,5,-28,9,-24,8,-17,6,-13,7,-10,2,-9,-2,-11,-6,-10,-8,-12,-7,-16]);
  if(heavy){
    poly(c,steel,[-7,-25,-3,-27,4,-27,8,-24,6,-19,2,-18,-5,-19,-7,-21]);
    poly(c,steelLight,[-6,-25,-3,-26,4,-26,6,-24,-2,-24,-5,-22]);
    line(c,brass,-6,-19,-1,-17);line(c,brass,-1,-17,6,-20);box(c,steel,-5,-16,10,2);box(c,steelLight,-3,-15,5,1)
    if(!knight){poly(c,medium,[-4,-25,1,-24,4,-11,1,-8,-4,-11]);line(c,light,-4,-23,-2,-12);jewel(c,0,-22,brass)}
    else if(!back)jewel(c,1,-22,'#b65062')
  }else if(monk){
    poly(c,'#dcccaa',[-8,-25,-5,-27,4,-27,7,-23,5,-18,5,-11,1,-10,-1,-18,-5,-18,-7,-22]);
    line(c,shine,-5,-26,-2,-18);line(c,light,5,-23,4,-12,2);box(c,'#ad8153',0,-22,2,6);box(c,'#eddb96',-1,-21,4,1)
  }else{
    const vest=ranger?'#685342':rogue?'#443851':'#453759'
    poly(c,vest,[-7,-24,-4,-27,4,-27,8,-23,6,-16,4,-11,-5,-12,-6,-17]);
    if(rogue){line(c,light,-5,-25,1,-18,2);line(c,medium,1,-18,6,-16,2);box(c,'#c18a6c',-6,-20,3,1)}
    else if(ranger){poly(c,medium,[-9,-25,-5,-29,1,-26,4,-22,-1,-18,-8,-20]);line(c,light,-7,-24,-2,-20);line(c,'#b08658',4,-24,-4,-15,2);box(c,shine,1,-21,2,2)}
    else{line(c,light,-4,-25,2,-17,2);line(c,'#b58d74',7,-24,5,-17);jewel(c,-1,-23,accent)}
  }
  line(c,'#312331',-8,-14,7,-13,2);line(c,'#815a43',-7,-14,6,-13);box(c,brass,0,-14,4,3);box(c,shine,1,-14,2,1);box(c,'#6a4f4d',1,-13,2,1)

  for(const k of [-1,1]){
    if(side&&k<0)continue
    const x=k*(heavy?10:9)+(k===1&&slash?4:0),y=-23+(k===1&&cast?-4:0)+(k===1?stride:-stride)*.60
    poly(c,edge,[x-4,y-5,x+3,y-5,x+5,y-1,x+5,y+4,x+3,y+10,x-2,y+10,x-4,y+5]);
    poly(c,heavy?steel:medium,[x-3,y-3,x+2,y-4,x+4,y-1,x+3,y+4,x-2,y+5,x-3,y+2]);
    line(c,heavy?steelLight:light,x-2,y-3,x+3,y-2);box(c,heavy?steelShade:leather,x-2,y+3,5,4);box(c,heavy?brass:light,x-2,y+5,4,1);box(c,faceShade,x-1,y+7,3,2)
    if(heavy){line(c,brass,x-3,y,x+3,y+1);box(c,shine,x-2,y,1,1)}
  }
  c.restore()

  // Head shape and plated/cloth details are drawn by direction, not a flipped front view.
  c.save();c.translate(hx,bob)
  if(hood){
    poly(c,edge,[-12,-32,-11,-43,-6,-48,2,-50,9,-46,12,-40,11,-29,6,-26,-7,-27]);
    poly(c,deep,[-10,-31,-10,-42,-6,-47,2,-48,8,-45,11,-40,10,-31,6,-28,-7,-29]);
    line(c,light,-10,-41,-5,-47,2);line(c,medium,-5,-47,3,-48,2)
  }
  const long=style===1||person==='veyra'||person==='seris'
  if(long){poly(c,edge,[-8,-41,7,-43,10,-36,10+sw,-24,5+sw,-23,1,-28,-2,-24,-9+sw,-25,-10,-31]);poly(c,hairShade,[-8,-39,7,-41,9,-35,8+sw,-25,5+sw,-26,0,-31,-5,-26,-8+sw,-26,-9,-33]);line(c,hair,-7,-39,-7+sw,-28,2)}
  poly(c,edge,[-10,-32,-11,-41,-7,-47,-2,-49,5,-48,9,-44,11,-40,10,-32,7,-28,-6,-28]);
  poly(c,hairShade,[-9,-33,-10,-40,-6,-46,-2,-48,5,-47,8,-44,10,-40,9,-33,5,-29,-6,-29]);
  if(!back){
    const profile=side?[ -7,-39,5,-42,10,-38,10,-35,12,-34,10,-32,8,-29,2,-28,-4,-31,-7,-35 ]:[-8,-38,-5,-42,6,-42,9,-37,8,-32,5,-29,-1,-28,-6,-30,-8,-34]
    poly(c,faceShade,profile)
    poly(c,face,side?[-6,-38,5,-41,9,-37,9,-34,10,-34,8,-32,7,-29,2,-29,-1,-31,-4,-35]:[-7,-38,-3,-41,6,-41,8,-37,7,-32,4,-30,-1,-29,-5,-31,-7,-35]);
    if(side){box(c,'#372a33',5,-37,4,1);box(c,faceShade,5,-36,4,2);box(c,knight?'#805d56':'#2a263a',6,-36,2,2);box(c,'#fff0cc',6,-36,1,1);box(c,shade(face,25),8,-34,2,1);box(c,shade(face,-32),7,-31,2,1);box(c,faceShade,-5,-34,2,3)}
    else{
      for(const x of [-5,3]){box(c,'#473139',x,-37,4,1);box(c,'#f5dfc4',x,-36,4,2);box(c,knight?'#825b54':ranger?'#3e5c48':'#3b344a',x+1,-36,2,2);box(c,'#fff0cf',x+1,-36,1,1)}
      box(c,shade(face,24),0,-34,2,1);box(c,shade(face,-36),0,-31,3,1);box(c,shade(face,-24),-6,-33,2,1)
    }
    if(person==='tarek'){line(c,'#6f5150',-6,-32,-1,-29,2);line(c,'#745755',2,-29,7,-32,2);line(c,'#a76361',side?8:5,-35,side?9:6,-32)}
  }

  // Separate clusters for fringe, crown and rim light keep the hair readable when scaled 2x.
  if(!hood||!back){
    const fringe=side?[-10,-37,-9,-44,-5,-47,0,-47,4,-49,5,-47,9,-46,11,-41,7,-42,4,-38,2,-41,-2,-36,-4,-40,-8,-34]:[-9,-33,-10,-42,-7,-46,-2,-47,2,-49,4,-46,8,-46,11,-42,9,-38,6,-41,4,-37,1,-40,-1,-37,-4,-40,-6,-36,-8,-35]
    poly(c,hair,back?[-9,-41,-6,-46,-2,-47,5,-46,9,-41,8,-32,3,-30,-1,-32,-5,-30,-8,-33]:fringe)
    poly(c,shade(hair,24),[-8,-43,-5,-46,0,-46,3,-47,7,-44,4,-44,-1,-42,-4,-41]);
    line(c,shade(hair,48),-6,-45,-2,-46);line(c,shade(hair,24),1,-43,6,-44);line(c,hairShade,-8,-39,-8,-35,2)
    if(back){line(c,hairShade,2,-43,-1,-33,2);line(c,shade(hair,22),-5,-42,-6,-36,2);line(c,shade(hair,15),6,-43,4,-36,2)}
  }else{poly(c,medium,[-9,-42,-5,-47,2,-47,8,-44,10,-39,8,-31,2,-27,-6,-28,-9,-34]);line(c,light,-7,-41,-4,-45,2);line(c,deep,0,-44,2,-31,2)}
  if(knight||person==='veyra'||rogue){
    poly(c,'#332234',[-9,-32,-6,-30,5,-30,9,-33,10,-28,6,-25,-2,-27,-7+sw,-19,-14+sw,-21,-10,-26]);
    poly(c,person==='veyra'?'#8e4055':medium,[-8,-31,-5,-29,5,-29,9,-31,8,-27,5,-26,-2,-27,-7+sw,-21,-12+sw,-22,-8,-27]);
    line(c,person==='veyra'?'#c16e7a':light,-6,-29,5,-28,1);line(c,medium,-4,-27,-10+sw,-22);if(!back)box(c,shine,7,-30,1,2)
  }
  if(monk&&!back){line(c,'#8d694a',-7,-40,8,-40,2);line(c,'#ebd2a0',-7,-40,8,-40);box(c,'#ffecbe',side?6:0,-41,2,3)}
  if(person==='iona'&&!back){line(c,brass,-7,-36,10,-36);box(c,'#6e5243',-5,-36,1,2);box(c,'#6e5243',6,-36,1,2)}
  if(person==='seris'&&!back){line(c,'#ddd0db',-8,-43,-7,-31,2);box(c,'#ebbad8',-7,-33,2,2)}
  c.restore()

  // One equipment silhouette per class, in the hand and at the angle of the active pose.
  const handX=(side?14:11)+(slash?4:0), handY=-14+bob+(cast?-6:0)
  if(person==='iona'){
    poly(c,edge,[-15,-20,-5,-21,-3,-12,-5,-9,-14,-8]);poly(c,'#9d6b49',[-14,-19,-6,-20,-4,-12,-6,-10,-13,-9]);line(c,'#e7c38d',-13,-17,-6,-18);box(c,'#7f4d4c',-9,-15,2,4)
  }else if(caster){
    const tx=cast?handX+7:handX+4,ty=cast?-45:-39+bob
    line(c,edge,handX-1,1,tx-1,ty+1,4);line(c,'#986a4c',handX,1,tx,ty+2,2);line(c,'#d6b180',handX+1,1,tx+1,ty+2);box(c,'#ba8853',handX-1,handY,5,2)
    if(monk){oval(c,edge,tx+1,ty,5,5);oval(c,'#c08d59',tx+1,ty,4,4);oval(c,'#684755',tx+1,ty,2,2);box(c,'#fff0b0',tx,ty-3,2,7);box(c,'#e8ba74',tx-2,ty,6,1)}
    else{jewel(c,tx+1,ty,cast?'#f6a8f9':'#c295f6');box(c,'#efe5ff',tx+3,ty+3,1,2)}
  }else if(ranger){
    const bx=handX,by=handY+(slash?-5:0)
    if(!side){line(c,edge,-8,-18,-13,-37,4);line(c,'#9f7a54',-7,-18,-12,-37,2);box(c,'#d0c597',-13,-37,3,2)}
    poly(c,edge,[bx-2,by-16,bx+4,by-14,bx+9,by-8,bx+9,by+1,bx+5,by+10,bx-1,by+12,bx+3,by+5,bx+5,by-3,bx+1,by-11]);
    line(c,'#e8daaf',bx-1,by-14,bx,by+10);line(c,'#b38048',bx,by-14,bx+6,by-7,2);line(c,'#d1a466',bx+6,by-7,bx+7,by,2);line(c,'#aa7448',bx+7,by,bx+2,by+9,2);box(c,'#ecc791',bx+5,by-3,3,2)
    if(cast){line(c,'#f8e5ae',bx-5,by-2,bx+9,by-3);box(c,'#d3eabb',bx+8,by-4,2,2)}
  }else{
    const tx=slash?24:dash?22:heavy?19:16,ty=slash?-25:dash?-11:heavy?-1:-5
    blade(c,handX,handY,tx,ty,knight?4:2,brass)
    if(rogue&&!side){blade(c,-10,handY+2,slash?-22:-15,slash?-16:-5,2,'#986c9d')}
    if(cls==='warrior'&&!back){shield(c,side?-6:-12,handY-7,medium)}
  }
  c.restore()
}

export function humanAtlas(cls:ClassId,dye:number,skin:number,style:number,person?:string){
  const {a,c}=canvas(HUMAN_W*SPRITE_FRAMES,HUMAN_H*DIRECTIONS.length)
  for(let row=0;row<DIRECTIONS.length;row++)for(let f=0;f<SPRITE_FRAMES;f++){
    atlasCell(c,HUMAN_W,HUMAN_H,f,row,()=>human(c,cls,dye,skin,style,DIRECTIONS[row],f,person))
  }
  return a
}
export function portrait(c:Ink,cls:ClassId,dye:number,skin:number,style:number,person?:string){
  c.save();c.translate(PORTRAIT_W/2,102);c.scale(2,2);human(c,cls,dye,skin,style,'south',0,person);c.restore()
}
