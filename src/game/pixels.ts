import { ENEMIES, type EnemyId } from '../data/enemies'
import { random, TILE, type Decor, type Ground, type MapDef } from '../data/maps'
import { SPRITE_FRAMES, atlasCell, box, canvas, line, oval, poly, shade, type Ink } from './pixelInk'
import { paintTerrain } from './sceneryArt'

function rubble(c:Ink,x:number,y:number,r:()=>number,color:string) {
  const w=4+Math.floor(r()*8);poly(c,'#232e31',[x-1,y+3,x+2,y-3,x+w-3,y-4,x+w,y,x+w-1,y+4]);poly(c,color,[x,y+2,x+2,y-3,x+w-3,y-3,x+w-1,y,x+w-4,y+2]);line(c,shade(color,24),x+1,y,x+3,y-2);box(c,shade(color,-17),x+w-3,y+1,2,2)
}
const PALETTES: Record<MapDef['id'],{grass:string; moss:string; path:string; stone:string; night:string; wood:string}>={
  village:{grass:'#42643b',moss:'#324e32',path:'#847059',stone:'#69645c',night:'#191621',wood:'#89664b'},
  road:{grass:'#456035',moss:'#3d4b32',path:'#866c4e',stone:'#66645b',night:'#161922',wood:'#826247'},
  forest:{grass:'#2c4b40',moss:'#253d3a',path:'#585f51',stone:'#555b65',night:'#121826',wood:'#5a5e54'},
  spire:{grass:'#45425c',moss:'#3f3a54',path:'#4d4b5c',stone:'#59536f',night:'#141222',wood:'#625775'},
  capital:{grass:'#284849',moss:'#344d46',path:'#415456',stone:'#4c5b65',night:'#172632',wood:'#6d5853'},
  archive:{grass:'#2b4d4e',moss:'#2c414a',path:'#354e54',stone:'#475561',night:'#101c2b',wood:'#41585a'},
  bellvault:{grass:'#2a4b4c',moss:'#374550',path:'#4b5162',stone:'#595562',night:'#151729',wood:'#615065'},
  pass:{grass:'#536a76',moss:'#405566',path:'#707d80',stone:'#657383',night:'#182639',wood:'#6b7283'},
}
export function groundTexture(m:MapDef,tx:number,ty:number,cw:number,ch:number,terrainSheet?:CanvasImageSource) {
  const {a,c}=canvas(cw*TILE,ch*TILE),p=PALETTES[m.id]
  const get=(x:number,y:number):Ground|undefined=>x<0||y<0||x>=m.w||y>=m.h?undefined:m.tiles[y*m.w+x]
  for(let y=ty;y<ty+ch;y++)for(let x=tx;x<tx+cw;x++){
    const xx=(x-tx)*16,yy=(y-ty)*16,g=get(x,y)!,r=random((m.seed+x*983+y*1379)*17131),n=Math.floor(r()*9)-4
    if(terrainSheet&&paintTerrain(c,terrainSheet,m,g,x,y,xx,yy,get))continue
    const patch=(Math.sin(x*.36+y*.72)+Math.cos(x*.91-y*.34))*5
    const col=g==='grass'?p.grass:g==='moss'?p.moss:g==='path'?p.path:g==='stone'?p.stone:g==='slate'?(m.id==='archive'?'#354b59':m.id==='bellvault'?'#3c344e':'#39364b'):g==='water'?m.id==='capital'||m.id==='archive'?'#183f50':'#244956':g==='wall'?p.night:g==='snow'?'#9cadba':g==='abyss'?'#171f2e':g==='cobbles'?'#394b54':g==='marble'?(m.id==='bellvault'?'#534b64':'#556875'):g==='grate'?'#334854':p.wood
    const base=shade(col,Math.round(patch)+n);box(c,base,xx,yy,16,16)
    if(g==='grass'||g==='moss'||g==='snow'||g==='path'){
      for(let i=0;i<21;i++){const dx=Math.floor(r()*16),dy=Math.floor(r()*16),t=r();box(c,shade(base,t<.25?10:t<.7?-7:4),xx+dx,yy+dy,t<.08&&dx<15?2:1,1)}
      if(g!=='path'&&r()<.60){const bx=xx+2+Math.floor(r()*11),by=yy+5+Math.floor(r()*8),hi=shade(base,g==='snow'?31:22)
        line(c,shade(base,-15),bx-2,by+1,bx+4,by+1);line(c,hi,bx,by,bx-1,by-2);line(c,shade(base,10),bx+2,by,bx+3,by-4);box(c,hi,bx+3,by-4,1,1)
        if(g!=='snow'&&r()<.14){box(c,r()<.6?'#c1ac78':'#a28fa0',bx-1,by-3,2,1);box(c,'#e0cc9d',bx,by-4,1,1)}
      }
      if(g==='grass'||g==='moss'){
        const bx=xx+7,by=yy+10,mild=m.id==='road'||m.id==='village'
        // Larger shade clusters and small hand-shaped foliage patches temper the noise.
        if(r()<.57)poly(c,shade(base,-8),[xx+3,yy+3,xx+10,yy+2,xx+14,yy+5,xx+12,yy+10,xx+6,yy+12,xx+2,yy+8])
        if(r()<.28){
          const sprout=mild?'#6f853d':'#506f50',leaf=mild?'#8b9d51':'#65886b'
          line(c,shade(base,-17),bx-5,by+2,bx+5,by+2,2);line(c,sprout,bx,by+2,bx+2,by-6)
          for(const [dx,dy] of [[-4,-5],[4,-4],[-5,-2],[5,-1]]){line(c,sprout,bx,by,bx+dx,by+dy,2);box(c,leaf,bx+dx,by+dy,2,1)}
          if(mild&&r()<.32){box(c,r()<.45?'#c6798c':'#e1b869',bx+1,by-7,3,2);box(c,'#f5dda5',bx+2,by-8,1,1);box(c,'#a98aad',bx-5,by-4,2,1)}
        }else if(m.id==='forest'&&r()<.10){box(c,'#777461',xx+6,yy+8,2,5);poly(c,'#986978',[xx+2,yy+8,xx+4,yy+5,xx+8,yy+4,xx+11,yy+7,xx+10,yy+9,xx+3,yy+9]);box(c,'#c7949c',xx+5,yy+6,2,1)}
      }
      if(g==='snow'&&r()<.6){
        poly(c,shade(base,13),[xx+1,yy+8,xx+4,yy+5,xx+9,yy+6,xx+14,yy+4,xx+12,yy+9,xx+8,yy+11,xx+3,yy+11]);line(c,shade(base,-15),xx+3,yy+12,xx+11,yy+11);line(c,shade(base,25),xx+4,yy+6,xx+9,yy+7)
      }
      if(g==='path'&&r()<.42) {
        const bx=xx+2+r()*5,by=yy+4+r()*8;poly(c,shade(base,-14),[bx-1,by,bx+4,by-2,bx+6,by,bx+4,by+3,bx,by+3]);box(c,shade(base,12),bx+1,by,4,1);box(c,shade(base,-5),bx+4,by+3,3,1)
      }
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
      if(g==='slate'&&r()<.29){
        const tint=m.id==='spire'||m.id==='bellvault'?'#786782':m.id==='archive'?'#537370':shade(base,10)
        line(c,shade(base,-22),xx+7,yy+4,xx+9,yy+8);line(c,shade(base,-18),xx+9,yy+8,xx+13,yy+12);box(c,tint,xx+10,yy+12,4,1);box(c,tint,xx+1,yy+7,3,1)
      }
      if(g==='stone'&&m.id==='village'&&r()<.23){box(c,'#667454',xx+2,yy+3,4,1);box(c,'#7f825a',xx+4,yy+4,3,1);box(c,'#4c583d',xx+11,yy+14,3,1)}
    }
    if(g==='cobbles'){
      const grime=shade(base,-18);box(c,grime,xx,yy,16,16)
      for(let j=0;j<4;j++)for(let i=0;i<2;i++){
        const edge=(j%2)*3, left=xx+i*8+edge, top=yy+j*4, col=shade(base,Math.floor(r()*18)-6)
        const w=Math.min(8,xx+16-left)
        if(edge&&i===0)box(c,shade(base,6),xx,top+1,edge-1,2)
        poly(c,col,[left,top+2,left+2,top,left+w-2,top,left+w,top+1,left+w-1,top+3,left+1,top+3]);box(c,shade(col,12),left+2,top+1,Math.max(1,w-3),1)
      }
      if(r()<.18){oval(c,'#233848',xx+8,yy+9,7,3);box(c,r()<.5?'#63808a':'#8a7b70',xx+4,yy+10,8,1);box(c,'#6e7c85',xx+7,yy+7,4,1)}
    }
    if(g==='marble'){
      box(c,shade(base,14),xx,yy,16,1);box(c,shade(base,-21),xx,yy+15,16,1);box(c,shade(base,10),xx,yy,1,15);box(c,shade(base,-17),xx+15,yy+1,1,15)
      const seams=shade(base,-7),shine=shade(base,18)
      poly(c,shade(base,6),[xx+1,yy+8,xx+8,yy+1,xx+15,yy+8,xx+8,yy+15]);line(c,seams,xx+8,yy+1,xx+14,yy+8);line(c,seams,xx+14,yy+8,xx+8,yy+14)
      if(r()<.4){line(c,seams,xx+3,yy+5,xx+5,yy+9);line(c,shine,xx+5,yy+9,xx+12,yy+11)}
    }
    if(g==='grate'){
      box(c,'#1b2937',xx,yy,16,16)
      for(let j=0;j<16;j+=4){box(c,'#4b6671',xx+j,yy,2,16);box(c,'#71919a',xx+j,yy+1,1,14)}
      box(c,'#2c4656',xx,yy+8,16,3);box(c,'#637982',xx,yy+8,16,1);box(c,'#344b5a',xx,yy+15,16,1)
    }
    if(g==='water'){
      for(let i=0;i<5;i++){const rx=Math.floor(r()*10),ry=Math.floor(r()*16);box(c,shade(base,i%2?9:-10),xx+rx,yy+ry,2+Math.floor(r()*4),1)}
      for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]])if(!['water','bridge',undefined].includes(get(x+dx,y+dy))){
        const ex=dx<0?xx:xx+14,ey=dy<0?yy:yy+14
        if(dx) {box(c,'#182e36',ex,yy,2,16);box(c,'#638680',ex+(dx<0?2:-1),yy+(y%2?2:8),1,5)}
        else {box(c,'#182e36',xx,ey,16,2);box(c,'#658477',xx+4,ey+(dy<0?2:-1),8,1)}
      }
      if(m.id!=='capital'&&m.id!=='archive'&&r()<.04){oval(c,'#456347',xx+8,yy+8,5,3);line(c,'#718359',xx+4,yy+7,xx+9,yy+6);box(c,'#ac8896',xx+8,yy+6,2,2)}
    }
    if(g==='bridge'){
      for(let j=0;j<16;j+=4){const plank=shade(base,Math.floor(r()*18)-11);box(c,plank,xx,yy+j,16,3);box(c,shade(plank,17),xx+1,yy+j,14,1);box(c,shade(plank,-30),xx,yy+j+3,16,1);box(c,'#4a4038',xx+4,yy+j+1,1,1);box(c,'#b39767',xx+12,yy+j+2,3,1)}
      if(get(x,y-1)==='water'||get(x,y+1)==='water'){const offset=get(x,y-1)==='water'?0:13;box(c,'#4a3d2d',xx,yy+offset,16,3);box(c,'#9d8055',xx,yy+offset,16,1);box(c,'#c5a67b',xx+2,yy+offset,2,3)}
    }
    if(g==='abyss'&&(m.id==='pass'||m.id==='bellvault')){
      const cold=m.id==='pass',above=get(x,y-1),below=get(x,y+1),left=get(x-1,y),right=get(x+1,y),ledge=(t:Ground|undefined)=>t!==undefined&&t!=='abyss'&&t!=='wall'
      const edge=cold?'#526a77':'#464658',stone=cold?'#304959':'#2e334b',sand=cold?'#a3afb4':'#8c7e8c'
      if(ledge(above)){
        poly(c,edge,[xx,yy,xx+16,yy,xx+16,yy+3+r()*5,xx+12,yy+12,xx+8,yy+8,xx+5,yy+13,xx,yy+6]);box(c,sand,xx+1,yy,14,1)
        for(let i=0;i<3;i++){const lx=xx+3+i*5;line(c,i%2?stone:shade(edge,-12),lx,yy+2,lx+i-2,yy+9+r()*5,2)}
      }
      if(ledge(below)){poly(c,stone,[xx,yy+11,xx+4,yy+10,xx+6,yy+11,xx+10,yy+7,xx+16,yy+11,xx+16,yy+16,xx,yy+16]);box(c,edge,xx+r()*4,yy+14,10,2)}
      if(ledge(left)||ledge(right)){
        const lx=ledge(left)?xx:xx+12;box(c,stone,lx,yy,4,16);line(c,edge,lx+(ledge(left)?0:3),yy,lx+(ledge(left)?2:1),yy+14,1)
      }
      if(r()<.55){box(c,shade(base,8),xx+2+Math.floor(r()*7),yy+3+Math.floor(r()*11),5,1);if(r()<.55)box(c,shade(base,11),xx+1,yy+2,2,1)}
    }
    if(g==='wall'||g==='abyss'&&m.id!=='pass'&&m.id!=='bellvault'){
      const below=get(x,y+1), above=get(x,y-1),left=get(x-1,y),right=get(x+1,y),floor=(v:Ground|undefined)=>v!==undefined&&!['water','abyss','wall'].includes(v)
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
  if(m.id==='capital'||m.id==='archive'||m.id==='bellvault'){
    const [x,y,w,h]=m.id==='capital'?[31,18,71,25]:m.id==='archive'?[29,15,47,24]:[26,20,102,65],px=(x+.5)*16,py=(y+.5)*16
    if(px+w>tx*TILE&&px-w<(tx+cw)*TILE&&py+h>ty*TILE&&py-h<(ty+ch)*TILE){
      const brass=m.id==='bellvault'?'#9c8a77':'#7a9c97',bezel=m.id==='bellvault'?'#726477':'#496473',dark=m.id==='bellvault'?'#4a485e':'#425763'
      oval(c,bezel,px,py,w,h);oval(c,brass,px,py,w-4,h-3);oval(c,dark,px,py,w-6,h-5);oval(c,bezel,px,py,w-13,h-9);oval(c,dark,px,py,w-15,h-11)
      poly(c,bezel,[px-w+16,py,px,py-h+9,px+w-16,py,px,py+h-9]);poly(c,dark,[px-w+22,py,px,py-h+12,px+w-22,py,px,py+h-12])
      const a=h*.58,b=w*.33
      line(c,brass,px-b,py+4,px+b,py+4,2);poly(c,brass,[px-b,py+4,px-b*.61,py,px-b*.34,py-a+7,px,py-a,px+b*.34,py-a+7,px+b*.61,py,px+b,py+4]);poly(c,bezel,[px-b*.85,py+2,px-b*.45,py-2,px-b*.26,py-a+8,px,py-a+3,px+b*.25,py-a+8,px+b*.47,py-2,px+b*.85,py+2]);box(c,brass,px-2,py+8,4,4)
      for(let i=0;i<32;i++){const angle=i*Math.PI/16;box(c,i%4?bezel:brass,px+Math.cos(angle)*(w-10),py+Math.sin(angle)*(h-7),i%4?2:4,i%4?1:2)}
    }
  }
  c.restore();return a
}

