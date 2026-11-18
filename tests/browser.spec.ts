import { test, expect, type Page } from '@playwright/test'
import { ROLES } from '../src/data/classes'
import { coord } from '../src/data/maps'
import { QUEST_LIST } from '../src/data/quests'
import { Game } from '../src/game/model'
import { createSave, defaultSettings, gainXp, statsOf } from '../src/game/progression'

const canvas = '[data-testid="world"] canvas'
const marker = '.map-surface--small svg g[transform]'
const create = async (p:Page,name:string,className:string) => {
  await p.goto('/')
  await expect(p.getByRole('heading',{name:'Eclipse of the Veil'})).toBeVisible()
  await p.getByRole('button',{name:'New Game'}).click()
  await expect(p.getByRole('heading',{name:'Create Your Veilbound'})).toBeVisible()
  await expect(p.locator('.class-option')).toHaveCount(6)
  await p.getByRole('button',{name:new RegExp(className,'i')}).click()
  await p.getByLabel('Character name').fill(name)
  await p.getByRole('button',{name:'Begin Adventure'}).click()
  await p.locator(canvas).waitFor()
}
function captureErrors(p:Page) {
  const errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});return errors
}
async function axis(p:Page,i:0|1,to:number) {
  const loc=p.locator(marker)
  const from=Number((await loc.getAttribute('transform'))?.match(/translate\(([^ ]+) ([^)]+)\)/)?.[1+i])
  if(Math.abs(from-to)<.22)return
  const key=i===0?(to>from?'d':'a'):(to>from?'s':'w')
  await p.keyboard.down(key)
  try{await p.waitForFunction(({selector,i,to,inc})=>{const v=document.querySelector(selector)?.getAttribute('transform')?.match(/translate\(([^ ]+) ([^)]+)\)/);return !!v && (inc?Number(v[i+1])>=to-.15:Number(v[i+1])<=to+.15)}, {selector:marker,i,to,inc:to>from},{timeout:9000})}
  finally{await p.keyboard.up(key)}
}

 test('desktop: real combat, quest, progression and travel survive an offline refresh',async({page,context})=>{
  const errors=captureErrors(page)
  await create(page,'Eira','Warlock')
  await expect(page.getByRole('heading',{name:'Lumenford Village'})).toBeVisible()
  const before=await page.locator(marker).getAttribute('transform')
  await axis(page,1,18.7)
  await expect(page.locator(marker)).not.toHaveAttribute('transform',before!)
  await expect(page.locator('.quest-widget')).toContainText('Dispel the Fractured Spark')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('heading',{name:'Fractured Spark'})).toBeVisible()
  await expect(page.getByRole('meter',{name:'MP',exact:true})).toHaveAttribute('aria-valuenow','95')
  await page.keyboard.press('1')
  await expect(page.locator('.cooldown-num').first()).toBeVisible()
  await expect(page.getByRole('meter',{name:'MP',exact:true})).not.toHaveAttribute('aria-valuenow','95')
  await expect(page.locator('.quest-widget')).toContainText('Return to Captain Tarek')
  await axis(page,0,21.6)
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog',{name:'Conversation with Captain Tarek'})).toBeVisible()
  await page.getByRole('button',{name:/Report: An Unexpected Awakening/}).click()
  await page.keyboard.press('Escape')
  await expect(page.locator('.quest-widget')).toContainText('Trouble at the Eastern Road')
  await expect(page.locator('.vitals-name')).toContainText('Lv. 2')
  await page.keyboard.press('c')
  await expect(page.getByRole('dialog',{name:'Character',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Increase INT'}).click()
  await expect(page.getByText('2 unspent')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.keyboard.press('k')
  await page.getByRole('button',{name:'Learn',exact:true}).click()
  await expect(page.locator('.skill-card').filter({hasText:'Soul Drain'})).toContainText('Rank 1')
  await page.keyboard.press('Escape')
  await axis(page,1,20.87);await axis(page,0,53.8)
  await page.getByRole('button',{name:'Travel Whisperpine Road'}).click()
  await expect(page.getByRole('heading',{name:'Whisperpine Road'})).toBeVisible()
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Save Journey',exact:true}).click();await expect(page.locator('.panel-feedback')).toHaveText('Journey saved')
  const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('veilbound-save-1')??'null'))
  expect(record.name).toBe('Eira');expect(record.region).toBe('road');expect(record.ranks['warlock-3']).toBe(1);expect(record.level).toBe(2)
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller)
  await context.setOffline(true);await page.reload()
  await page.getByRole('button',{name:'Continue'}).click()
  await page.locator(canvas).waitFor()
  await expect(page.getByRole('heading',{name:'Whisperpine Road'})).toBeVisible()
  await expect(page.locator('.vitals-name')).toContainText('Eira')
  await expect(page.locator(marker)).toHaveAttribute('transform',`translate(${record.x/16} ${record.y/16}) rotate(180)`)
  const idb=await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('veilbound-chronicles',1);r.onsuccess=()=>{const t=r.result.transaction('slots').objectStore('slots').get(1);t.onsuccess=()=>{resolve(t.result?.name);r.result.close()};t.onerror=()=>resolve(null)};r.onerror=()=>resolve(null)}))
  expect(idb).toBe('Eira');expect(errors).toEqual([])
})

 test('landscape touch: virtual stick moves the world, target and attack work, menus fit',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://localhost:4317',viewport:{width:844,height:390},isMobile:true,hasTouch:true})
  const page=await context.newPage(),errors=captureErrors(page)
  try{
    await create(page,'Nerin','Ranger')
    const pad=page.getByRole('button',{name:'Movement joystick'});await expect(pad).toBeVisible()
    const box=(await pad.boundingBox())!,cdp=await context.newCDPSession(page),point={x:box.x+box.width*.50,y:box.y+box.height*.14,id:1}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]})
    await expect(page.locator('.quest-widget')).toContainText('Dispel the Fractured Spark')
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
    await page.getByRole('button',{name:'Select target',exact:true}).tap()
    await expect(page.getByRole('heading',{name:'Fractured Spark'})).toBeVisible()
    await page.getByRole('button',{name:'Use Piercing Shot'}).tap()
    await expect(page.locator('.quest-widget')).toContainText('Return to Captain Tarek')
    await page.getByRole('button',{name:'Inventory',exact:true}).tap()
    await expect(page.getByRole('dialog',{name:'Inventory'})).toBeVisible()
    await expect(page.locator('.bag-grid button')).toHaveCount(36)
    await page.getByRole('button',{name:'Close'}).tap()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(844)
    expect(errors).toEqual([])
  }finally{await context.close()}
})

 test('boss arena, party equipment, save import and export use production UI',async({page},info)=>{
  const errors=captureErrors(page),save=createSave('Liora','ranger',2,1,1,1,{...defaultSettings,difficulty:'Story'})
  gainXp(save,1045);for(const sk of ROLES.ranger.skills)if(sk.level<=save.level)save.ranks[sk.id]=1
  for(const q of QUEST_LIST.slice(0,9))save.quests[q.id]={state:'done',progress:q.objectives.map(o=>o.count)}
  save.quests.q10={state:'active',progress:[0,0]};save.tracked='q10';save.flags.gate=true;save.flags.runes=true;save.hero.equipment.Weapon={id:'edge',qty:1,plus:2};save.bag.push({id:'brigandine',qty:1,plus:0});save.region='spire';Object.assign(save,coord(44,24))
  const s=new Game(save);s.recruit('tarek');s.recruit('lyra');save.hero.hp=statsOf(save,save.hero).maxHp
  await page.goto('/');await page.getByRole('button',{name:'Load Game'}).click()
  await page.locator('input[type="file"]').setInputFiles({name:'journey.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))})
  await expect(page.getByText(/Ready to import Liora/)).toBeVisible()
  await page.getByRole('button',{name:'Import to Slot'}).click()
  await page.getByRole('button',{name:'Load',exact:true}).click()
  await page.locator(canvas).waitFor()
  await expect(page.getByRole('heading',{name:'The Fallen Spire'})).toBeVisible()
  await page.keyboard.press('p');await expect(page.getByText('3 / 3 active')).toBeVisible();await expect(page.getByLabel('Lyra tactics')).toHaveValue('Support');await page.keyboard.press('Escape')
  await page.keyboard.press('i')
  await page.getByRole('button',{name:'Guard’s Brigandine',exact:true}).click();await page.getByRole('button',{name:'Equip',exact:true}).click()
  await expect(page.getByRole('button',{name:'Chest: Guard’s Brigandine'})).toBeVisible();await page.keyboard.press('Escape')
  await page.keyboard.press('Tab');await page.keyboard.press('f');await expect(page.getByRole('heading',{name:'Gloomroot Warden'})).toBeVisible();await page.keyboard.press('1')
  await expect(page.getByRole('meter',{name:'Boss HP'})).not.toHaveAttribute('aria-valuenow','1120')
  await expect(page.getByText(/Phase II|Phase III/).first()).toBeVisible({timeout:16000})
  await page.screenshot({path:info.outputPath('boss.png')})
  await expect(page.locator('.quest-widget')).toContainText('Recover the Oath Shard',{timeout:22000})
  await page.keyboard.press('Escape')
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export Save'}).click();expect((await download).suggestedFilename()).toBe('veilbound-slot-1.json')
  expect(errors).toEqual([])
})
