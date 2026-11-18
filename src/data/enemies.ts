import type { StatusSpec } from '../game/types'
export type EnemyDef = { name: string; kind: string; color: string; hp: number; attack: number; armor: number; resist: number; xp: number; gold: number; speed: number; range: number; sight: number; windup: number; rest: number; style: 'bite' | 'strike' | 'bolt' | 'pounce' | 'boss'; loot: [string, number][]; ailment?: StatusSpec }
export const ENEMIES = {
  omen: { name:'Fractured Spark', kind:'wisp', color:'#cc93f5', hp:31, attack:10, armor:0, resist:0, xp:18, gold:4, speed:31, range:72, sight:91, windup:780, rest:1800, style:'bolt', loot:[] },
  slime: { name:'Corrupted Slime', kind:'slime', color:'#a885c7', hp:45, attack:13, armor:2, resist:3, xp:24, gold:7, speed:31, range:22, sight:82, windup:670, rest:1250, style:'bite', loot:[['essence',.56],['hp',.36]] },
  goblin: { name:'Goblin Forager', kind:'goblin', color:'#a8aa65', hp:66, attack:17, armor:4, resist:2, xp:32, gold:10, speed:45, range:23, sight:89, windup:490, rest:980, style:'strike', loot:[['ore',.70],['boots',.18]] },
  bat: { name:'Twilight Bat', kind:'bat', color:'#a194c0', hp:39, attack:14, armor:0, resist:4, xp:25, gold:6, speed:58, range:20, sight:95, windup:440, rest:1020, style:'pounce', loot:[['mp',.30],['essence',.55]] },
  bandit: { name:'Roadside Deserter', kind:'bandit', color:'#c48269', hp:93, attack:19, armor:6, resist:5, xp:48, gold:15, speed:50, range:28, sight:95, windup:600, rest:1030, style:'strike', loot:[['ore',.72],['buckler',.22]] },
  wolf: { name:'Gloamfang Wolf', kind:'wolf', color:'#789698', hp:76, attack:19, armor:4, resist:5, xp:39, gold:9, speed:55, range:25, sight:96, windup:550, rest:1040, style:'pounce', loot:[['essence',.59],['wraps',.19]], ailment:{id:'bleed',time:3,strength:3} },
  spider: { name:'Briar Weaver', kind:'spider', color:'#b68db9', hp:80, attack:16, armor:4, resist:9, xp:44, gold:11, speed:43, range:80, sight:100, windup:700, rest:1370, style:'bolt', loot:[['essence',.75],['cleanse',.44]], ailment:{id:'poison',time:4,strength:4} },
  wisp: { name:'Veil Wisp', kind:'wisp', color:'#8fe5d7', hp:73, attack:20, armor:2, resist:12, xp:46, gold:12, speed:45, range:87, sight:100, windup:750, rest:1170, style:'bolt', loot:[['ring',.22],['mp',.48]], ailment:{id:'silence',time:1.6} },
  skeleton: { name:'Oathless Sentinel', kind:'skeleton', color:'#d8cdaf', hp:112, attack:23, armor:8, resist:8, xp:57, gold:16, speed:43, range:27, sight:93, windup:730, rest:1030, style:'strike', loot:[['ore',.76],['cowl',.20]] },
  guardian: { name:'Spire Guardian', kind:'guardian', color:'#8fbcb3', hp:154, attack:27, armor:12, resist:10, xp:72, gold:19, speed:37, range:32, sight:91, windup:760, rest:1320, style:'strike', loot:[['ore',1],['edge',.27]], ailment:{id:'slow',time:2.3,strength:.28} },
  warden: { name:'Gloomroot Warden', kind:'warden', color:'#9dd8a2', hp:1120, attack:41, armor:12, resist:12, xp:270, gold:120, speed:42, range:54, sight:185, windup:1000, rest:1000, style:'boss', loot:[['spire-weapon',1],['pendant',1],['shard',1]] },
} satisfies Record<string, EnemyDef>
export type EnemyId = keyof typeof ENEMIES
