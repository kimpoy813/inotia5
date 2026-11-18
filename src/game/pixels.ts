import { DYES, SKINS } from '../data/classes'
import { ENEMIES, type EnemyId } from '../data/enemies'
import { random, TILE, type Decor, type Ground, type MapDef } from '../data/maps'
import type { ClassId, Facing } from './types'

type Ink=CanvasRenderingContext2D
const box=(c:Ink,color:string,x:number,y:number,w:number,h:number)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function poly(c:Ink,color:string,pts:number[]) {
  c.fillStyle=color;let y0=99999,y1=-99999
  for(let i=1;i<pts.length;i+=2){y0=Math.min(y0,pts[i]);y1=Math.max(y1,pts[i])}
  for(let y=Math.ceil(y0);y<y1;y++){
    const ends:number[]=[]
    for(let i=0,j=pts.length-2;i<pts.length;j=i,i+=2){const ya=pts[i+1],yb=pts[j+1];if((ya<=y+.5&&yb>y+.5)||(yb<=y+.5&&ya>y+.5))ends.push(pts[i]+(y+.5-ya)*(pts[j]-pts[i])/(yb-ya))}
    ends.sort((a,b)=>a-b);for(let i=0;i<ends.length-1;i+=2){const left=Math.round(ends[i]),right=Math.round(ends[i+1]);if(right>left)c.fillRect(left,y,right-left,1)}
  }
}
function line(c:Ink,color:string,x:number,y:number,tx:number,ty:number,width=1) {
  const n=Math.max(Math.abs(x-tx),Math.abs(y-ty),1)
  for(let i=0;i<=n;i++)box(c,color,x+(tx-x)*i/n,y+(ty-y)*i/n,width,width)
}
function oval(c:Ink,color:string,x:number,y:number,rx:number,ry:number) {
  for(let j=-Math.floor(ry);j<=ry;j++){const w=Math.floor(rx*Math.sqrt(Math.max(0,1-j*j/(ry*ry))));box(c,color,x-w,y+j,w*2+1,1)}
}
function shade(hex:string,n:number) {
  const h=parseInt(hex.slice(1),16),v=[h>>16&255,h>>8&255,h&255].map(v=>Math.max(0,Math.min(255,v+n)).toString(16).padStart(2,'0'))
  return '#'+v.join('')
}
const canvas = (w:number,h:number)=>{const a=document.createElement('canvas');a.width=w;a.height=h;const c=a.getContext('2d')!;c.imageSmoothingEnabled=false;return {a,c}}
function rubble(c:Ink,x:number,y:number,r:()=>number,color:string) {
  const w=4+Math.floor(r()*8);poly(c,'#232e31',[x-1,y+3,x+2,y-3,x+w-3,y-4,x+w,y,x+w-1,y+4]);poly(c,color,[x,y+2,x+2,y-3,x+w-3,y-3,x+w-1,y,x+w-4,y+2]);line(c,shade(color,24),x+1,y,x+3,y-2);box(c,shade(color,-17),x+w-3,y+1,2,2)
}
const PALETTES: Record<MapDef['id'],{grass:string; moss:string; path:string; stone:string; night:string; wood:string}>={
  village:{grass:'#3a563f',moss:'#344d3c',path:'#716651',stone:'#5d6260',night:'#111d26',wood:'#766248'},
  road:{grass:'#42563b',moss:'#394336',path:'#79654c',stone:'#66645c',night:'#151d22',wood:'#7e644c'},
  forest:{grass:'#314749',moss:'#2b3d3d',path:'#5b5a50',stone:'#535864',night:'#141928',wood:'#565b58'},
  spire:{grass:'#444659',moss:'#39364a',path:'#4b4b5c',stone:'#565665',night:'#121321',wood:'#605766'},
  pass:{grass:'#496064',moss:'#405659',path:'#687a7c',stone:'#65767a',night:'#182638',wood:'#70746a'},
}
export function groundTexture(m:MapDef,tx:number,ty:number,cw:number,ch:number) {
  const {a,c}=canvas(cw*TILE,ch*TILE),p=PALETTES[m.id]
  const get=(x:number,y:number):Ground|undefined=>x<0||y<0||x>=m.w||y>=m.h?undefined:m.tiles[y*m.w+x]
  for(let y=ty;y<ty+ch;y++)for(let x=tx;x<tx+cw;x++){
    const xx=(x-tx)*16,yy=(y-ty)*16,g=get(x,y)!,r=random((m.seed+x*983+y*1379)*17131),n=Math.floor(r()*9)-4
    const patch=(Math.sin(x*.36+y*.72)+Math.cos(x*.91-y*.34))*4
    const col=g==='grass'?p.grass:g==='moss'?p.moss:g==='path'?p.path:g==='stone'?p.stone:g==='slate'?'#363847':g==='water'?'#244956':g==='wall'?p.night:g==='snow'?'#8da2a8':g==='abyss'?'#171f2e':p.wood
    const base=shade(col,Math.round(patch)+n);box(c,base,xx,yy,16,16)
    if(g==='grass'||g==='moss'||g==='snow'||g==='path'){
      for(let i=0;i<21;i++){const dx=Math.floor(r()*16),dy=Math.floor(r()*16),t=r();box(c,shade(base,t<.25?10:t<.7?-7:4),xx+dx,yy+dy,t<.08&&dx<15?2:1,1)}
      if(g!=='path'&&r()<.60){const bx=xx+2+Math.floor(r()*11),by=yy+5+Math.floor(r()*8),hi=shade(base,g==='snow'?31:22)
        line(c,shade(base,-15),bx-2,by+1,bx+4,by+1);line(c,hi,bx,by,bx-1,by-2);line(c,shade(base,10),bx+2,by,bx+3,by-4);box(c,hi,bx+3,by-4,1,1)
        if(g!=='snow'&&r()<.14){box(c,r()<.6?'#c1ac78':'#a28fa0',bx-1,by-3,2,1);box(c,'#e0cc9d',bx,by-4,1,1)}
      }
      if(g==='path'&&r()<.32) {const bx=xx+2+r()*5,by=yy+4+r()*8;box(c,shade(base,-14),bx,by,4,2);box(c,shade(base,12),bx+1,by,3,1)}
      if(g==='path')for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]])if(get(x+dx,y+dy)!=='path'&&get(x+dx,y+dy)!=='stone')for(let i=0;i<8;i++){
        const w=1+Math.floor(r()*3),u=Math.min(15-w,Math.floor(r()*16)),v=dy<0?0:dy>0?15-w:u
        box(c,shade(p.grass,i%2?4:-3),xx+(dx<0?0:dx>0?15-w:u),yy+v,dx?w:2,dy?w:2)
      }
    }
    if(g==='stone'||g==='slate'){
      const rows=g==='stone'?3:2, h=g==='stone'?5:8
      for(let j=0;j<rows;j++){
        const split=g==='stone'?4+Math.floor(r()*7):5+((y+j)%2)*6
        for(const [l,w] of [[0,split],[split+1,15-split]]){
          const top=yy+j*h,b=xx+l,k=shade(base, Math.floor(r()*14)-7)
          box(c,shade(base,-14),b,top,w,h);poly(c,k,[b+1,top+1,b+w-1,top+1,b+w,top+2,b+w-1,top+h-1,b+1,top+h-1]);box(c,shade(k,15),b+2,top+1,Math.max(1,w-4),1)
          if(r()<.38)box(c,shade(k,-13),b+Math.floor(w/2),top+Math.floor(h/2),2,1)
        }
      }
      if(g==='slate'&&r()<.2){line(c,shade(base,-16),xx+7,yy+8,xx+11,yy+12);box(c,shade(base,12),xx+10,yy+12,4,1)}
    }
    if(g==='water'){
      for(let i=0;i<5;i++){const rx=Math.floor(r()*10),ry=Math.floor(r()*16);box(c,shade(base,i%2?9:-10),xx+rx,yy+ry,2+Math.floor(r()*4),1)}
      for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]])if(!['water','bridge',undefined].includes(get(x+dx,y+dy))){
        const ex=dx<0?xx:xx+14,ey=dy<0?yy:yy+14
        if(dx) {box(c,'#182e36',ex,yy,2,16);box(c,'#638680',ex+(dx<0?2:-1),yy+(y%2?2:8),1,5)}
        else {box(c,'#182e36',xx,ey,16,2);box(c,'#658477',xx+4,ey+(dy<0?2:-1),8,1)}
      }
      if(r()<.04){oval(c,'#456347',xx+8,yy+8,5,3);line(c,'#718359',xx+4,yy+7,xx+9,yy+6);box(c,'#ac8896',xx+8,yy+6,2,2)}
    }
    if(g==='bridge'){
      for(let j=0;j<16;j+=4){const plank=shade(base,Math.floor(r()*18)-11);box(c,plank,xx,yy+j,16,3);box(c,shade(plank,17),xx+1,yy+j,14,1);box(c,shade(plank,-30),xx,yy+j+3,16,1);box(c,'#4a4038',xx+4,yy+j+1,1,1);box(c,'#b39767',xx+12,yy+j+2,3,1)}
      if(get(x,y-1)==='water'||get(x,y+1)==='water'){const offset=get(x,y-1)==='water'?0:13;box(c,'#4a3d2d',xx,yy+offset,16,3);box(c,'#9d8055',xx,yy+offset,16,1);box(c,'#c5a67b',xx+2,yy+offset,2,3)}
    }
    if(g==='wall'||g==='abyss'){
      const below=get(x,y+1), above=get(x,y-1),left=get(x-1,y),right=get(x+1,y),floor=(v:Ground|undefined)=>v==='stone'||v==='slate'||m.id==='pass'&&v!==g
      if(g==='wall'&&floor(below)){
        box(c,'#22222f',xx,yy+4,16,12);box(c,'#48475b',xx,yy+1,16,3);box(c,'#59586c',xx,yy+1,12,1);box(c,'#2f3040',xx,yy+6,16,2)
        box(c,'#161927',xx+4+(x%2)*8,yy+6,1,6);box(c,'#37384b',xx+2,yy+11,9,1);box(c,'#090f1d',xx,yy+15,16,1)
      } else if(floor(above)||floor(left)||floor(right)){
        if(floor(above))box(c,g==='wall'?'#494859':'#687481',xx,yy,16,2)
        if(floor(left))box(c,g==='wall'?'#414153':'#6c7a86',xx,yy,3,16)
        if(floor(right))box(c,g==='wall'?'#393947':'#5c6b7b',xx+13,yy,3,16)
      } else if(r()<.39)box(c,shade(base,4),xx+3,yy+4,7,2)
    }
  }
  c.save();c.translate(-tx*TILE,-ty*TILE)
  if(m.id==='village'){
    const px=21.5*TILE,py=20.5*TILE
    if(px+48>tx*16&&px-48<(tx+cw)*16&&py+32>ty*16&&py-32<(ty+ch)*16){
      oval(c,'#454e4c',px,py,45,27);oval(c,'#928267',px,py-2,42,23);oval(c,'#5d625b',px,py-2,39,20);oval(c,'#766f57',px,py-2,31,17);oval(c,'#4b5a54',px,py-2,29,15)
      poly(c,'#a7926b',[px,py-24,px+6,py-7,px+30,py-2,px+7,py+3,px,py+19,px-7,py+3,px-29,py-2,px-7,py-7]);poly(c,'#c2ab7c',[px,py-13,px+5,py-2,px,py+8,px-5,py-2])
      for(let i=0;i<12;i++){const a=i*Math.PI/6;box(c,'#b09a73',px+35*Math.cos(a),py-2+19*Math.sin(a),2,1)}
    }
  }
  if(m.id==='spire'){
    const px=47.5*TILE,py=21.5*TILE
    if(px+72>tx*16&&px-72<(tx+cw)*16&&py+62>ty*16&&py-62<(ty+ch)*16){
      oval(c,'#353a4a',px,py,69,56);oval(c,'#77677b',px,py,64,51);oval(c,'#3a4051',px,py,62,49);oval(c,'#72677c',px,py,49,39);oval(c,'#444959',px,py,47,37)
      poly(c,'#6e767a',[px,py-42,px+40,py,px,py+42,px-40,py]);poly(c,'#3d4c57',[px,py-38,px+36,py,px,py+38,px-36,py]);poly(c,'#8a9d9b',[px,py-13,px+9,py,px,py+13,px-9,py])
      for(let i=0;i<16;i++){const a=i*Math.PI/8;box(c,i%4?'#8d7b8f':'#aaa0a4',px+56*Math.cos(a),py+44*Math.sin(a),3,2)}
    }
  }
  c.restore();return a
}

