import type { StatusSpec } from '../game/types'
export type EnemyDef = { name: string; kind: string; color: string; hp: number; attack: number; armor: number; resist: number; xp: number; gold: number; speed: number; range: number; sight: number; windup: number; rest: number; style: 'bite' | 'strike' | 'bolt' | 'pounce' | 'boss' | 'charge' | 'fan' | 'sweep'; loot: [string, number][]; ailment?: StatusSpec }
export const ENEMIES = {
  omen: { name:'Fractured Spark', kind:'wisp', color:'#cc93f5', hp:31, attack:10, armor:0, resist:0, xp:18, gold:4, speed:31, range:72, sight:91, windup:780, rest:1800, style:'bolt', loot:[] },
  slime: { name:'Corrupted Slime', kind:'slime', color:'#79c4ba', hp:45, attack:13, armor:2, resist:3, xp:24, gold:7, speed:31, range:22, sight:82, windup:670, rest:1250, style:'bite', loot:[['essence',.56],['hp',.36]] },
  goblin: { name:'Goblin Forager', kind:'goblin', color:'#a8aa65', hp:66, attack:17, armor:4, resist:2, xp:32, gold:10, speed:45, range:23, sight:89, windup:490, rest:980, style:'strike', loot:[['ore',.70],['boots',.18]] },
  bat: { name:'Twilight Bat', kind:'bat', color:'#a194c0', hp:39, attack:14, armor:0, resist:4, xp:25, gold:6, speed:58, range:20, sight:95, windup:440, rest:1020, style:'pounce', loot:[['mp',.30],['essence',.55]] },
  bandit: { name:'Roadside Deserter', kind:'bandit', color:'#c48269', hp:93, attack:19, armor:6, resist:5, xp:48, gold:15, speed:50, range:28, sight:95, windup:600, rest:1030, style:'strike', loot:[['ore',.72],['buckler',.22]] },
  wolf: { name:'Gloamfang Wolf', kind:'wolf', color:'#789698', hp:76, attack:19, armor:4, resist:5, xp:39, gold:9, speed:55, range:25, sight:96, windup:550, rest:1040, style:'pounce', loot:[['essence',.59],['wraps',.19]], ailment:{id:'bleed',time:3,strength:3} },
  spider: { name:'Briar Weaver', kind:'spider', color:'#b68db9', hp:80, attack:16, armor:4, resist:9, xp:44, gold:11, speed:43, range:80, sight:100, windup:700, rest:1370, style:'bolt', loot:[['essence',.75],['cleanse',.44]], ailment:{id:'poison',time:4,strength:4} },
  wisp: { name:'Veil Wisp', kind:'wisp', color:'#8fe5d7', hp:73, attack:20, armor:2, resist:12, xp:46, gold:12, speed:45, range:87, sight:100, windup:750, rest:1170, style:'bolt', loot:[['ring',.22],['mp',.48]], ailment:{id:'silence',time:1.6} },
  skeleton: { name:'Oathless Sentinel', kind:'skeleton', color:'#d8cdaf', hp:112, attack:23, armor:8, resist:8, xp:57, gold:16, speed:43, range:27, sight:93, windup:730, rest:1030, style:'strike', loot:[['ore',.76],['cowl',.20]] },
  guardian: { name:'Spire Guardian', kind:'guardian', color:'#84c7cc', hp:154, attack:27, armor:12, resist:10, xp:72, gold:19, speed:37, range:32, sight:91, windup:760, rest:1320, style:'strike', loot:[['ore',1],['edge',.27]], ailment:{id:'slow',time:2.3,strength:.28} },
  siltmaw: { name:'Siltmaw', kind:'siltmaw', color:'#8db58d', hp:135, attack:23, armor:8, resist:6, xp:65, gold:16, speed:46, range:68, sight:108, windup:780, rest:1480, style:'charge', loot:[['archive-bronze',.85],['hp',.40]], ailment:{id:'slow',time:2,strength:.28} },
  bellwing: { name:'Bellwing', kind:'bellwing', color:'#b9a9e6', hp:107, attack:19, armor:4, resist:14, xp:69, gold:18, speed:49, range:88, sight:112, windup:940, rest:1830, style:'fan', loot:[['archive-bronze',.60],['mp',.62]], ailment:{id:'silence',time:1.3} },
  bailiff: { name:'Crown Bailiff', kind:'bailiff', color:'#eab07f', hp:182, attack:28, armor:11, resist:7, xp:73, gold:20, speed:43, range:32, sight:103, windup:960, rest:1420, style:'sweep', loot:[['ore',.82],['cleanse',.51]] },
  archiveHusk: { name:'Archive Husk', kind:'archiveHusk', color:'#98d5ce', hp:396, attack:31, armor:13, resist:12, xp:145, gold:42, speed:35, range:49, sight:123, windup:1110, rest:1560, style:'sweep', loot:[['archive-bronze',1],['hp',1]], ailment:{id:'sunder',time:2.5,strength:.18} },
  hollow: { name:'Caldus, the Hollow Knight', kind:'hollow', color:'#e6bf9c', hp:1720, attack:40, armor:16, resist:15, xp:390, gold:174, speed:43, range:71, sight:158, windup:1090, rest:1500, style:'boss', loot:[['bellarm',1],['bell-key',1],['archive-bronze',1]] },
  warden: { name:'Gloomroot Warden', kind:'warden', color:'#9dd8a2', hp:1120, attack:41, armor:12, resist:12, xp:270, gold:120, speed:42, range:54, sight:185, windup:1000, rest:1000, style:'boss', loot:[['spire-weapon',1],['pendant',1],['shard',1]] },
} satisfies Record<string, EnemyDef>
export type EnemyId = keyof typeof ENEMIES

