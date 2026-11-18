import { defaultSettings } from './progression'
import type { Settings } from './types'
export type Theme='title'|'village'|'road'|'forest'|'spire'|'combat'|'boss'|'story'|'victory'|'defeat'|'capital'|'archive'|'bellvault'|'lastwatch'
type Tune={beat:number; wave:OscillatorType; melody:number[]; roots:number[]}
const TUNES:Record<Theme,Tune>={
  title:{beat:.47,wave:'sine',melody:[67,0,62,64,65,0,62,0,69,0,67,62,57,0,0,0],roots:[38,46,41,43]},
  village:{beat:.43,wave:'triangle',melody:[64,0,67,69,71,0,67,0,62,0,64,67,64,0,62,0],roots:[48,43,45,43]},
  road:{beat:.45,wave:'sine',melody:[62,65,0,67,0,65,62,0,60,62,0,57,0,60,0,0],roots:[38,41,45,38]},
  forest:{beat:.51,wave:'sine',melody:[69,0,0,64,0,65,0,60,67,0,62,0,57,0,0,0],roots:[45,41,36,43]},
  spire:{beat:.60,wave:'sine',melody:[60,0,61,0,0,56,0,0,65,0,61,0,58,0,53,0],roots:[41,42,37,39]},
  capital:{beat:.48,wave:'sine',melody:[68,0,64,61,0,57,0,0,68,69,64,0,62,0,59,0],roots:[45,41,38,40]},
  archive:{beat:.61,wave:'sine',melody:[60,0,63,0,0,58,0,0,56,0,0,62,0,57,0,0],roots:[36,32,34,35]},
  bellvault:{beat:.67,wave:'triangle',melody:[62,0,0,57,0,0,53,0,61,0,57,0,0,52,0,0],roots:[38,34,33,36]},
  lastwatch:{beat:.32,wave:'triangle',melody:[50,57,62,0,57,58,53,0,56,56,61,65,0,62,53,0],roots:[26,34,29,33]},
  combat:{beat:.24,wave:'triangle',melody:[57,57,62,0,65,62,0,60,55,55,58,0,62,58,0,57],roots:[38,41,43,45]},
  boss:{beat:.30,wave:'triangle',melody:[53,0,53,60,0,58,56,0,54,0,53,63,0,61,56,0],roots:[29,32,30,25]},
  story:{beat:.55,wave:'sine',melody:[64,0,67,0,71,0,69,0,62,0,64,0,67,0,0,0],roots:[45,48,41,43]},
  victory:{beat:.31,wave:'triangle',melody:[60,64,67,72,0,71,69,67,0,64,67,0,72,0,0,0],roots:[36,43,45,48]},
  defeat:{beat:.50,wave:'sine',melody:[65,64,60,0,57,0,0,0,53,0,0,0,0,0,0,0],roots:[41,40,36,33]},
}
const hz=(n:number)=>440*2**((n-69)/12)
class VeilAudio {
  settings:Settings={...defaultSettings}
  ctx?:AudioContext
  master?:GainNode
  music?:GainNode
  effects?:GainNode
  theme:Theme='title'
  step=0
  next=0
  clock=0
  hidden=false
  unlock() {
    if(this.settings.mute||this.hidden)return
    try{
      if(!this.ctx){
        this.ctx=new AudioContext();this.master=this.ctx.createGain();this.music=this.ctx.createGain();this.effects=this.ctx.createGain()
        this.music.connect(this.master);this.effects.connect(this.master);this.master.connect(this.ctx.destination)
        this.next=this.ctx.currentTime+.04
        this.clock=window.setInterval(()=>this.schedule(),90)
      }
      if(this.ctx.state!=='running')void this.ctx.resume().catch(()=>{})
      this.set(this.settings)
    }catch{/* Game remains playable without audio. */}
  }
  set(s:Settings){this.settings=s
    if(this.ctx&&this.master&&this.music&&this.effects){const t=this.ctx.currentTime;this.master.gain.setTargetAtTime(s.mute||this.hidden?0:s.master,t,.035);this.music.gain.setTargetAtTime(s.music,t,.035);this.effects.gain.setTargetAtTime(s.effects,t,.035)}
  }
  use(theme:Theme){if(theme===this.theme)return;this.theme=theme;this.step=0;if(this.ctx)this.next=this.ctx.currentTime+.08}
  visibility(hidden:boolean){this.hidden=hidden;this.set(this.settings);if(hidden&&this.ctx?.state==='running')void this.ctx.suspend().catch(()=>{});else if(!hidden&&this.ctx&&!this.settings.mute)void this.ctx.resume().catch(()=>{})}
  private tone(dest:GainNode,start:number,freq:number,length:number,vol:number,shape:OscillatorType,fall=1) {
    if(!this.ctx||!freq)return
    const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=shape;osc.frequency.setValueAtTime(freq,start)
    if(fall!==1)osc.frequency.exponentialRampToValueAtTime(Math.max(26,freq*fall),start+length)
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.001,vol),start+Math.min(.035,length*.25));gain.gain.exponentialRampToValueAtTime(.0001,start+length)
    gain.connect(dest);osc.connect(gain);osc.start(start);osc.stop(start+length+.01)
    osc.onended=()=>{osc.disconnect();gain.disconnect()}
  }
  private schedule(){
    const ctx=this.ctx,dest=this.music;if(!ctx||!dest||ctx.state!=='running'||this.settings.mute||this.hidden||!this.settings.music)return
    const tune=TUNES[this.theme];if(this.next<ctx.currentTime-.1)this.next=ctx.currentTime+.025
    while(this.next<ctx.currentTime+.24){
      const i=this.step%16, note=tune.melody[i], root=tune.roots[Math.floor(this.step/8)%tune.roots.length]
      if(note){this.tone(dest,this.next,hz(note),tune.beat*2.7,.065,tune.wave);this.tone(dest,this.next+.16,hz(note),tune.beat*1.8,.018,'sine')}
      if(i%4===0){this.tone(dest,this.next,hz(root),tune.beat*4,.065,'sine');if(i%8===0)this.tone(dest,this.next,hz(root+7),tune.beat*5,.045,'sine')}
      this.step++;this.next+=tune.beat
    }
  }
  play(id:string){
    if(!this.ctx||!this.effects||this.settings.mute||this.hidden)return
    const now=this.ctx.currentTime+.004, fx=this.effects
    const emit=(frequency:number,length:number,vol:number,shape:OscillatorType,fall=1,delay=0)=>this.tone(fx,now+delay,frequency,length,vol,shape,fall)
    switch(id){
      case 'step':emit(102+Math.random()*43,.058,.034,'triangle',.50);break
      case 'arrow':emit(610,.14,.052,'triangle',.32);break
      case 'slash':emit(270,.13,.10,'triangle',.29);emit(760,.07,.032,'sawtooth',.36);break
      case 'hit':emit(116,.115,.10,'triangle',.51);break
      case 'critical':emit(187,.27,.13,'triangle',.21);emit(510,.17,.057,'sine',.53);break
      case 'spell':emit(510,.28,.078,'sine',1.55);emit(365,.30,.035,'triangle',1.52,.034);break
      case 'heal':emit(450,.22,.075,'sine',1.32);emit(675,.26,.043,'sine',1.17,.08);break
      case 'loot':emit(850,.15,.055,'sine',1.1);emit(1100,.19,.056,'sine',1.04,.06);break
      case 'quest':case 'level':case 'victory':for(const [i,n] of [60,64,67,72].entries())emit(hz(n),.46,.079,'sine',1,.08*i);break
      case 'omen':case 'boss':case 'impact':emit(77,.42,.15,'triangle',.58);emit(113,.32,.057,'sine',.68,.07);break
      case 'bell':emit(147,1.54,.13,'sine',.98);emit(294,1.12,.07,'sine',.995);emit(423,.86,.039,'sine',.98,.021);emit(701,.63,.029,'sine',1,.009);break
      case 'chime':emit(319,.55,.07,'sine',.99);emit(646,.45,.045,'sine',.95,.05);emit(816,.33,.054,'sine',.98,.10);break
      case 'defeat':emit(221,.68,.10,'triangle',.48);break
      default:emit(520,.09,.039,'sine',.9)
    }
  }
  dispose(){if(this.clock)window.clearInterval(this.clock);if(this.ctx&&this.ctx.state!=='closed')void this.ctx.close();this.ctx=undefined;this.master=undefined;this.music=undefined;this.effects=undefined}
}
export const audio=new VeilAudio()
