import { TILE, tileBlocked, type MapDef } from '../data/maps'
import type { Point } from './types'
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y)
export const vector=(x:number,y:number)=>{ const l=Math.hypot(x,y); return l>.0001?{x:x/l,y:y/l}:{x:0,y:0} }
export function open(map:MapDef,x:number,y:number,gate:boolean,r=0) {
  const minX=Math.floor((x-r)/TILE), maxX=Math.floor((x+r)/TILE), minY=Math.floor((y-r)/TILE), maxY=Math.floor((y+r)/TILE)
  for(let j=minY;j<=maxY;j++)for(let i=minX;i<=maxX;i++)if(tileBlocked(map,i,j,gate))return false
  return true
}
function ray(map:MapDef,ax:number,ay:number,bx:number,by:number,gate:boolean) {
  let x=Math.floor(ax/TILE),y=Math.floor(ay/TILE)
  const endX=Math.floor(bx/TILE),endY=Math.floor(by/TILE),dx=bx-ax,dy=by-ay,sx=Math.sign(dx),sy=Math.sign(dy)
  const strideX=dx ? TILE/Math.abs(dx) : Infinity,strideY=dy ? TILE/Math.abs(dy) : Infinity
  let crossX=dx ? ((x+(sx>0?1:0))*TILE-ax)/dx : Infinity,crossY=dy ? ((y+(sy>0?1:0))*TILE-ay)/dy : Infinity
  if(tileBlocked(map,x,y,gate))return false
  while(x!==endX||y!==endY) {
    if(x!==endX&&y!==endY&&Math.abs(crossX-crossY)<1e-8){
      if(tileBlocked(map,x+sx,y,gate)||tileBlocked(map,x,y+sy,gate))return false
      x+=sx;y+=sy;crossX+=strideX;crossY+=strideY
    }else if(y===endY||x!==endX&&crossX<crossY){x+=sx;crossX+=strideX}
    else {y+=sy;crossY+=strideY}
    if(tileBlocked(map,x,y,gate))return false
  }
  return true
}
export function sight(map:MapDef,a:Point,b:Point,gate:boolean,r=0) {
  if(!ray(map,a.x,a.y,b.x,b.y,gate))return false
  if(r)for(const x of [-r,r])for(const y of [-r,r])if(!ray(map,a.x+x,a.y+y,b.x+x,b.y+y,gate))return false
  return true
}
export function slide(map:MapDef,a:Point,dx:number,dy:number,gate:boolean,r=5) {
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4))
  for(let i=0;i<steps;i++) {
    const x=a.x+dx/steps,y=a.y+dy/steps
    if(open(map,x,a.y,gate,r))a.x=x
    if(open(map,a.x,y,gate,r))a.y=y
  }
}
export function safePoint(map:MapDef,p:Point,gate:boolean,r=5) {
  if(open(map,p.x,p.y,gate,r))return {x:p.x,y:p.y}
  const bx=Math.max(1,Math.min(map.w-2,Math.floor(p.x/TILE))),by=Math.max(1,Math.min(map.h-2,Math.floor(p.y/TILE)))
  for(let rad=0;rad<Math.max(map.w,map.h);rad++)for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++)if(Math.abs(dx)===rad||Math.abs(dy)===rad){
    const x=(bx+dx+.5)*TILE,y=(by+dy+.5)*TILE;if(open(map,x,y,gate,r))return {x,y}
  }
  return {x:p.x,y:p.y}
}
// Four-neighbour A*: corners never cut through walls. Limit expansion for frequent AI calls.
export function pathfind(map:MapDef,start:Point,end:Point,gate:boolean,limit=1800):Point[] {
  end=safePoint(map,end,gate,5)
  if(sight(map,start,end,gate,5))return [end]
  const sx=Math.floor(start.x/TILE),sy=Math.floor(start.y/TILE),tx=Math.floor(end.x/TILE),ty=Math.floor(end.y/TILE)
  const initial=sy*map.w+sx, dest=ty*map.w+tx
  type Node={i:number;f:number;g:number}
  const heap:Node[]=[]
  const put=(node:Node)=>{let i=heap.length;heap.push(node);while(i){const p=(i-1)>>1;if(heap[p].f<=node.f)break;heap[i]=heap[p];i=p}heap[i]=node}
  const pop=()=>{const top=heap[0],last=heap.pop()!;if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(last.f<=heap[c].f)break;heap[i]=heap[c];i=c}heap[i]=last}return top}
  const scores=new Map([[initial,0]]), parents=new Map<number,number>();put({i:initial,f:0,g:0})
  while(heap.length&&limit-- >0){const {i,g}=pop();if(g!==scores.get(i))continue
    if(i===dest){const result=[end];let n=dest;while(n!==initial){result.push({x:(n%map.w+.5)*TILE,y:(Math.floor(n/map.w)+.5)*TILE});n=parents.get(n)!}return result.reverse()}
    const x=i%map.w,y=Math.floor(i/map.w)
    for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=x+dx,ny=y+dy;if(tileBlocked(map,nx,ny,gate))continue;const n=ny*map.w+nx;if(g+1>=(scores.get(n)??Infinity))continue
      scores.set(n,g+1);parents.set(n,i);put({i:n,g:g+1,f:g+1+Math.abs(nx-tx)+Math.abs(ny-ty)})
    }
  }
  return []
}
