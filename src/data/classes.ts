import { CLASS_ART } from './art'
import type { ClassId, Role, Skill } from '../game/types'

type Blueprint = Omit<Skill, 'id' | 'owner' | 'rankMax' | 'level' | 'needs' | 'anim' | 'sound' | 'radius' | 'color'> & { color?: string; radius?: number }
function role(def: Omit<Role, 'skills'>, moves: Blueprint[]): Role {
  const levels = [1, 1, 2, 3, 4, 5]
  return { ...def, skills: moves.map((move, i) => ({ ...move, id: `${def.id}-${i+1}`, owner: def.id, color: move.color ?? def.color,
    radius: move.radius ?? 0, level: levels[i] ?? 6 + i, rankMax: 3, needs: i > 2 ? `${def.id}-${i}` : undefined,
    anim: move.kind === 'dash' ? 'dash' : move.kind === 'strike' ? 'slash' : 'cast',
    sound: move.kind === 'strike' ? 'slash' : move.kind === 'heal' || move.kind === 'ward' || move.kind === 'purge' ? 'heal' : def.id === 'ranger' && move.kind === 'bolt' ? 'arrow' : 'spell' })) }
}
export const ROLES: Record<ClassId, Role> = {
  knight: role({ id: 'knight', name: 'Black Knight', epithet: 'Oath of the Abyss', short: 'Dark bruiser', description: 'A steadfast blade that turns the dark against itself. Mark foes, draw them close, and steal back life with each shadowed stroke.', icon: 'sword', color: CLASS_ART.knight.accent, attrs: { STR: 12, DEX: 7, INT: 8, VIT: 13, SPI: 8 }, weapon: 'iron', range: 28, magic: false, pace: .89 }, [
    { name: 'Night Slash', desc: 'Carve a wide shadow arc and leave enemies bleeding.', icon: 'sword', kind: 'strike', cost: 7, cd: 3, power: 1.75, range: 38, radius: 34, cone: true, status: { id: 'bleed', time: 4, strength: 3 } },
    { name: 'Graveguard', desc: 'Absorb 46 incoming damage for six seconds.', icon: 'shield', kind: 'ward', cost: 13, cd: 12, power: 1, range: 0, self: { id: 'shield', time: 6, strength: 46 } },
    { name: 'Dread Mark', desc: 'Cast a shadow chain that sunders defenses.', icon: 'target', kind: 'bolt', cost: 9, cd: 6, power: 1.25, range: 128, status: { id: 'sunder', time: 7, strength: .42 } },
    { name: 'Blood Pact', desc: 'Drain health from a nearby foe, healing for damage done.', icon: 'heart', kind: 'drain', cost: 14, cd: 9, power: 1.8, range: 46, color: '#eb798d' },
    { name: 'Shadow Chains', desc: 'Pull enemies toward you and slow them.', icon: 'roots', kind: 'burst', cost: 17, cd: 9, power: .95, range: 0, radius: 69, pull: true, status: { id: 'slow', time: 4, strength: .48 } },
    { name: 'Abyssal Surge', desc: 'Detonate the abyss, wounding and stunning nearby foes.', icon: 'orb', kind: 'burst', cost: 23, cd: 13, power: 2.65, range: 0, radius: 59, knock: 13, status: { id: 'stun', time: 1.4 } },
  ]),
  assassin: role({ id: 'assassin', name: 'Assassin', epithet: 'Blade in the Dark', short: 'Mobile striker', description: 'A swift duelist who controls the terms of every encounter. Slip through enemy strikes and exploit unguarded backs.', icon: 'blades', color: CLASS_ART.assassin.accent, attrs: { STR: 11, DEX: 16, INT: 5, VIT: 8, SPI: 7 }, weapon: 'daggers', range: 25, magic: false, pace: .63 }, [
    { name: 'Twin Fang', desc: 'Strike twice in quick succession, applying bleeding.', icon: 'blades', kind: 'strike', cost: 6, cd: 3, power: .9, range: 35, hits: 2, status: { id: 'bleed', time: 4, strength: 4 } },
    { name: 'Smoke Veil', desc: 'Become untrackable for three seconds, until you attack.', icon: 'ghost', kind: 'ward', cost: 9, cd: 9, power: 1, range: 0, self: { id: 'veil', time: 3 }, color: '#b8a6da' },
    { name: 'Backstab', desc: 'A precise strike that deals 75% more damage from behind.', icon: 'target', kind: 'strike', cost: 9, cd: 5, power: 1.6, range: 38, flank: true },
    { name: 'Shadowstep', desc: 'Slip toward a chosen enemy and deliver a stunning blow.', icon: 'wind', kind: 'dash', cost: 12, cd: 7, power: 1.40, range: 105, status: { id: 'stun', time: .9 } },
    { name: 'Poison Edge', desc: 'Bury a toxic blade that damages over time.', icon: 'bottle', kind: 'strike', cost: 10, cd: 6, power: 1.20, range: 36, status: { id: 'poison', time: 7, strength: 9 }, color: '#9bd98c' },
    { name: 'Death Blossom', desc: 'Strike all nearby enemies three times.', icon: 'sparkle', kind: 'burst', cost: 22, cd: 12, power: .94, range: 0, radius: 51, hits: 3 },
  ]),
  warlock: role({ id: 'warlock', name: 'Warlock', epithet: 'Keeper of Embers', short: 'Arcane damage', description: 'A scholar of the forbidden flame. Control space with curses and set whole groups ablaze from a safe distance.', icon: 'flame', color: CLASS_ART.warlock.accent, attrs: { STR: 4, DEX: 8, INT: 17, VIT: 7, SPI: 12 }, weapon: 'staff', range: 115, magic: true, pace: 1.02 }, [
    { name: 'Ember Bolt', desc: 'Launch a fast ember that burns its target.', icon: 'flame', kind: 'bolt', cost: 8, cd: 2.6, power: 1.7, range: 154, magic: true, status: { id: 'burn', time: 4, strength: 4 }, color: '#ffac68' },
    { name: 'Hex', desc: 'Curse a target, reducing its armor and slowing magic resistance with a sunder.', icon: 'ghost', kind: 'bolt', cost: 9, cd: 6, power: .85, range: 145, magic: true, status: { id: 'sunder', time: 7, strength: .5 } },
    { name: 'Soul Drain', desc: 'Draw mana from a target in mid-range; restores 18 MP on hit.', icon: 'waves', kind: 'drain', cost: 4, cd: 8, power: 1.22, range: 97, magic: true, focus: true, color: '#95e9cb' },
    { name: 'Void Orb', desc: 'Send a slow orb that bursts and silences foes on impact.', icon: 'orb', kind: 'bolt', cost: 16, cd: 7, power: 1.8, range: 156, radius: 34, magic: true, status: { id: 'silence', time: 2.8 } },
    { name: 'Infernal Rain', desc: 'Scorch an area around a selected enemy with lingering burns.', icon: 'sparkle', kind: 'burst', cost: 22, cd: 10, power: 2.0, range: 145, radius: 46, magic: true, status: { id: 'burn', time: 6, strength: 9 }, color: '#ff9665' },
    { name: 'Rift Nova', desc: 'Release a violent arcane blast, knocking enemies away.', icon: 'sun', kind: 'burst', cost: 25, cd: 12, power: 3.1, range: 0, radius: 66, magic: true, knock: 31 },
  ]),
  priest: role({ id: 'priest', name: 'Priest', epithet: 'Light of the Wayside', short: 'Holy support', description: 'A wayfarer who carries the dawn into places it cannot reach. Ward the party and strike with focused sunlight.', icon: 'cross', color: CLASS_ART.priest.accent, attrs: { STR: 6, DEX: 8, INT: 13, VIT: 8, SPI: 15 }, weapon: 'scepter', range: 102, magic: true, pace: .91 }, [
    { name: 'Light Bolt', desc: 'Hurl a searing ray that pierces the first target.', icon: 'sun', kind: 'bolt', cost: 7, cd: 2.8, power: 1.82, range: 144, magic: true, pierce: true },
    { name: 'Mend', desc: 'Restore HP to the most wounded ally in range, including yourself.', icon: 'heart', kind: 'heal', cost: 12, cd: 7, power: 1.1, range: 105, color: '#a8eaaa' },
    { name: 'Sacred Shield', desc: 'Absorb incoming damage for allies in the circle.', icon: 'shield', kind: 'ward', cost: 13, cd: 10, power: 1, range: 0, radius: 78, self: { id: 'shield', time: 6, strength: 36 } },
    { name: 'Purify', desc: 'Cleanse ailments and briefly regenerate the party.', icon: 'sparkle', kind: 'purge', cost: 12, cd: 8, power: .45, range: 0, radius: 88, self: { id: 'regen', time: 4, strength: 5 }, color: '#c7f5d5' },
    { name: 'Sanctuary', desc: 'Consecrate the ground, healing and regenerating nearby allies.', icon: 'cross', kind: 'heal', cost: 19, cd: 12, power: .85, range: 0, radius: 95, self: { id: 'regen', time: 7, strength: 9 }, color: '#bde6ad' },
    { name: 'Judgment', desc: 'Call down a pillar of holy light and stun all enemies it catches.', icon: 'flame', kind: 'burst', cost: 22, cd: 11, power: 2.65, range: 132, radius: 39, magic: true, status: { id: 'stun', time: 1.8 } },
  ]),
  ranger: role({ id: 'ranger', name: 'Ranger', epithet: 'Eye of the Wilds', short: 'Ranged hunter', description: 'A patient hunter with a sure aim. Pin down packs, line up piercing shots, and keep a clean escape route.', icon: 'bow', color: CLASS_ART.ranger.accent, attrs: { STR: 10, DEX: 16, INT: 6, VIT: 8, SPI: 8 }, weapon: 'bow', range: 133, magic: false, pace: .87 }, [
    { name: 'Piercing Shot', desc: 'Shoot through every enemy in a straight line.', icon: 'bow', kind: 'bolt', cost: 7, cd: 3, power: 1.9, range: 171, pierce: true },
    { name: 'Snare Trap', desc: 'Set a trap at your feet. The first enemy to approach springs it.', icon: 'roots', kind: 'trap', cost: 9, cd: 7, power: 1.12, range: 0, radius: 41, status: { id: 'root', time: 3.3 } },
    { name: 'Falcon Mark', desc: 'Tag a target with an arrow that exposes their defenses.', icon: 'target', kind: 'bolt', cost: 8, cd: 5, power: 1.05, range: 162, status: { id: 'sunder', time: 7, strength: .55 }, color: '#eed993' },
    { name: 'Volley', desc: 'Rain arrows onto a group of foes, slowing them.', icon: 'wind', kind: 'burst', cost: 14, cd: 7, power: 1.68, range: 151, radius: 49, status: { id: 'slow', time: 4, strength: .40 } },
    { name: 'Evasive Roll', desc: 'Evade in your facing direction and gain temporary protection.', icon: 'ghost', kind: 'dash', cost: 8, cd: 5, power: 0, range: 66, self: { id: 'shield', time: 2.5, strength: 25 } },
    { name: 'Spirit Arrow', desc: 'An enchanted arrow explodes in a burst of brambles.', icon: 'sparkle', kind: 'bolt', cost: 19, cd: 10, power: 2.85, range: 178, radius: 33, status: { id: 'root', time: 2 }, color: '#bcf2d5' },
  ]),
  warrior: role({ id: 'warrior', name: 'Warrior', epithet: 'The Unbroken', short: 'Frontline tank', description: 'The first to enter and the last to leave. Hold the line with a shield, rally allies, and shatter enemy formations.', icon: 'shield', color: CLASS_ART.warrior.accent, attrs: { STR: 14, DEX: 8, INT: 4, VIT: 16, SPI: 6 }, weapon: 'blade', range: 29, magic: false, pace: .82 }, [
    { name: 'Cleave', desc: 'Sweep your weapon through a wide arc.', icon: 'sword', kind: 'strike', cost: 6, cd: 3, power: 1.85, range: 40, radius: 37, cone: true },
    { name: 'Shield Bash', desc: 'Slam a target, staggering and knocking them back.', icon: 'shield', kind: 'strike', cost: 8, cd: 5, power: 1.25, range: 34, knock: 16, status: { id: 'stun', time: 1.65 } },
    { name: 'Battle Cry', desc: 'Raise the party’s attack by 30% for six seconds.', icon: 'wind', kind: 'ward', cost: 12, cd: 11, power: 1, range: 0, radius: 92, self: { id: 'might', time: 6, strength: .30 } },
    { name: 'Whirlwind', desc: 'Spin and carve multiple enemies twice.', icon: 'blades', kind: 'burst', cost: 16, cd: 7, power: 1.13, range: 0, radius: 51, hits: 2 },
    { name: 'Iron Wall', desc: 'Raise an iron defense. Absorb 90 incoming damage.', icon: 'helmet', kind: 'ward', cost: 16, cd: 12, power: 1, range: 0, self: { id: 'shield', time: 6, strength: 90 } },
    { name: 'Earthbreaker', desc: 'Rupture the ground, stunning enemies with a shockwave.', icon: 'hammer', kind: 'burst', cost: 24, cd: 12, power: 3.05, range: 0, radius: 64, knock: 22, status: { id: 'stun', time: 2 } },
  ]),
}
export const SKILLS = Object.fromEntries(Object.values(ROLES).flatMap(r => r.skills.map(s => [s.id, s]))) as Record<string, Skill>
export const DYES = ['#a44b50','#4e9094','#847dab','#ae8546','#658757','#a7a6aa']
export const SKINS = ['#e9bc92','#b98260','#875b53','#efcbb9']
export const COMPANIONS = {
  tarek: { name: 'Captain Tarek', classId: 'warrior', skin: 1, dye: 3, style: 0, mode: 'Defensive', title: 'The Fallen Commander', desc: 'Keeps enemies occupied and makes space for the party.' },
  lyra: { name: 'Lyra', classId: 'priest', skin: 0, dye: 1, style: 1, mode: 'Support', title: 'The Wandering Healer', desc: 'Heals wounded allies and fights at a safe distance.' },
  veyra: { name: 'Veyra', classId: 'assassin', skin: 2, dye: 0, style: 1, mode: 'Aggressive', title: 'The Shadow Emissary', desc: 'Pursues exposed enemies with quick, bleeding strikes.' },
} as const