export const PROP_SIZE:Record<Decor,[number,number]>={pine:[60,84],oak:[70,71],rock:[42,30],house:[110,104],fence:[21,24],bush:[37,31],lamp:[22,48],well:[45,39],column:[30,54],arch:[88,104],crystal:[36,46],banner:[22,42],crate:[30,24],lily:[18,12],wardhall:[114,126],balcony:[106,110],stall:[59,46],skiff:[72,28],shelf:[57,52],bell:[140,140],organ:[76,108],lift:[53,40]}
export function propTexture(kind:Decor,v:number,region:MapDef['id']) {
  const [w,h]=PROP_SIZE[kind],{a,c}=canvas(w,h),r=random(v*178+kind.charCodeAt(0)*213)
  c.translate(w/2,h-7);const p=PALETTES[region]
  switch(kind){
    case 'pine':{
      const cold=region==='forest'||region==='pass',width=23+(v%3)*2,height=62+(v%3)*4
      const colors=cold?['#182c35','#223e4a','#315565','#447078','#588982']:['#1b3029','#2e492f','#3e5d37','#537443','#749451']
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
    case 'wardhall':case 'balcony':{
      const roof=['#365765','#5e4d66','#3a6570'][v%3], face=['#817260','#766d76','#6d8182'][v%3], edge='#161f2d'
      oval(c,'#11212bc0',0,1,49,7);poly(c,edge,[-43,2,-44,-54,-44,-75,-16,-103,25,-101,44,-73,45,-1]);box(c,shade(face,-25),-41,-66,82,67)
      for(let y=-62;y<0;y+=6)for(let x=-41+(y%5);x<38;x+=9)box(c,shade(face,-23+Math.floor(r()*32)),x,y,8,4)
      poly(c,roof,[-48,-64,-41,-84,-26,-96,-12,-100,23,-98,39,-85,47,-65]);poly(c,shade(roof,19),[-48,-65,-41,-84,-26,-96,-13,-99,-11,-80,-22,-64]);line(c,'#a09383',-48,-64,47,-65,2)
      for(let j=0;j<7;j++)for(let i=-39+j*3;i<39-j*3;i+=7){const y=-67-j*4,x=i+((j%2)*3);box(c,shade(roof,-13+Math.floor(r()*32)),x,y,6,3);box(c,shade(roof,26),x+1,y,4,1)}
      for(const [x,y,k] of [[-28,-51,1],[-3,-53,0],[23,-51,2],[-24,-26,1],[22,-27,2]]){
        poly(c,edge,[x-6,y+12,x-6,y-1,x,y-8,x+6,y-1,x+6,y+12]);poly(c,k%2?'#b77a53':'#d19560',[x-4,y+10,x-4,y-1,x,y-5,x+4,y-1,x+4,y+10]);box(c,'#ecc082',x-3,y+1,2,7);box(c,'#60493f',x,y-3,1,13);box(c,'#665148',x-4,y+4,9,1);box(c,'#393d46',x-8,y+11,16,2)
      }
      box(c,'#292738',-40,-35,80,3);box(c,'#978172',-42,-36,84,1)
      for(let i=-38;i<40;i+=5){box(c,'#282634',i,-41,2,7);box(c,'#767078',i,-41,1,6)}
      box(c,'#483e49',-40,-42,80,2);box(c,'#a38a76',-40,-43,80,1)
      poly(c,'#25313b',[-9,1,-9,-18,-4,-23,6,-23,10,-17,10,1]);box(c,'#705453',-6,-17,12,17);line(c,'#ac7964',-5,-17,-5,-2,1);box(c,'#cca47f',4,-7,2,2)
      for(let i=0;i<3;i++)box(c,i%2?'#5a6668':'#80918e',-11-i*2,-1+i*2,22+i*4,1)
      box(c,'#414151',25,-103,7,19);box(c,'#687171',24,-103,10,3);break
    }
    case 'stall':{
      const cloth=['#986561','#586e75','#887458'][v%3];oval(c,'#182530ad',0,1,26,6)
      box(c,'#453535',-22,-19,3,21);box(c,'#736253',20,-18,3,20);box(c,'#9f8261',20,-17,1,15)
      poly(c,'#2e303c',[-28,-20,-19,-33,16,-35,27,-20,27,-15,-28,-15]);poly(c,cloth,[-27,-21,-18,-32,15,-34,26,-20]);box(c,shade(cloth,-20),-26,-20,52,5)
      for(let x=-24;x<24;x+=8){poly(c,shade(cloth,x%3?19:-11),[x,-21,x+4,-30,x+8,-31,x+4,-21]);box(c,shade(cloth,21),x,-16,4,2)}
      box(c,'#725746',-20,-10,41,12);box(c,'#baa07f',-21,-10,42,2);for(let i=0;i<5;i++)oval(c,i%2?'#d0945e':'#af725f',-16+i*7,-12,3,2);break
    }
    case 'skiff':{
      oval(c,'#3d7b856e',2,1,33,5);poly(c,'#182330',[-34,-7,-24,-15,24,-15,35,-7,25,-2,-22,1]);poly(c,'#71534d',[-32,-7,-22,-13,23,-13,31,-7,23,-4,-22,-2]);poly(c,'#313742',[-26,-8,-19,-12,19,-11,24,-7,17,-5,-18,-4]);
      for(const x of [-13,3,13]){box(c,'#997662',x,-11,3,5);box(c,'#6b5253',x,-6,3,2)}line(c,'#ae9277',-15,-3,16,-5);line(c,'#65514b',v?-29:12,-4,v?-17:24,-20,2);box(c,'#ab7656',v?-20:22,-19,3,2);break
    }
    case 'shelf':{
      oval(c,'#111b2ab6',0,0,26,5);box(c,'#1f2835',-26,-41,51,42);box(c,'#474453',-24,-39,47,36);box(c,'#606064',-25,-40,49,2)
      for(let j=0;j<3;j++){const y=-36+j*12;box(c,'#222b39',-21,y,42,9);for(let i=-19;i<20;){const n=2+Math.floor(r()*3),h=3+Math.floor(r()*5),color=['#85815c','#715266','#456d70','#897b73','#565474'][Math.floor(r()*5)];box(c,color,i,y+9-h,n,h);box(c,shade(color,19),i,y+8-h,n,1);i+=n+1}box(c,'#666b62',-24,y+9,46,2)}
      for(const x of [-24,22]){box(c,'#3e4550',x,-42,4,43);box(c,'#7a736a',x,-41,1,38);box(c,'#9b8871',x-1,-2,5,2)}
      for(let i=0;i<19;i++)box(c,i%3?'#4a685f':'#728676',-23+r()*43,-4-r()*9,3,1);break
    }
    case 'organ':{
      oval(c,'#172530ad',0,1,36,5)
      const stone=v?'#536b70':'#596269'
      for(const sign of [-1,1]){
        c.save();c.scale(sign,1);poly(c,'#202c39',[11,0,10,-51,20,-65,32,-61,34,0]);poly(c,stone,[16,0,16,-50,22,-60,30,-59,31,-3]);
        for(let i=0;i<7;i++)box(c,shade(stone,21-i*3),19,-52+i*7,11,2)
        box(c,'#93a4a1',18,-51,2,43);box(c,'#a38a6d',22,-36,5,4);box(c,'#e8b27b',23,-35,3,2);c.restore()
      }
      poly(c,'#202934',[-14,0,-14,-45,-18,-55,0,-77,18,-55,14,-45,14,0]);poly(c,shade(stone,22),[-16,-55,0,-73,16,-55,13,-52,0,-66,-13,-52]);poly(c,'#344552',[-10,-8,-10,-49,0,-62,10,-49,10,-8]);
      for(let x=-8;x<10;x+=4){box(c,'#242b35',x,-48-((x+12)%8),2,41);box(c,'#7a807c',x,-46,1,32)}
      for(let q=0;q<4;q++)box(c,q%2?'#75818b':'#4a5864',-14-q,-5+2*q,28+q*2,2);box(c,'#b6d7cc',-1,-58,2,4);break
    }
    case 'lift':{
      oval(c,'#111e2a',0,-2,24,7);oval(c,'#809b9b',0,-4,22,6);oval(c,'#334451',0,-5,20,5)
      for(let i=-16;i<=16;i+=4){box(c,'#627d82',i,-7,2,5);box(c,'#a0afb0',i,-7,1,4)}
      box(c,'#665952',-18,-22,3,17);box(c,'#926d5b',-18,-22,1,15);oval(c,'#a88967',-14,-20,4,4);box(c,'#e5b880',-14,-23,2,4);break
    }
    case 'bell':{
      oval(c,'#211f35c0',0,-3,64,9);const bronze='#9b7b59',patina='#4c7270',dark='#292e3b'
      for(const s of [-1,1]){
        c.save();c.scale(s,1);poly(c,dark,[40,0,40,-88,44,-108,54,-107,57,-83,59,1]);poly(c,'#5e5e6c',[43,-2,43,-88,47,-105,53,-102,54,-88,55,-3]);box(c,'#8c827d',43,-87,2,79)
        for(let y=-88;y<-9;y+=11){box(c,'#444953',44,y,12,2);box(c,'#908577',44,y+2,9,1)}
        for(let i=0;i<11;i++){const x=1+i*5,y=-90+Math.sin(i*.22)*12;box(c,'#3f3539',x,y,6,4);box(c,'#a1815d',x,y,4,1)}
        c.restore()
      }
      box(c,'#302c36',-57,-97,114,14);box(c,'#654e41',-55,-96,110,8);box(c,'#a28265',-53,-95,104,2)
      for(const x of [-50,-35,-24,22,34,48]){box(c,'#3f514f',x,-98,4,14);box(c,'#748b81',x,-97,1,11)}
      box(c,'#745743',-6,-93,12,16);box(c,'#a8946e',-5,-88,2,9)
      poly(c,dark,[-12,-83,12,-83,22,-73,26,-45,35,-29,44,-22,44,-13,36,-7,-37,-7,-46,-15,-44,-23,-35,-30,-27,-47,-23,-73]);
      poly(c,bronze,[-11,-81,11,-81,19,-73,23,-48,30,-31,42,-21,40,-16,-42,-16,-43,-21,-34,-30,-27,-47,-23,-72]);
      poly(c,'#695646',[2,-81,12,-80,20,-70,22,-46,29,-32,42,-20,39,-16,10,-16,12,-38,10,-64]);
      poly(c,patina,[-19,-73,-8,-78,-11,-55,-14,-48,-12,-40,-22,-30,-13,-25,-34,-23,-26,-37,-23,-53]);
      for(let i=0;i<97;i++){const y=-74+r()*51, half=17+Math.max(0,y+43)*.49;box(c,['#7b9c85','#bd9a6f','#6a6858','#927b5f','#518384'][i%5],(r()-.5)*2*half,y,1+Math.floor(r()*5),1+(i%9===0?1:0))}
      for(const [y,a] of [[-66,20],[-28,34],[-22,42]]){box(c,'#4e574f',-a,y,a*2,2);box(c,'#b2a380',-a+2,y+2,a*2-4,1)}
      oval(c,'#332c39',0,-15,43,7);oval(c,'#aa8e66',0,-16,40,5);oval(c,'#352f39',0,-15,35,4);box(c,'#907762',-2,-17,4,10);oval(c,'#b8a079',0,-6,4,4)
      for(const x of [-54,-40,38,51]){const y=-(x%3+5);box(c,'#ae8a62',x,y,3,7);box(c,'#ffcb83',x+1,y-3,1,4);box(c,'#fff2b3',x+1,y-2,1,2)}break
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
export function enemyAtlas(id:EnemyId){
  const w=id==='hollow'?100:id==='warden'?86:id==='archiveHusk'?67:id==='siltmaw'||id==='bellwing'?62:id==='guardian'?54:48
  const h=id==='hollow'?94:id==='warden'?88:id==='archiveHusk'?67:id==='guardian'?57:id==='skeleton'?53:id==='bailiff'?50:43,{a,c}=canvas(w*SPRITE_FRAMES,h*2)
  for(let row=0;row<2;row++)for(let f=0;f<SPRITE_FRAMES;f++){
    atlasCell(c,w,h,f,row,()=>{if(row)c.scale(-1,1);drawEnemy(c,id,f)})
  }
  return {a,w,h}
}
function drawEnemy(c:Ink,id:EnemyId,f:number){
  const d=ENEMIES[id],col=d.color,lo=shade(col,-55),mid=shade(col,-27),hi=shade(col,25),dk='#222534',r=random(89083+id.length*19),step=f>0&&f<5?[2,0,-2,0][f-1]:0, pulse=f===2||f===4?2:0, attack=f===5||f===6
  c.save();c.translate(0,f===7?1:0)
  switch(d.kind) {
    case 'slime':{
      const height=attack?25:19+pulse,wet='#385979'
      poly(c,'#192e41',[-19,-1,-17,-8,-12,-10,-11,-height+6,-6,-height,1,-height-2,8,-height+1,13,-height+7,14,-8,19,-5,21,-1,14,2,-12,2]);
      poly(c,wet,[-17,-2,-15,-7,-11,-8,-9,-height+5,-5,-height+1,1,-height,7,-height+1,11,-height+7,12,-8,17,-4,18,-1,13,0,-12,0]);
      poly(c,mid,[-13,-6,-9,-height+7,-5,-height+2,1,-height+1,7,-height+2,10,-height+8,10,-7,6,-3,-7,-4]);
      poly(c,col,[-9,-height+7,-5,-height+3,0,-height+2,7,-height+3,9,-height+6,3,-height+5,-3,-height+7,-6,-height+10]);line(c,hi,-6,-height+7,-1,-height+4,2);box(c,'#d1f4dc',0,-height+4,3,1);
      box(c,dk,-4,-height+10,3,4);box(c,dk,5,-height+10,3,4);box(c,'#f4e6bd',-4,-height+10,1,2);box(c,'#f4e6bd',6,-height+10,1,2);
      poly(c,'#786593',[0,-height+13,4,-height+16,1,-height+19,-3,-height+16]);box(c,'#dec0e8',0,-height+15,2,1);line(c,col,-14,-3,-8,-2,2);line(c,mid,9,-3,16,-1);for(let i=0;i<6;i++)box(c,i%2?hi:mid,-13+r()*27,-4+r()*3,1,1);break
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
    case 'siltmaw':{
      const yaw=attack?9:0,tail=f%2?3:-2
      poly(c,'#182a30',[-30,-6,-25,-18+tail,-17,-14,-10,-22,4,-24,13,-21,17,-17,25,-15,29,-10,28,-3,20,0,8,-3,-3,-1,-12,-5,-21,-3,-29,-2]);
      poly(c,'#4f7166',[-28,-7,-24,-16+tail,-18,-12,-9,-20,3,-22,12,-19,16,-15,24,-14,27,-9,25,-5,18,-4,10,-5,-2,-3,-10,-7,-22,-5]);
      for(let i=0;i<14;i++){
        const x=-18+i*2.45,y=-17-Math.sin(i*.246)*5
        poly(c,i%2?'#8ca882':'#b3bc88',[x-2,y+1,x,y-5-(i%3),x+3,y,x+1,y+3]);box(c,'#3f5e56',x-1,y+2,3,2)
      }
      for(const [x,y] of [[-13,-9],[0,-5],[9,-8]]){line(c,'#243a40',x,y,x+step+4,y+7,4);line(c,lo,x+1,y+1,x+step+4,y+7,2);box(c,'#b7ab85',x+step+6,y+7,2,1)}
      poly(c,'#273b3d',[10,-14,17,-19,25,-17,27,-9,28,-4+yaw,24,-2+yaw,13,-6]);poly(c,'#78896f',[11,-13,17,-17,24,-15,25,-9,24,-6+yaw,15,-7]);poly(c,'#372d3a',[14,-6,26,-8,25,-2+yaw,20,-1+yaw,15,-4]);
      for(let i=0;i<4;i++)box(c,'#d9c6a0',16+i*2,-6+(i%2),1,2+(attack?2:0));box(c,'#f3d17b',20,-14,4,2);box(c,'#352d3c',22,-14,1,2);box(c,'#e5f0a7',19,-14,1,1)
      break
    }
    case 'bellwing':{
      const y=-18-pulse, flap=attack?-6:step*3, pd=attack?'#f6d7c6':'#cbb7e4'
      for(const side of [-1,1]){
        c.save();c.scale(side,1);poly(c,'#2e2944',[0,y+1,7,y-13,20,y-17+flap,30,y-11+flap,27,y+8,22,y+3,19,y+11,13,y+4,10,y+8,6,y+3]);
        poly(c,'#685b8f',[4,y,9,y-12,20,y-15+flap,28,y-10+flap,26,y+5,21,y,18,y+8,13,y+2,9,y+5]);
        poly(c,'#9c8bb7',[5,y,11,y-11,21,y-14+flap,25,y-9+flap,17,y-7,12,y+2]);
        for(let i=0;i<5;i++){const x=10+i*3,y2=y+6-i*2;line(c,'#c7b9d9',7,y-3,x,y2-6+flap*.38);box(c,'#5a4872',x,y2+1,2,2)}
        box(c,'#ead3ce',18,y-10+flap,4,1);c.restore()
      }
      poly(c,'#332f48',[-4,y-9,5,y-9,7,y-2,10,y+7,6,y+10,-6,y+10,-9,y+6,-6,y-1]);poly(c,'#ac8a72',[-3,y-7,3,y-7,5,y-1,8,y+6,5,y+8,-6,y+8,-7,y+5]);
      line(c,'#efd0a6',-6,y+5,6,y+5,1);box(c,pd,0,y-6,2,12);box(c,pd,0,y+10,3,2);if(attack){box(c,'#fff3cf',-1,y+1,4,2);box(c,'#fff2d4',0,y+15,1,2)}break
    }
    case 'bailiff':{
      const y=-pulse;poly(c,'#282735',[-9,-26,-14,-12,-9,-1,-5,-5,7,-1,13,-14,8,-31]);poly(c,'#764c4f',[-8,-23,-11,-13,-9,-3,3,-6,10,-3,11,-14,6,-25]);
      for(const [x,z] of [[-6,step],[5,-step]]){box(c,'#242936',x+z,-10,6,11);box(c,'#7d6b61',x+z+1,-10,4,8);box(c,'#987c62',x+z,-2,6,2)}
      poly(c,'#3d3438',[-10,-27,-7,-33,7,-32,12,-25,8,-11,-6,-11,-10,-18]);poly(c,'#99785e',[-8,-27,-5,-30,6,-30,9,-24,6,-13,-5,-13]);box(c,'#c6a381',-6,-26,11,3);box(c,'#755754',-4,-20,7,7)
      poly(c,'#3b333e',[-10,y-35,-8,y-44,6,y-45,10,y-38,9,y-31,-6,y-31]);poly(c,'#98846f',[-8,y-35,-6,y-42,5,y-43,8,y-39,8,y-32,-5,y-33]);box(c,'#493b42',-7,y-37,14,3);box(c,'#efc58f',0,y-36,6,1);box(c,'#d29b72',-5,y-41,4,2)
      const x=attack?3:-13, sy=attack?-25:-19
      poly(c,'#322c35',[x-8,sy-3,x,sy-7,x+8,sy-3,x+8,sy+7,x,sy+14,x-8,sy+7]);poly(c,'#c19773',[x-6,sy-2,x,sy-5,x+6,sy-2,x+6,sy+6,x,sy+12,x-6,sy+6]);poly(c,'#725556',[x-4,sy-1,x,sy-4,x+4,sy-1,x+4,sy+5,x,sy+9,x-4,sy+5]);box(c,'#e9c296',x-1,sy,2,8);box(c,'#e9c296',x-3,sy+2,6,2)
      line(c,'#242b39',9,-13,attack?22:16,attack?-35:-6,4);line(c,'#b8a690',10,-13,attack?22:16,attack?-35:-6,2);break
    }
    case 'archiveHusk':{
      const y=-pulse, sw=attack?5:0, edge='#182832',cloth='#344e5c';c.translate(0,y)
      poly(c,edge,[-15,-47,-7,-58,5,-58,15,-44,16,-28,23,-5,15,0,8,-5,1,0,-7,-4,-15,1,-22,-3,-17,-20]);
      poly(c,cloth,[-13,-45,-6,-56,3,-56,12,-45,14,-28,21,-5,15,-3,7,-8,1,-3,-8,-7,-14,-2,-19,-4,-15,-23]);
      for(let i=0;i<10;i++){const x=-15+i*3;line(c,i%3?'#567384':'#203742',x*.62,-45,x*(1.13+(i%2)*.12),-7+i%4,2)}
      for(let i=0;i<8;i++){const x=-17+r()*30,y=-37+r()*29;poly(c,i%2?'#b4a98f':'#7e9c98',[x,y,x+6,y-2,x+6,y+4,x+1,y+6]);box(c,'#59646b',x+1,y+1,4,1)}
      poly(c,'#26353f',[-12,-44,-9,-59,-1,-63,5,-61,11,-53,11,-46,5,-40,-3,-40]);poly(c,'#70999a',[-8,-50,-7,-59,0,-61,6,-56,9,-48,5,-45,-1,-46,-4,-43,-8,-46]);poly(c,'#1b3039',[-5,-52,1,-56,7,-49,4,-44,-4,-44]);box(c,'#d0e9d0',0,-50,4,2);box(c,'#9ce5cd',3,-47,2,1)
      line(c,edge,9,-41,23+sw,-26,8);line(c,'#628687',11,-42,23+sw,-26,4);line(c,'#402e33',20,-6,25+sw,-53,4);line(c,'#9b8f73',21,-6,26+sw,-55,2);poly(c,'#767f7c',[25+sw,-55,17+sw,-61,12+sw,-58,19+sw,-54,24+sw,-51]);
      oval(c,'#c8ddb983',-17,-25,5,5);box(c,'#badbb7',-18,-27,3,4);box(c,'#e4f0bd',-17,-26,2,2);break
    }
    case 'hollow':{
      const y=-pulse, sw=attack?5:0, edge='#251d2e',iron='#625a75',rim='#ccac89',rust='#99616e',glow=attack?'#ffdcac':'#f1b6cd';c.translate(0,y)
      poly(c,edge,[-19,-64,-27,-41,-31,-4,-21,1,-11,-3,-4,0,5,-4,16,2,29,-4,27,-45,16,-63]);poly(c,'#4c384b',[-20,-58,-24,-41,-28,-6,-21,-2,-10,-7,-3,-3,9,-8,18,-2,26,-6,24,-41,15,-60]);
      for(let i=0;i<11;i++){const x=-21+i*4;line(c,i%2?'#744b59':'#373345',x*.68,-54,x,-9+i%4,2)}
      for(const [x,z] of [[-14,step],[9,-step]]){
        poly(c,edge,[x-7,-27,x+8,-28,x+8+z,-7,x+12+z,-1,x-9+z,1]);poly(c,iron,[x-5,-25,x+6,-25,x+6+z,-7,x+9+z,-2,x-7+z,-1]);line(c,rim,x-3,-20,x-1+z,-7,2);box(c,'#554952',x-6+z,-5,15,3);box(c,'#ac9074',x+z,-5,6,1)
      }
      poly(c,edge,[-18,-62,-12,-71,10,-71,20,-60,23,-46,14,-24,6,-16,-7,-18,-18,-29,-23,-50]);poly(c,iron,[-17,-62,-9,-68,9,-68,17,-59,18,-47,12,-26,5,-20,-7,-22,-15,-31,-19,-48]);
      poly(c,'#a48a80',[-11,-62,0,-65,13,-60,15,-48,10,-44,0,-39,-11,-43,-15,-51]);poly(c,'#594e63',[-9,-61,1,-63,10,-59,11,-49,7,-47,0,-43,-9,-46,-12,-51]);
      for(let i=0;i<5;i++){const sy=-41+i*4,x=11-i;line(c,i%2?rust:rim,-x,sy,x,sy,2);box(c,'#5d4a55',-4,sy+2,7,1)}
      poly(c,'#3d303f',[0,-57,7,-51,0,-42,-7,-51]);poly(c,glow,[0,-55,4,-51,0,-46,-4,-51]);box(c,'#fff0cc',0,-53,1,4);line(c,attack?'#e6afbf':'#a880a1',-8,-53,-13,-57,1);line(c,attack?'#e6afbf':'#a880a1',6,-54,11,-58,1)
      for(const side of [-1,1]){
        c.save();c.scale(side,1);const sh=side>0?sw:0
        poly(c,edge,[13,-59,20,-69,27,-67,35+sh,-58,33+sh,-42,29+sh,-32,29+sh,-26,23+sh,-22,18+sh,-30,21+sh,-45,14,-47]);
        poly(c,side>0?iron:rust,[15,-57,21,-65,27,-63,31+sh,-56,29+sh,-42,26+sh,-32,26+sh,-26,22+sh,-27,21+sh,-32,25+sh,-46,16,-49]);
        poly(c,edge,[18,-65,23,-74,28,-77,26,-68,31,-64,28,-61]);poly(c,rim,[21,-66,27,-75,26,-68,29,-63,25,-65]);line(c,rim,17,-57,25,-63,2);line(c,'#c49789',23,-54,31+sh,-53,2);line(c,'#453f4b',24+sh,-45,28+sh,-40,2);box(c,'#c1a28a',24+sh,-36,3,2);c.restore()
      }
      line(c,'#292630',28+sw,-28,attack?42:45,attack?-50:-6,6);line(c,'#806653',29+sw,-28,attack?43:45,attack?-50:-6,4);line(c,rim,30+sw,-28,attack?44:46,attack?-49:-7,1);poly(c,'#3e3c49',[29+sw,-30,20+sw,-26,23+sw,-23,38+sw,-30,35+sw,-34]);
      poly(c,edge,[-13,-67,-11,-76,-8,-82,-4,-84,-5,-90,3,-91,9,-84,13,-76,14,-68,9,-60,-8,-60]);poly(c,iron,[-11,-68,-9,-76,-6,-81,0,-84,7,-81,11,-75,11,-66,7,-62,-7,-63]);poly(c,rim,[-9,-75,-6,-79,0,-82,5,-80,8,-76,4,-78,-1,-79,-5,-76]);
      poly(c,'#3f303d',[-10,-71,-3,-72,3,-70,9,-73,10,-69,5,-65,-3,-66,-10,-67]);box(c,glow,-7,-70,4,1);box(c,glow,5,-70,4,1);line(c,rim,1,-74,2,-65,1);box(c,'#c2a188',-7,-63,11,1)
      for(let i=0;i<(attack?13:5);i++){const x=(r()-.5)*69,y=-82+r()*77;box(c,i%3?'#b88d8566':'#ffd1a3a0',x,y,1,i%3===0?2:1)}break
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
    case 'guardian':{
      const basal='#222735',stone='#586577',lit='#899fb0',split='#3f5262',vein=attack?'#d4fbef':'#86d5d7'
      for(const [x,d] of [[-8,step],[6,-step]]){poly(c,basal,[x-5,-19,x+5,-19,x+5+d,-7,x+9+d,-2,x+8+d,1,x-7+d,1]);poly(c,stone,[x-3,-17,x+4,-16,x+4+d,-6,x+7+d,-2,x-5+d,-1]);line(c,lit,x-2,-15,x-1+d,-7,2);line(c,split,x-4+d,-5,x+5+d,-4,2)}
      poly(c,basal,[-11,-37,-4,-43,9,-40,17,-34,15,-18,6,-11,-6,-13,-13,-21]);poly(c,stone,[-9,-36,-3,-41,8,-38,14,-34,12,-19,5,-14,-5,-15,-11,-22]);poly(c,lit,[-8,-32,-4,-38,7,-36,11,-33,6,-30,-4,-29]);poly(c,split,[-8,-23,-2,-25,8,-21,5,-15,-5,-16]);
      poly(c,basal,[-3,-26,2,-32,8,-28,8,-23,3,-19,-2,-23]);poly(c,vein,[-2,-26,2,-30,6,-27,6,-24,2,-21]);box(c,'#e1f5e5',1,-27,2,2);
      for(const side of [-1,1]){c.save();c.scale(side,1);const y=attack&&side>0?-5:0
        poly(c,basal,[8,-34,12,-42,20,-41,25,-35,24,-21+y,24,-13+y,21,-7+y,14,-8+y,12,-15+y,14,-22+y,10,-28]);poly(c,stone,[10,-33,13,-40,19,-39,23,-34,22,-22+y,22,-14+y,20,-9+y,15,-10+y,14,-15+y,16,-23+y,12,-28]);
        poly(c,lit,[11,-35,14,-39,19,-38,21,-34,17,-31,12,-31]);line(c,split,16,-29,22,-24+y,2);line(c,vein,18,-25+y,15,-21+y);line(c,vein,15,-21+y,18,-16+y);box(c,lit,15,-12+y,5,2);c.restore()}
      poly(c,basal,[-10,-37,-10,-44,-6,-50,3,-52,10,-48,12,-42,8,-36,-5,-35]);poly(c,stone,[-8,-38,-8,-44,-5,-49,2,-50,8,-47,9,-42,7,-38,-4,-37]);line(c,lit,-5,-47,3,-48,2);box(c,basal,-6,-43,13,3);box(c,vein,-5,-42,4,1);box(c,vein,4,-42,3,1);line(c,split,1,-46,0,-37,2);break
    }
    case 'skeleton':{
      const bone='#b8b094',high='#e3d6b1',old='#756654',rust='#9c604f'
      for(const [x,d] of [[-5,-step],[6,step]]){line(c,dk,x,-19,x+d,-9,4);line(c,bone,x,-18,x+d,-8,2);line(c,dk,x+d,-10,x+d-2,0,4);line(c,bone,x+d,-9,x+d-2,-1,2);box(c,high,x+d-1,-9,3,1);box(c,bone,x+d-3,-2,6,2)}
      line(c,dk,1,-31,0,-12,6);line(c,old,1,-30,0,-12,4);
      for(let k=0;k<4;k++){poly(c,dk,[-8+k,-31+k*4,-4,-27+k*4,5,-28+k*4,9-k,-32+k*4,10-k,-28+k*4,5,-24+k*4,-5,-23+k*4,-9+k,-26+k*4]);line(c,bone,-6+k,-29+k*4,-2,-26+k*4,2);line(c,high,-1,-26+k*4,6-k,-29+k*4,2)}
      line(c,rust,-6,-15,6,-14,3);box(c,'#cb9e75',-2,-15,4,1)
      for(const x of [-10,10]){line(c,dk,x,-30,x+(attack?4:1),-19,5);line(c,bone,x,-29,x+(attack?4:1),-19,2);line(c,old,x+(attack?4:1),-19,x+(attack?8:3),-15,2);box(c,high,x-1,-22,3,2)}
      line(c,dk,11,-17,attack?23:17,attack?-34:-3,4);line(c,'#9d8c8d',12,-17,attack?23:17,attack?-34:-3,2);line(c,rust,9,-14,15,-19,2)
      poly(c,dk,[-10,-36,-10,-44,-5,-48,4,-48,9,-45,10,-39,6,-35,6,-29,1,-28,-5,-30,-5,-34]);poly(c,bone,[-8,-36,-8,-43,-4,-47,3,-47,7,-44,8,-39,4,-35,4,-30,-2,-30,-4,-33,-4,-35]);
      line(c,high,-6,-43,-3,-46,2);box(c,'#332c37',-5,-40,4,3);box(c,'#332c37',3,-40,4,3);box(c,'#e6a8bd',-3,-39,2,1);box(c,'#e6a8bd',4,-39,2,1);box(c,old,0,-36,2,2);for(const x of [-3,0,3])box(c,high,x,-33,2,3);break
    }
    default:{
      const head=id==='goblin'?'#a7bb7b':'#c58a6c',body=id==='goblin'?'#7e7554':'#865551',y=id==='goblin'?3:0
      for(const [x,z] of [[-5,-step],[5,step]]){box(c,dk,x-2+z,-11,5,12);box(c,lo,x-1+z,-10,2,8);box(c,'#745c4e',x-2+z,-3,5,2)}
      poly(c,dk,[-10,-26+y,-6,-29+y,6,-29+y,11,-24+y,11,-14,7,-8,-3,-8,-8,-10]);poly(c,body,[-8,-25+y,-5,-28+y,5,-27+y,8,-22+y,8,-15,5,-10,-6,-11,-7,-15]);
      line(c,hi,-6,-26+y,5,-14,2);box(c,'#c59362',-2,-15,3,2);box(c,dk,8,-25+y,5,15);box(c,head,9,-23+y,3,11);line(c,'#887051',10,-13,17,-6,2);line(c,'#c1ad88',13,-11,attack?22:18,attack?-26:-6,2)
      poly(c,dk,[-8,-29+y,-9,-37+y,-4,-41+y,4,-41+y,9,-36+y,10,-30+y,5,-25+y,-3,-25+y]);poly(c,head,[-6,-30+y,-7,-36+y,-4,-39+y,4,-39+y,7,-35+y,8,-30+y,4,-26+y,-2,-27+y]);box(c,'#e7c590',-3,-35+y,7,1);box(c,'#333038',-4,-35+y,2,2);box(c,'#333038',4,-35+y,2,2);box(c,shade(head,-31),0,-29+y,5,1)
      if(id==='goblin'){poly(c,lo,[-5,-32+y,-14,-39+y,-11,-31+y,-5,-29+y]);poly(c,head,[-6,-32+y,-11,-36+y,-10,-32+y]);poly(c,head,[5,-34+y,14,-39+y,11,-32+y,5,-30+y]);box(c,'#efe1b1',5,-29+y,1,3)}
      if(id==='bandit'){poly(c,'#564b53',[-8,-34,-8,-39,-3,-42,3,-42,8,-38,8,-34,5,-34,2,-37,-4,-36]);box(c,'#754751',-6,-32,13,4)}
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
    case 'echo':{
      oval(c,'#49938a68',0,0,11,4);poly(c,'#50465f',[-8,0,-8,-5,-3,-11,3,-11,8,-5,8,0,0,3]);poly(c,'#a9a7bd',[0,-18,5,-12,3,-8,-3,-8,-5,-12]);poly(c,'#dcc7d5',[0,-16,3,-12,0,-9,-3,-12]);box(c,'#f7e7d1',0,-14,1,3);break
    }
    case 'wheel':{
      oval(c,'#122734a1',0,1,12,4);box(c,'#485456',-4,-16,8,17);box(c,'#829492',-4,-16,2,16);oval(c,'#343746',0,-16,12,11);oval(c,variant?'#a2c8b8':'#aa8060',0,-16,10,9);oval(c,'#2b3d4a',0,-16,7,6);line(c,'#bb9b79',-6,-16,6,-16,2);line(c,'#bb9b79',0,-22,0,-10,2);box(c,'#e3c59a',-1,-17,3,3);break
    }
    case 'plaque':case 'altar':{
      oval(c,'#202834b1',0,1,14,4);poly(c,'#374957',[-13,1,-12,-8,-10,-11,-9,-20,9,-20,12,-9,12,-5,13,1]);poly(c,'#ae9692',[-11,-9,-7,-18,8,-18,11,-9]);box(c,'#586b76',-10,-7,21,4);box(c,'#87928f',-10,-7,21,1);box(c,'#435460',-10,-3,20,3)
      for(let i=0;i<3;i++)box(c,'#554950',-6+i,-16+2*i,10-i*2,1);if(type==='altar'){box(c,'#c48e6b',0,-24,2,5);box(c,'#ffd2a1',0,-25,1,2)}break
    }
    case 'clapper':line(c,'#725545',-5,0,7,-18,4);line(c,'#b5947c',-5,0,7,-18,2);oval(c,'#bd926d',-4,-3,6,4);box(c,'#e3bd8e',-7,-6,6,2);break
    case 'scroll':box(c,'#5b4537',-7,-8,14,9);box(c,'#c9ad7e',-6,-9,13,7);box(c,'#e2c28f',-5,-9,2,7);box(c,'#9e5a56',2,-7,4,3);break
    case 'coin':oval(c,'#87633c',0,-2,7,4);oval(c,'#d8a956',0,-4,6,3);box(c,'#f5d47e',-4,-5,6,1);box(c,'#f9e5a1',0,-6,2,3);break
    default:poly(c,'#caa46c',[0,-18,6,-10,0,-2,-6,-10]);poly(c,'#f5df9c',[0,-16,3,-10,0,-5,-3,-10]);box(c,'#fff3cf',0,-13,1,6)
  }
  return a
}