export const BESTIARY: { id:EnemyId; habitat:string; note:string; tell:string }[] = [
  {id:'omen',habitat:'Lumenford',note:'A name in the act of being taken.',tell:'Sidestep when its thin line turns bright. The bolt travels in a straight line.'},
  {id:'slime',habitat:'Whisperpine Road',note:'Veil residue soaked into the old roadside pools.',tell:'Retreat just beyond its bite, then strike during the pause.'},
  {id:'goblin',habitat:'Whisperpine Road',note:'Collects metal scraps the Crown left in the mud.',tell:'Its short cleaver only reaches in front.'},
  {id:'bat',habitat:'Whisperpine Road',note:'Nests under bridges where sunlight cannot cross.',tell:'Move out of the marked landing circle.'},
  {id:'bandit',habitat:'Whisperpine Road',note:'Still carries the buckle of a company no one remembers.',tell:'Wait for the forward swing, then approach from behind.'},
  {id:'wolf',habitat:'Hollowwood',note:'Some say they trail the people the forest wants back.',tell:'Leave the pounce marker before it lands. Its bite causes bleeding.'},
  {id:'spider',habitat:'Hollowwood',note:'Threads of silver carry venom to its young.',tell:'Use walls or break sideways from its poisoned bolt.'},
  {id:'wisp',habitat:'Hollowwood & the Spire',note:'The dead sometimes forget how heavy a body is.',tell:'Its bolt silences skills briefly. Dodge or break line of sight.'},
  {id:'skeleton',habitat:'Fallen Spire',note:'The bindings failed. The watch did not.',tell:'Its heavy windup leaves time to circle behind.'},
  {id:'guardian',habitat:'Fallen Spire',note:'Built to forget every voice but the order that woke it.',tell:'Don’t trade blows into its wide swing; strike in recovery.'},
  {id:'warden',habitat:'Fallen Spire',note:'The roots grew around an oath, not a body.',tell:'Keep moving through spike marks and bolt fans. Watch for summoned creatures.'},
  {id:'siltmaw',habitat:'Ashen Pass & the Archive',note:'The scales along its back feel vibrations in the flooded stones.',tell:'Step out of the painted lane. It lunges along that lane, not toward where you dodge.'},
  {id:'bellwing',habitat:'Ashen Pass & the Archive',note:'A bronze clapper rattles inside the creature’s translucent chest.',tell:'Three notes travel along the marked rays. Stand between them or behind stone.'},
  {id:'bailiff',habitat:'The public archive stair',note:'An employee of the Census. The helmet carries no name.',tell:'Its shield dampens frontal blows while it winds up. Flank it or wait for the cleave.'},
  {id:'archiveHusk',habitat:'The Drowned Archive',note:'A century of rejected pages walking around in a single coat.',tell:'A scythe sweep alternates with a shock ring. Step inside the small circle or beyond the large one.'},
  {id:'hollow',habitat:'Vault of the Last Bell',note:'The man on the last watch was Caldus. There was no second bell.',tell:'Read the charge lane and the safe centre of the bell ring. Attack when the armour glows.'},
]