export const PROP_SIZE:Record<Decor,[number,number]>={pine:[60,84],oak:[70,71],rock:[42,30],house:[110,104],fence:[21,24],bush:[37,31],lamp:[22,48],well:[45,39],column:[30,54],arch:[88,104],crystal:[36,46],banner:[22,42],crate:[30,24],lily:[18,12]}
export function propTexture(kind:Decor,v:number,region:MapDef['id']) {
  const [w,h]=PROP_SIZE[kind],{a,c}=canvas(w,h),r=random(v*178+kind.charCodeAt(0)*213)
  c.translate(w/2,h-7);const p=PALETTES[region]
  switch(kind){
    case 'pine':{
      const cold=region==='forest'||region==='pass',width=23+(v%3)*2,height=62+(v%3)*4
      const colors=cold?['#182c35','#203c43','#294b50','#335b5e','#47706a']:['#182c2c','#253f36','#305345','#3b6450','#537859']
      oval(c,'#17282888',1,1,width,6);box(c,'#312a2a',-3,-19,7,20);box(c,'#695040',-2,-16,2,14);line(c,'#4b3f34',0,-2,9,3,2)
      for(let row=0;row<5;row++){
        const top=-height+row*10, end=top+30, spread=Math.round(width*(.24+row*.18))
        const fuzz=[-1,0,1,2].map(()=>Math.floor(r()*5)-2)
        poly(c,colors[0],[0,top-4,spread/2+fuzz[0],top+10,spread-3,top+20,spread+3,end-3,spread-5,end-4,spread-1,end+1,spread*.45,end+5,1,end+1,-spread*.44,end+5,-spread+5,end+1,-spread-2,end,-spread+3,top+20,-spread*.6,top+11])
        poly(c,colors[1],[0,top,spread*.58,top+15,spread+1,end-3,spread-9,end-1,spread*.5,end+3,5,end,-spread*.43,end+2,-spread,end-1,-spread*.5,top+13])
        poly(c,colors[2],[-1,top+1,4,top+12,spread*.48+fuzz[1],top+19,spread*.12,top+21,spread*.5,end-3,-1,end-5,-spread*.5,end-2,-spread+3,end-3,-spread*.37,top+16])
        poly(c,colors[3],[-1,top+3,2,top+10,-1,top+15,-7,top+19,-spread+5,end-4,-spread*.6,end-6,-spread*.4,top+17]);
        for(let i=0;i<8;i++){const px=(r()-.62)*spread*1.23,py=top+18+r()*9;box(c,colors[r()<.4?4:3],px,py,2+Math.floor(r()*3),1)}
        if(region==='pass'){line(c,'#b1c6cc',-spread*.55,top+20,-3,top+14,2);box(c,'#89a8af',1,top+18,6,2)}
      }
      poly(c,colors[2],[0,-height-4,4,-height+9,0,-height+7,-4,-height+11]);break
    }
    case 'oak':{
      oval(c,'#1b282688',2,0,26,8);poly(c,'#392e2a',[-5,-30,6,-30,5,-7,12,2,3,1,-2,4,-9,3,-4,-7]);line(c,'#836046',-4,-20,-4,-1,3)
      const dark=region==='forest'?'#243741':'#243b32',medium=region==='forest'?'#365165':'#416046',hi=region==='forest'?'#557487':'#69865a'
      for(const [x,y,rx,ry] of [[-16,-34,15,16],[13,-30,17,17],[3,-42,20,18],[-15,-23,15,13],[12,-24,19,12],[-6,-36,19,19]]){
        oval(c,dark,x,y,rx,ry);oval(c,medium,x-2,y-3,rx-2,ry-2);oval(c,shade(medium,9),x-5,y-6,rx-6,ry-4)
        for(let j=0;j<19;j++){const dx=(r()-.5)*2*(rx-4),dy=(r()-.56)*2*(ry-4);if((dx/rx)**2+(dy/ry)**2<.71){box(c,r()<.65?hi:dark,x+dx,y+dy,2+Math.floor(r()*4),1);if(r()<.7)box(c,shade(medium,12),x+dx-2,y+dy+1,2,1)}}
      }
      if(region==='pass')for(let i=0;i<12;i++)box(c,'#a9c0c7',-23+r()*43,-52+r()*14,2+r()*4,2)
      break
    }
    case 'rock':case 'bush':{
      oval(c,'#162d2988',0,0,17,5)
      if(kind==='rock'){rubble(c,-17,-4,r,shade(p.stone,6));rubble(c,-10,-9,r,shade(p.stone,19));rubble(c,-5,-4,r,shade(p.stone,11));rubble(c,4,-3,r,p.stone);box(c,'#627d59',-9,-10,5,2);box(c,'#68835c',9,-5,5,1)}
      else {for(let i=0;i<8;i++){const x=-12+r()*24,y=-4-r()*11;oval(c,'#243f36',x,y,6,5);oval(c,shade(p.grass,16+Math.round(r()*16)),x-1,y-1,4,3);if(r()<.35)box(c,v%2?'#ada27b':'#ac7184',x-2,y-3,2,2)}}
      break
    }
    case 'house':{
      const depth=46+v*2, edge=['#65463e','#332e45','#434d45'][v%3],roof=['#79534a','#515b71','#596857'][v%3],plaster=['#aa8e72','#9d9c8b','#b19b74'][v%3],timber='#453630'
      oval(c,'#1a282580',2,1,51,7);box(c,'#363737',-43,-22,86,23);box(c,shade(plaster,-15),-39,-38,79,35)
      for(let yy=-36;yy<-2;yy+=5)for(let xx=-37;xx<38;xx+=8){if(r()<.8)box(c,shade(plaster,Math.round(r()*28)-15),xx+(yy%2?3:0),yy,5+r()*2,2)}
      for(const x of [-39,-22,19,38]){box(c,timber,x,-37,4,35);box(c,'#735139',x,-37,1,33)}
      box(c,timber,-41,-12,83,4);box(c,'#614b3b',-40,-12,81,1)
      box(c,'#212526',-11,-28,21,29);box(c,'#5f493a',-8,-25,15,23);for(let i=0;i<4;i++)box(c,i%2?'#68523e':'#513d33',-7+i*4,-25,3,22)
      box(c,'#a98a55',5,-12,2,2);box(c,'#4c5050',-12,-1,24,4);box(c,'#887f70',-13,2,26,2)
      for(const x of [-30,22]){
        box(c,'#312a2d',x-2,-28,14,16);box(c,'#d18a52',x,-26,11,12);box(c,'#e9ac66',x+1,-25,9,9);box(c,'#f4ca80',x+2,-23,2,4)
        box(c,'#6d4c3e',x+5,-26,1,12);box(c,'#6d4c3e',x,-21,11,1);box(c,'#4a4540',x-2,-14,15,2)
      }
      poly(c,'#292931',[-51,-32,-34,-depth-10,-14,-depth-24,33,-depth-24,49,-depth+4,52,-33,42,-26,-43,-26]);
      poly(c,roof,[-50,-34,-33,-depth-10,-13,-depth-23,30,-depth-23,47,-depth+2,50,-34,39,-30,-46,-30]);
      poly(c,shade(roof,17),[-50,-34,-35,-depth-12,-13,-depth-23,4,-depth-9,15,-34]);
      for(let j=0;j<7;j++){
        const ry=-depth-20+j*6, approx=12+j*5, left=Math.max(-47,-13-j*5),right=Math.min(48,29+Math.floor(j*3));
        for(let i=left+(j%2)*2;i<right-3;i+=9){const col=i<16-approx*.7?shade(roof,19+Math.floor(r()*12)):shade(roof,Math.floor(r()*20)-12);poly(c,col,[i,ry+1,i+8,ry,i+8,ry+5,i+2,ry+6]);box(c,shade(col,14),i+1,ry+1,5,1);box(c,shade(edge,-12),i+2,ry+5,6,1)}
      }
      poly(c,timber,[-48,-34,-32,-depth-9,-22,-depth-14,-10,-depth-3,8,-34,4,-30,-25,-depth-9,-43,-31]);
      poly(c,shade(plaster,7),[-42,-35,-25,-depth-9,-16,-depth-2,0,-35]);box(c,'#4c3b34',-27,-depth,10,10);box(c,'#d89a62',-24,-depth+2,4,6);box(c,'#f4c481',-24,-depth+3,2,3)
      line(c,'#9a7461',-47,-32,-25,-depth-11,1);line(c,'#b1846a',-25,-depth-11,4,-34,1);box(c,shade(roof,-25),6,-34,43,3)
      box(c,'#474648',23,-depth-30,11,18);box(c,'#666162',23,-depth-31,7,18);box(c,'#858077',21,-depth-32,15,3);box(c,'#292c35',24,-depth-32,8,1);box(c,'#3a3d40',25,-depth-23,8,1);box(c,'#38383b',25,-depth-17,9,1)
      break
    }
    case 'fence':{
      for(const y of [-12,-6]){box(c,'#45352b',-10,y,20,3);box(c,'#977452',-10,y,20,1)}
      poly(c,'#815f43',[-2,0,-2,-17,1,-20,3,-17,3,0]);box(c,'#bc9464',-2,-15,1,10);box(c,'#40332c',0,-10,2,1);break
    }
    case 'lamp':{
      oval(c,'#151c2588',0,0,7,3);box(c,'#2f2c2b',-2,-31,4,32);box(c,'#86664a',-2,-30,1,28);box(c,'#392f2c',-4,-31,12,2);box(c,'#886a48',-4,-32,12,1)
      poly(c,'#2c292d',[3,-30,6,-33,10,-30,9,-19,2,-19]);box(c,v===1?'#dca873':'#eaba75',4,-28,5,7);box(c,'#ffdc95',5,-26,2,4);box(c,'#a77848',7,-28,1,6);box(c,'#322932',2,-21,8,2);break
    }
    case 'well':{
      oval(c,'#252e27',0,1,19,6);oval(c,'#5e625e',0,-4,16,8);oval(c,'#8d8e7b',0,-8,17,8);oval(c,'#313b40',0,-8,13,5);oval(c,'#4c7c83',0,-6,9,3);box(c,'#91b0a6',-5,-7,9,1)
      for(let j=-14;j<15;j+=6)box(c,'#4a4b46',j,-3,1,5)
      box(c,'#392f2f',-14,-21,3,18);box(c,'#40342e',13,-21,3,18);poly(c,'#514052',[-18,-20,-10,-31,10,-31,18,-20]);poly(c,'#846474',[-16,-21,-9,-30,9,-30,11,-21]);box(c,'#ab8583',-9,-29,18,1);box(c,'#3a3237',-18,-21,36,3);break
    }
    case 'column':{
      const stone=shade(p.stone,12);oval(c,'#0b19278d',2,1,13,5);box(c,shade(stone,-14),-10,-7,20,9);box(c,shade(stone,24),-10,-7,20,1);box(c,shade(stone,-10),-6,-33,13,26);box(c,stone,-6,-33,7,25);box(c,shade(stone,22),-5,-33,2,23);box(c,'#283235',-7,-32,11,1)
      poly(c,shade(stone,-8),[-9,-32,-9,-38,-2,-36,4,-39,8,-36,9,-32]);line(c,shade(stone,32),-8,-36,-2,-35);line(c,'#292f36',2,-26,5,-21);box(c,'#566b65',-6,-13,6,1);break
    }
    case 'arch':{
      for(const side of [-1,1]){
        for(let i=0;i<6;i++){const x=side*(29-i*i*.67),y=-i*8-5,c0=shade(p.stone,i*3+17);poly(c,'#1f2530',[x-7,y-14,x+7,y-14,x+9,y-1,x+7,y+3,x-8,y+3]);box(c,c0,x-6,y-10,12,10);box(c,shade(c0,20),x-6,y-10,11,1);box(c,shade(c0,-12),x+2,y-8,3,7);box(c,'#758978',x-6,y-3,3,1)}
      }
      poly(c,'#3f4652',[-8,-50,0,-61,8,-50,4,-38,-4,-38]);poly(c,'#6e8d87',[0,-56,4,-50,0,-45,-4,-50]);box(c,'#b3d1ae',-1,-51,2,3);break
    }
    case 'crystal':{
      oval(c,'#203240',0,0,17,6);const col=v%2?'#9d83ac':'#5ba69f',light=v%2?'#d7aed4':'#ace2cd'
      for(const [x,y,a,b] of [[-10,-3,6,20],[1,-2,9,36],[11,-1,5,16]]){poly(c,'#293f4a',[x-a,y-3,x-a+1,y-b+7,x,y-b,x+a,y-b+8,x+a,y-4,x,y]);poly(c,col,[x-a+2,y-4,x-a+2,y-b+7,x,y-b+1,x+3,y-b+8,x+2,y-5]);poly(c,light,[x,y-b+1,x+2,y-b+5,x-1,y-b+12,x-1,y-b+6]);line(c,shade(col,32),x+4,y-5,x+4,y-b+12)}break
    }
    case 'banner':{
      oval(c,'#15262a85',0,0,8,3);box(c,'#593e37',-2,-32,4,34);box(c,'#b08a57',-1,-29,1,27);box(c,'#d9bb7a',-8,-32,16,1);const col=['#8b4e4b','#485d6e','#635275'][v%3]
      poly(c,col,[-7,-30,6,-30,6,-11,0,-6,-7,-11]);line(c,shade(col,32),-6,-30,-6,-12);poly(c,'#d5b77c',[0,-26,3,-21,0,-17,-3,-21]);box(c,'#ffe2a3',0,-23,1,4);break
    }
    case 'crate':{
      oval(c,'#272522a0',0,2,13,4);box(c,'#524038',-10,-12,20,15);box(c,'#91734f',-10,-14,20,4);box(c,'#ad895b',-9,-14,18,1);box(c,'#755937',-9,-9,18,10);line(c,'#a98251',-9,-9,7,1,2);box(c,'#4a3c33',-10,-8,2,11);box(c,'#4a3e34',8,-8,2,11);break
    }
    case 'lily':oval(c,'#47573e',0,0,7,3);box(c,'#cf93a6',-2,-4,3,3);break
  }
  return a
}
export const DIRECTIONS:Facing[]=['south','west','east','north']
export const HUMAN_W=38,HUMAN_H=46, FRAMES=9
const HAIR=['#524037','#483330','#3d3038','#745346','#6c6760','#535866']
export function human(c:Ink,cls:ClassId,dye:number,skin:number,style:number,facing:Facing,frame:number) {
  const color=DYES[dye]??DYES[0], face=SKINS[skin]??SKINS[0]
  const battle=frame===5||frame===6,north=facing==='north',side=facing==='east'||facing==='west', hood=cls==='assassin'||cls==='warlock'||cls==='ranger',plate=cls==='knight'||cls==='warrior', noble=cls==='priest'
  const step=frame>=1&&frame<=4?[1,3,-1,-3][frame-1]:0, bob=frame===2||frame===4?-1:frame===7?1:0
  c.save(); if(facing==='west')c.scale(-1,1);c.translate(0,bob)
  const outline='#202230',shadow=shade(color,-38),hi=shade(color,38),metal=cls==='knight'?'#8992ad':'#a7a69e',h=HAIR[(skin+style*3+(noble?1:0))%HAIR.length]
  if(plate||hood||noble) {
    poly(c,outline,[-7,-21,6,-23,10,-16,11,-6,14,-1,3,0,-6,-3,-12,-1,-11,-11]);poly(c,shadow,[-7,-19,7,-19,9,-15,9,-6,12,-2,3,-1,-5,-4,-11,-2,-9,-12])
    line(c,color,-9,-13,-10,-4,2);line(c,shade(color,10),5,-17,9,-3,2)
  }
  for(const [x,d] of [[-4,step],[3,-step]]){
    const dx=side?d*.65:0, dy=side?Math.abs(d)*.25:d*.58
    box(c,outline,x-2+dx,-12+dy,5,13);box(c,plate?'#474c5d':'#5b4641',x-1+dx,-10+dy,3,9);box(c,'#292837',x-2+dx,-3+dy,6,4);box(c,'#73727a',x-1+dx,-3+dy,3,1);if(side)box(c,'#40333a',x+1+dx,-1+dy,4,2)
  }
  poly(c,outline,[-8,-25,-5,-28,5,-28,9,-23,8,-14,7,-8,1,-9,-3,-7,-8,-9,-8,-14]);poly(c,color,[-7,-24,-4,-27,5,-27,8,-23,6,-15,6,-9,1,-10,-3,-8,-7,-10,-6,-15]);box(c,shadow,-6,-13,13,2)
  if(plate){poly(c,shade(metal,-33),[-6,-25,5,-25,7,-20,4,-15,-3,-15,-7,-21]);poly(c,metal,[-5,-25,3,-25,5,-22,3,-17,-3,-17,-6,-22]);box(c,shade(metal,39),-4,-24,6,1);box(c,hi,-1,-21,2,4)}
  else {line(c,hi,-4,-26,3,-14,2);box(c,shade(color,-26),3,-23,3,9);if(noble)poly(c,'#d8c79f',[-3,-25,1,-24,4,-14,0,-14])}
  box(c,'#46343a',-7,-15,14,2);box(c,'#d6ae76',0,-15,3,2);box(c,'#806744',1,-15,1,1)
  for(const sign of [-1,1]){
    if(side&&sign<0)continue
    const x=sign*8+(battle&&sign===1?3:0),y=-23+(battle&&sign===1?-2:0)+(sign===1?Math.sign(step):-Math.sign(step));
    poly(c,outline,[x-3,y-3,x+3,y-3,x+4,y+6,x+2,y+10,x-3,y+10,x-3,y+4]);box(c,plate?shade(metal,-24):shadow,x-2,y-2,5,7);box(c,plate?metal:color,x-2,y-2,5,3);box(c,plate?shade(metal,31):hi,x-2,y-3,4,1);box(c,face,x-2,y+6,4,3)
  }
  const hx=side?2:0
  poly(c,outline,[hx-7,-29,hx-8,-35,hx-6,-40,hx-3,-42,hx+3,-42,hx+7,-39,hx+8,-35,hx+7,-29,hx+4,-26,hx-4,-26]);
  poly(c,h,[hx-6,-29,hx-7,-35,hx-5,-39,hx-3,-41,hx+3,-41,hx+6,-38,hx+7,-35,hx+6,-29,hx+4,-27,hx-4,-27]);box(c,shade(h,33),hx-4,-39,7,2);box(c,shade(h,19),hx-5,-36,3,2)
  if(!north){
    poly(c,shade(face,-26),[hx-5,-34,hx+6,-35,hx+6,-30,hx+3,-27,hx-2,-27,hx-5,-31]);box(c,face,hx-4,-34,10,4);box(c,shade(face,17),hx-3,-35,7,2);box(c,face,hx-2,-31,6,3)
    if(side){box(c,'#302932',hx+3,-34,2,2);box(c,'#fff4bb',hx+3,-34,1,1);box(c,shade(face,7),hx+6,-32,2,1)}else{
      box(c,'#2b2a34',hx-3,-34,2,2);box(c,'#2b2a34',hx+3,-34,2,2);box(c,'#efe9c7',hx-3,-34,1,1);box(c,'#efe9c7',hx+3,-34,1,1);box(c,'#af745d',hx,-29,3,1)
    }
  }
  if(style===1&&!hood){box(c,h,hx-6,-34,2,9);box(c,shade(h,19),hx-6,-34,1,8);box(c,h,hx+6,-37,2,10);if(north)box(c,shade(h,-8),hx-1,-31,4,7)}
  if(hood){
    poly(c,shadow,[hx-8,-34,hx-7,-39,hx-2,-43,hx+3,-42,hx+7,-39,hx+8,-33,hx+6,-30,hx+5,-35,hx+1,-37,hx-3,-36,hx-5,-32,hx-5,-29]);line(c,color,hx-7,-37,hx-3,-41,2);line(c,hi,hx-3,-41,hx+1,-41,1);if(north)box(c,color,hx-4,-36,7,6);if(cls==='assassin'&&!north)box(c,shadow,hx-5,-31,12,4)
  }
  if(plate){
    poly(c,shade(metal,-32),[hx-7,-35,hx-6,-39,hx-3,-41,hx+4,-41,hx+7,-37,hx+7,-34,hx+4,-36,hx-3,-36]);box(c,metal,hx-5,-39,8,2);box(c,shade(metal,34),hx-3,-40,4,1);box(c,cls==='knight'?'#e88caa':'#e7c57d',hx-1,-38,2,2)
    if(cls==='warrior'&&!side){poly(c,'#3c383a',[-12,-21,-6,-20,-5,-14,-11,-9,-16,-13,-16,-20]);poly(c,'#a08c68',[-12,-21,-7,-19,-7,-14,-11,-11,-14,-14,-15,-19]);box(c,shade(color,-4),-13,-18,4,5);box(c,'#e4c892',-12,-18,1,5)}
  }
  if(noble){box(c,'#e6d8aa',hx-5,-38,10,2);box(c,'#faf0c7',hx,-39,2,4);box(c,'#dfb677',hx+1,-39,1,3)}
  const wx=side?10:9, wy=battle?-20:-14
  if(cls==='warlock'||cls==='priest'){
    line(c,'#362b2d',wx-1,0,wx+3+(battle?2:0),wy-15,3);line(c,'#947457',wx,0,wx+4+(battle?2:0),wy-15);const z=wx+4+(battle?2:0)
    poly(c,noble?'#edc57e':'#bc8cdb',[z,wy-24,z+4,wy-19,z+3,wy-13,z-2,wy-14,z-3,wy-18]);box(c,noble?'#fff4ba':'#f0cbff',z-1,wy-21,2,4)
  }else if(cls==='ranger'){
    poly(c,'#322832',[wx,-28,wx+5,-24,wx+8,-18,wx+8,-13,wx+2,-6,wx+4,-13,wx+5,-18,wx+3,-24]);line(c,'#bd9567',wx+1,-26,wx+6,-18,1);line(c,'#9e764f',wx+6,-18,wx+2,-7,1);line(c,'#c3b19a',wx,-26,wx+1,-8,1);if(battle)line(c,'#e4ce9d',wx-1,-17,wx+8,-17,1)
  }else{
    const tip=battle?[18,-26]:cls==='assassin'?[15,-5]:[15,-2], base=[wx,wy]
    line(c,'#232631',base[0]-2,base[1]-1,tip[0],tip[1],cls==='knight'?5:3);line(c,metal,base[0],base[1],tip[0]-1,tip[1]-1,cls==='knight'?3:2);line(c,'#dce2db',base[0]+1,base[1]-1,tip[0],tip[1]-1,1);box(c,'#d4a87b',base[0]-2,base[1]-2,4,2)
  }
  c.restore()
}
export function humanAtlas(cls:ClassId,dye:number,skin:number,style:number){
  const {a,c}=canvas(HUMAN_W*FRAMES,HUMAN_H*4)
  for(let i=0;i<DIRECTIONS.length;i++)for(let f=0;f<FRAMES;f++){
    c.save();c.translate(f*HUMAN_W+HUMAN_W/2,i*HUMAN_H+HUMAN_H-3);human(c,cls,dye,skin,style,DIRECTIONS[i],f);c.restore()
  }return a
}
export function portrait(c:Ink,cls:ClassId,dye:number,skin:number,style:number){
  c.save();c.translate(25,72);c.scale(1.65,1.65);human(c,cls,dye,skin,style,'south',0);c.restore()
}
export function enemyAtlas(id:EnemyId){
  const boss=id==='warden',w=boss?86:48,h=boss?88:43,{a,c}=canvas(w*FRAMES,h*2)
  for(let dir=0;dir<2;dir++)for(let f=0;f<FRAMES;f++){
    c.save();c.translate(f*w+w/2,dir*h+h-3);if(dir)c.scale(-1,1);drawEnemy(c,id,f);c.restore()
  }
  return {a,w,h}
}
function drawEnemy(c:Ink,id:EnemyId,f:number){
  const d=ENEMIES[id],col=d.color,lo=shade(col,-55),mid=shade(col,-27),hi=shade(col,25),dk='#222534',r=random(89083+id.length*19),step=f>0&&f<5?[2,0,-2,0][f-1]:0, pulse=f===2||f===4?2:0, attack=f===5||f===6
  c.save();c.translate(0,f===7?1:0)
  switch(d.kind) {
    case 'slime':{
      const height=attack?21:16+pulse
      poly(c,dk,[-19,-2,-18,-9,-13,-11,-10,-height,-4,-height-2,5,-height,10,-height+3,12,-9,17,-6,19,-1,14,1,-13,1]);poly(c,lo,[-17,-2,-15,-8,-11,-9,-8,-height+1,-3,-height,5,-height+2,10,-height+5,11,-7,17,-3,14,0,-12,0]);poly(c,mid,[-13,-6,-9,-height+3,-3,-height,5,-height+3,11,-7,12,-4,-8,-4]);line(c,hi,-8,-height+5,-3,-height+3,2)
      box(c,dk,-3,-height+7,3,4);box(c,dk,4,-height+7,3,4);box(c,'#efdbad',-3,-height+7,1,2);box(c,'#efdbad',5,-height+7,1,2);for(let i=0;i<11;i++)box(c,i%2?hi:mid,-13+r()*29,-4+r()*4,2,1);break
    }
    case 'wisp':{
      const y=-16-pulse,glow=id==='omen'?'#ffe0f6':'#d1f7db'
      oval(c,`${col}23`,0,y,16,16);oval(c,`${col}39`,0,y,12,12);poly(c,lo,[-12,y+3,-8,y-5,-4,y-13,0,y-19,1,y-12,8,y-11,13,y-5,10,y+3,3,y+8,-4,y+10,-9,y+5]);
      poly(c,mid,[-10,y+2,-5,y-2,-3,y-12,0,y-15,2,y-9,8,y-8,11,y-2,8,y+3,3,y+6,-2,y+7]);poly(c,col,[-5,y+2,-4,y-5,2,y-9,8,y-3,5,y+3,1,y+6]);poly(c,glow,[-2,y,2,y-6,6,y-1,2,y+4]);box(c,'#fff8e4',1,y-3,2,3)
      for(let i=0;i<5;i++)box(c,i%2?hi:mid,-15+r()*29,y-8+r()*20,1,2);break
    }
    case 'wolf':{
      for(const [x,z] of [[-13,step],[-7,-step],[9,-step],[14,step]]){line(c,dk,x,-12,x-2+z,0,3);line(c,lo,x,-12,x-2+z,-2,2);box(c,mid,x-2+z,-2,3,1)}
      poly(c,dk,[-17,-10,-21,-14,-22,-23,-17,-18,-13,-16,-6,-21,2,-21,9,-24,12,-29,17,-25,19,-21,22,-18,22,-13,16,-11,11,-13,7,-8,-8,-8,-14,-10]);
      poly(c,lo,[-18,-12,-20,-15,-20,-20,-16,-17,-12,-14,-5,-19,1,-19,10,-23,13,-27,16,-24,17,-20,21,-17,20,-14,16,-12,11,-15,5,-10,-10,-9]);poly(c,mid,[-14,-14,-6,-18,1,-18,8,-22,13,-22,17,-20,17,-17,11,-16,5,-13,-3,-13]);
      line(c,hi,-7,-18,8,-22,1);box(c,'#edb4bf',15,-21,2,1);box(c,'#242732',20,-17,2,2);box(c,attack?'#ffd6bf':hi,18,-14,2,1);box(c,'#535e66',10,-12,3,1);break
    }
    case 'bat':{
      const y=-16,flap=attack?4:step*2+pulse-4
      for(const s of [-1,1]){c.save();c.scale(s,1);poly(c,dk,[2,y,4,y-6,10,y-9+flap,17,y-9+flap,22,y-5+flap,19,y+8,16,y+3,12,y+7,10,y+2,6,y+8]);poly(c,lo,[4,y,6,y-5,11,y-7+flap,17,y-7+flap,20,y-4+flap,18,y+4,15,y+1,12,y+4,9,y,6,y+5]);line(c,mid,7,y,16,y-7+flap);line(c,mid,7,y,12,y+3);c.restore()}
      poly(c,mid,[-5,y+3,-6,y-6,-3,y-4,2,y-4,4,y-7,6,y-2,6,y+5,2,y+9,-2,y+8]);box(c,'#f0b6b7',-3,y-2,2,1);box(c,'#f0b6b7',2,y-2,2,1);box(c,'#dacea9',0,y+4,2,2);break
    }
    case 'spider':{
      for(let i=0;i<4;i++)for(const s of [-1,1]){const x=s*(12+i%2*4),y=-18+i*5,dy=(step*(i%2?1:-1));line(c,dk,s*6,-10,x,y+dy,2);line(c,dk,x,y+dy,x+s*5,y+7+dy,2);line(c,mid,s*6,-11,x,y+dy);box(c,hi,x,y+dy,1,1)}
      oval(c,dk,-4,-10,12,10);oval(c,lo,-5,-11,10,8);oval(c,mid,-6,-13,7,5);poly(c,col,[-10,-14,-4,-15,-1,-12,-5,-11]);oval(c,lo,8,-7,7,6);box(c,'#ef9198',11,-9,2,2);box(c,'#f4b3af',8,-11,2,1);box(c,'#d6b4a8',13,-4,2,2);if(attack)box(c,'#c7f9a4',15,-5,3,3);break
    }
    case 'warden':{
      const y=-pulse
      c.translate(0,y)
      for(const s of [-1,1]){
        c.save();c.scale(s,1);line(c,'#283634',6,-18,15+step,-3,9);line(c,'#53594b',6,-18,15+step,-4,6);line(c,'#738170',9,-15,15+step,-3,2);poly(c,'#282e32',[12+step,-7,23+step,-6,28+step,-1,10+step,1]);
        const wx=attack?3:0
        poly(c,'#233331',[7,-50,16,-59,27,-51,29,-42,33+wx,-32,29+wx,-18,34+wx,-10,25+wx,-5,18+wx,-8,18+wx,-17,22+wx,-26,16,-35,9,-33]);
        poly(c,'#535b4d',[10,-49,16,-57,25,-50,26,-42,30+wx,-32,26+wx,-20,31+wx,-11,25+wx,-8,20+wx,-11,22+wx,-24,20,-33,13,-36]);
        poly(c,'#7c806a',[12,-50,16,-55,22,-51,23,-45,16,-41,12,-44]);line(c,'#96a78c',13,-48,21,-50,2);line(c,'#839383',24,-33,27,-24,2);line(c,'#9a8466',22,-16,27,-11,2)
        line(c,'#3b493c',13,-52,18,-68,4);line(c,'#626653',16,-56,26,-76,2);line(c,'#747b60',20,-67,20,-81,2);line(c,'#8d9d78',24,-71,35,-73,2);box(c,'#a1bd85',31,-76,3,3);box(c,'#81ab7a',19,-82,4,3);c.restore()
      }
      poly(c,'#293b38',[-13,-52,-7,-61,8,-61,15,-51,16,-33,13,-18,6,-9,-6,-10,-15,-20,-16,-36]);
      poly(c,'#536055',[-12,-51,-7,-57,8,-57,13,-48,12,-35,10,-19,5,-14,-5,-14,-12,-23,-14,-38]);
      for(let i=0;i<18;i++){const bx=-12+r()*24,by=-46+r()*25;box(c,i%3?'#7a8a72':'#343f37',bx,by,3+r()*6,2)}
      poly(c,'#2a4337',[-11,-40,-6,-47,5,-47,12,-40,9,-29,2,-20,-4,-22,-10,-30]);poly(c,attack?'#f1c28e':'#70bc95',[-6,-39,1,-47,7,-39,4,-30,0,-25,-5,-31]);poly(c,'#cce1a8',[-3,-39,1,-44,4,-39,2,-32,-1,-32]);
      poly(c,'#283235',[-11,-53,-10,-64,-6,-72,0,-66,7,-72,11,-64,11,-54,6,-48,-6,-47]);poly(c,'#8c8b71',[-9,-54,-8,-64,-5,-68,0,-62,6,-67,8,-63,9,-55,5,-50,-6,-50]);box(c,'#3f554b',-5,-60,11,3);box(c,'#dce8a9',-7,-60,4,2);box(c,'#dce8a9',4,-60,4,2);box(c,'#bed6ae',-1,-56,2,5);break
    }
    default:{
      const warrior=id==='guardian'||id==='skeleton', head=id==='skeleton'?'#cfc6aa':id==='guardian'?'#8faaa4':id==='goblin'?'#a4a674':'#b88775'
      const body=id==='goblin'?'#636044':id==='bandit'?'#865551':warrior?'#676c73':lo
      const y=id==='goblin'?3:0
      for(const [x,z] of [[-5,-step],[5,step]]){box(c,dk,x-2+z,-11,5,12);box(c,warrior?shade(head,-32):lo,x-1+z,-10,2,8);box(c,lo,x-2+z,-3,5,2)}
      poly(c,dk,[-10,-26+y,-6,-29+y,6,-29+y,11,-24+y,11,-14,7,-8,-3,-8,-8,-10]);poly(c,body,[-8,-25+y,-5,-28+y,5,-27+y,8,-22+y,8,-15,5,-10,-6,-11,-7,-15]);
      if(warrior){for(let i=0;i<3;i++){box(c,head,-5,-22+i*3,10,2);box(c,lo,-5,-20+i*3,10,1)}box(c,hi,0,-23,2,9)}else {line(c,hi,-6,-26+y,5,-14,2);box(c,'#c59362',-2,-15,3,2)}
      box(c,dk,8,-25+y,5,15);box(c,head,9,-23+y,3,11);line(c,'#887051',10,-13,17,-6,2);line(c,'#c1ad88',13,-11,attack?23:18,attack?-26:-6,2)
      if(id==='guardian'){poly(c,'#405753',[-8,-33,-4,-40,6,-40,9,-33,8,-26,-4,-26,-9,-29]);box(c,head,-5,-38,11,4);box(c,'#d1f5bd',0,-33,5,2);box(c,'#384943',-3,-31,9,4)}
      else{
        poly(c,dk,[-8,-29+y,-9,-37+y,-4,-41+y,4,-41+y,9,-36+y,10,-30+y,5,-25+y,-3,-25+y]);poly(c,head,[-6,-30+y,-7,-36+y,-4,-39+y,4,-39+y,7,-35+y,8,-30+y,4,-26+y,-2,-27+y]);box(c,id==='skeleton'?'#c293d1':'#e8c294',-3,-35+y,7,1);box(c,'#333038',-4,-35+y,2,2);box(c,'#333038',4,-35+y,2,2);box(c,shade(head,-31),0,-29+y,5,1)
        if(id==='goblin'){poly(c,lo,[-5,-32+y,-14,-39+y,-11,-31+y,-5,-29+y]);poly(c,head,[-6,-32+y,-11,-36+y,-10,-32+y]);poly(c,mid,[5,-34+y,14,-39+y,11,-32+y,5,-30+y])}
        if(id==='bandit'){poly(c,'#564b53',[-8,-34,-8,-39,-3,-42,3,-42,8,-38,8,-34,5,-34,2,-37,-4,-36]);box(c,'#754751',-6,-32,13,4)}
      }
    }
  }
  c.restore()
}

