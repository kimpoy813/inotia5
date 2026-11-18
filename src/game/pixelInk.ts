export type Ink=CanvasRenderingContext2D
export const box=(c:Ink,color:string,x:number,y:number,w:number,h:number)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
export function poly(c:Ink,color:string,pts:number[]) {
  c.fillStyle=color;let y0=99999,y1=-99999
  for(let i=1;i<pts.length;i+=2){y0=Math.min(y0,pts[i]);y1=Math.max(y1,pts[i])}
  for(let y=Math.ceil(y0);y<y1;y++){
    const ends:number[]=[]
    for(let i=0,j=pts.length-2;i<pts.length;j=i,i+=2){const ya=pts[i+1],yb=pts[j+1];if((ya<=y+.5&&yb>y+.5)||(yb<=y+.5&&ya>y+.5))ends.push(pts[i]+(y+.5-ya)*(pts[j]-pts[i])/(yb-ya))}
    ends.sort((a,b)=>a-b);for(let i=0;i<ends.length-1;i+=2){const left=Math.round(ends[i]),right=Math.round(ends[i+1]);if(right>left)c.fillRect(left,y,right-left,1)}
  }
}
export function line(c:Ink,color:string,x:number,y:number,tx:number,ty:number,width=1) {
  const n=Math.max(Math.abs(x-tx),Math.abs(y-ty),1)
  for(let i=0;i<=n;i++)box(c,color,x+(tx-x)*i/n,y+(ty-y)*i/n,width,width)
}
export function oval(c:Ink,color:string,x:number,y:number,rx:number,ry:number) {
  if(ry<=0){box(c,color,x-rx,y,rx*2+1,1);return}
  for(let j=-Math.floor(ry);j<=ry;j++){const w=Math.floor(rx*Math.sqrt(Math.max(0,1-j*j/(ry*ry))));box(c,color,x-w,y+j,w*2+1,1)}
}
export function shade(hex:string,n:number) {
  const h=parseInt(hex.slice(1),16),v=[h>>16&255,h>>8&255,h&255].map(v=>Math.max(0,Math.min(255,v+n)).toString(16).padStart(2,'0'))
  return '#'+v.join('')
}
export const canvas = (w:number,h:number)=>{const a=document.createElement('canvas');a.width=w;a.height=h;const c=a.getContext('2d')!;c.imageSmoothingEnabled=false;return {a,c}}

// Animation atlases share a foot anchor; keep extreme poses out of their neighbors.
export const SPRITE_FRAMES=9, FOOT_PAD=3
export function atlasCell(c:Ink,w:number,h:number,col:number,row:number,draw:()=>void){
  c.save();c.beginPath();c.rect(col*w,row*h,w,h);c.clip()
  c.translate(col*w+w/2,row*h+h-FOOT_PAD);draw();c.restore()
}