export const FEATURE_SIZE=32
export function featureTexture(type:string,variant=0){
  const {a,c}=canvas(32,34);c.translate(16,27)
  switch(type){
    case 'exit':{
      oval(c,'#073a3e95',0,1,13,4);poly(c,'#415a5a',[-8,2,-10,-2,-9,-14,-5,-21,5,-21,9,-14,10,-2,7,2]);poly(c,'#24363b',[-6,1,-7,-2,-6,-13,-3,-17,3,-17,6,-13,7,-2,4,1]);poly(c,variant?'#8a7468':'#87d0ba',[0,-17,4,-11,3,-6,0,-3,-3,-7,-4,-11]);box(c,variant?'#af8b67':'#d4f6cd',0,-13,1,6);break
    }
    case 'shrine':{
      oval(c,'#131e29a0',0,1,13,5);box(c,'#4b514f',-11,-4,22,6);box(c,'#777f73',-10,-5,20,2);poly(c,'#58616a',[-8,-5,-7,-16,-3,-23,2,-25,7,-22,8,-13,8,-5]);poly(c,'#a0a293',[-5,-6,-4,-18,1,-23,5,-21,6,-14,3,-6]);poly(c,'#e5c782',[1,-20,4,-16,1,-11,-2,-16]);box(c,'#eee1b1',0,-17,2,3);break
    }
    case 'herb':{
      oval(c,'#1b2e29a0',0,1,9,4);for(let s=-1;s<=1;s++){line(c,'#729c73',0,0,s*6,-10+Math.abs(s)*3,2);poly(c,'#a4ce9d',[s*3,-3,s*6,-7,s*7,-10,s*4,-9,s*1,-5]);box(c,'#9fd5cf',s*6-1,-11+Math.abs(s)*2,3,2);box(c,'#c0e6c9',s*6,-12+Math.abs(s)*2,1,1)}break
    }
    case 'chest':{
      oval(c,'#181f24a0',0,2,13,4);box(c,'#302931',-11,-14,22,15);poly(c,'#855d42',[-11,-11,-8,-16,8,-16,11,-11,11,-8,-11,-8]);box(c,'#694732',-9,-8,18,7);box(c,'#b58a53',-9,-12,18,2);for(const x of [-7,6])box(c,'#ae9264',x,-13,2,13);box(c,'#d3ad66',-2,-9,4,4);box(c,'#473437',0,-8,1,2);break
    }
    case 'rune':{
      const col=['#f2a878','#83c5ed','#9de5ae'][variant%3]
      oval(c,'#1e222d',0,1,13,6);oval(c,'#737685',0,-3,11,7);oval(c,'#393b50',0,-3,8,5);line(c,col,-4,-3,0,-8);line(c,col,0,-8,4,-3);line(c,col,4,-3,0,1);line(c,col,0,1,-4,-3);box(c,col,0,-6,1,5);break
    }
    case 'inspect':case 'ore':{
      oval(c,'#151c20a0',0,2,10,4);const r=random(731);rubble(c,-10,-3,r,'#647878');rubble(c,-3,-5,r,'#829393');rubble(c,4,-2,r,'#51626c');box(c,variant?'#c3a0d3':'#88c8bd',-4,-5,3,2);box(c,'#c4c2a6',3,-4,2,1);if(type==='inspect'){box(c,'#53586b',-6,-19,12,13);box(c,'#8e8e9e',-7,-20,13,3);line(c,'#bec0bd',-4,-16,3,-16);box(c,'#9993a5',-4,-13,6,1)}break
    }
    case 'scroll':box(c,'#5b4537',-7,-8,14,9);box(c,'#c9ad7e',-6,-9,13,7);box(c,'#e2c28f',-5,-9,2,7);box(c,'#9e5a56',2,-7,4,3);break
    case 'coin':oval(c,'#87633c',0,-2,7,4);oval(c,'#d8a956',0,-4,6,3);box(c,'#f5d47e',-4,-5,6,1);box(c,'#f9e5a1',0,-6,2,3);break
    default:poly(c,'#caa46c',[0,-18,6,-10,0,-2,-6,-10]);poly(c,'#f5df9c',[0,-16,3,-10,0,-5,-3,-10]);box(c,'#fff3cf',0,-13,1,6)
  }
  return a
}
