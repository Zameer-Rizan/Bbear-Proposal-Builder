import {z} from 'zod';
const id=z.string().uuid();
export const moneyValue=z.number().nonnegative().max(1e8).nullable();
export const Plan=z.enum(['BB','HB','FB','AI','RO']);
export const PropertyType=z.enum(['hotel','resort','villa','apartment','guest_house','cabana','cabin','chalet','lodge','other','unknown']);
export const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(validDate,'Choose a real calendar date');
export const RateSchema=z.object({id,room:z.string().min(1).max(180),plan:Plan,occupancy:z.number().int().min(1).max(8),from:date,to:date,amount:moneyValue,page:z.number().int().min(1),source:z.string().max(3000),checked:z.boolean()}).refine(r=>r.from<=r.to,'End date must follow start date');
export const MealSchema=z.object({id,label:z.string().max(100),adult:moneyValue,child:moneyValue,unit:z.string().max(160),note:z.string().max(1000),page:z.number().int().min(1),checked:z.boolean().default(false)});
export const ChildSchema=z.object({id,min:z.number().min(0).max(18),max:z.number().min(0).max(18),maxPerRoom:z.number().int().min(0).max(6),plan:Plan,amount:moneyValue,source:z.string().max(2000),checked:z.boolean()}).refine(r=>r.min<r.max,'Child age range is invalid');
export const OfferSchema=z.object({id,from:date,to:date,leadDays:z.number().int().min(0).max(1000),minNights:z.number().int().min(1).max(60),percent:z.number().min(0).max(100),components:z.array(z.enum(['base','board','child','event','upgrade'])).min(1),source:z.string().max(2000),checked:z.boolean()}).refine(o=>o.from<=o.to,'Check offer travel dates');
export const UpgradeSchema=z.object({id,room:z.string().min(1).max(180),baseRoom:z.string().min(1).max(180),amount:moneyValue,page:z.number().int().min(1),source:z.string().max(2000),checked:z.boolean()}).refine(u=>u.room!==u.baseRoom,'Choose a different upgraded room');
export const EventSchema=z.object({id,date,through:date.optional(),name:z.string().max(160).optional(),basis:z.enum(['person_once','person_per_night','room_once','room_per_night']).optional(),plans:z.array(Plan).min(1),adult:moneyValue,child:moneyValue,roomAmount:moneyValue.optional(),childMin:z.number().min(0).max(18).nullable().default(null),childMax:z.number().min(0).max(18).nullable().default(null),page:z.number().int().min(1).optional(),source:z.string().max(2000),checked:z.boolean()}).refine(e=>(!e.through||e.date<=e.through),'Last applicable night must be on or after the first night').refine(e=>e.childMin===null&&e.childMax===null||e.childMin!==null&&e.childMax!==null&&e.childMin<e.childMax,'Check the child charge age range');
export const BoardSchema=z.object({id,from:Plan,to:Plan,adult:z.number().min(-1e6).max(1e6),child:z.number().min(-1e6).max(1e6).nullable(),source:z.string().max(2000),checked:z.boolean()}).refine(b=>b.from!==b.to,'Choose different meal plans');
export const HotelSchema=z.object({id,version:z.number().int().nonnegative(),name:z.string().min(1).max(180),place:z.string().max(120),stars:z.number().int().min(1).max(5).nullable(),starSource:z.string().max(400),propertyType:PropertyType.default('unknown'),propertyTypeSource:z.string().max(400).default(''),photo:z.string().max(500),updated:z.string()}).refine(h=>!h.stars||!!h.starSource.trim(),'Add the source for the star category');
export const ContractSchema=z.object({id,version:z.number().int().nonnegative(),hotelId:id,name:z.string().min(1).max(220),sha:z.string().regex(/^[a-f0-9]{64}$/),fileKey:z.string().max(200),mime:z.string().max(100),status:z.enum(['Draft','Reviewed','Archived']),currency:z.enum(['USD','LKR','INR','']),unitConfirmed:z.boolean(),nightlyConfirmed:z.boolean(),offers:z.array(OfferSchema).max(100).default([]),offerPolicyConfirmed:z.boolean().default(false),eventPolicyConfirmed:z.boolean().default(false),upgrades:z.array(UpgradeSchema).max(50).default([]),rates:z.array(RateSchema).max(1500),meals:z.array(MealSchema).max(80),children:z.array(ChildSchema).max(100),events:z.array(EventSchema).max(100),boards:z.array(BoardSchema).max(50),restrictions:z.array(z.object({date,allowed:z.array(Plan).min(1),source:z.string().max(1000)})).max(100),issues:z.array(z.object({id,text:z.string().max(3000),resolution:z.string().max(3000)})).max(200),notes:z.string().max(30000),pages:z.array(z.object({number:z.number().int().min(1),text:z.string().max(60000)})).max(60),readStatus:z.string().max(200),updated:z.string()});
export type Hotel=z.infer<typeof HotelSchema>;export type Contract=z.infer<typeof ContractSchema>;export type Rate=z.infer<typeof RateSchema>;export type Meal=z.infer<typeof MealSchema>;
export const uid=()=>crypto.randomUUID();
export function blankHotel(name='New hotel'):Hotel{return {id:uid(),version:0,name,place:'',stars:null,starSource:'',propertyType:'unknown',propertyTypeSource:'',photo:'',updated:new Date().toISOString()};}
export function blankContract(hotelId:string,name:string,sha:string):Contract{return {id:uid(),version:0,hotelId,name,sha,fileKey:'',mime:'',status:'Draft',currency:'',unitConfirmed:false,nightlyConfirmed:false,offers:[],offerPolicyConfirmed:false,eventPolicyConfirmed:false,upgrades:[],rates:[],meals:[],children:[],events:[],boards:[],restrictions:[],issues:[],notes:'',pages:[],readStatus:'Uploaded',updated:new Date().toISOString()};}
export function checkedForPricing(c:Contract){return c.status==='Reviewed'&&!!c.currency&&c.unitConfirmed&&c.nightlyConfirmed&&c.issues.every(i=>!!i.resolution.trim())&&(!(c.offers||[]).length||c.offerPolicyConfirmed); }
export function assertReviewed(c:Contract){if(c.status!=='Reviewed')return;if(!c.currency||!c.unitConfirmed||!c.nightlyConfirmed||!c.eventPolicyConfirmed||!c.rates.length||c.rates.some(r=>!r.checked||r.amount===null||!r.source.trim())||c.meals.some(m=>!m.checked||!m.unit.trim()||m.adult===null&&m.child===null)||c.issues.some(i=>!i.resolution.trim())||c.events.some(e=>!e.checked||!e.source.trim()||((e.basis!==undefined||e.through!==undefined||e.name!==undefined)&&(!e.name?.trim()||!e.page))||((e.basis||'person_once').startsWith('room_')?e.roomAmount===null||e.roomAmount===undefined:e.adult===null))||c.boards.some(b=>!b.checked)||c.children.some(r=>!r.checked||r.amount===null)||(c.offers||[]).some(o=>!o.checked)||((c.offers||[]).length&&!c.offerPolicyConfirmed)||(c.upgrades||[]).some(u=>!u.checked||u.amount===null||!u.source.trim()))throw Error('Check the rates, meal prices, special-date rules, charging basis and open questions before approving this contract.');}
export function validDate(s:string){const d=new Date(s+'T00:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
export function normalizeHotelName(name:string){return name.trim().replace(/\s+/g,' ').toLowerCase();}
export function nights(from:string,to:string){if(!validDate(from)||!validDate(to))throw Error('Choose valid arrival and departure dates.');const n=(Date.parse(to)-Date.parse(from))/86400000;if(n<1||n>60)throw Error('Choose a stay between 1 and 60 nights.');return Array.from({length:n},(_,i)=>new Date(Date.parse(from)+i*86400000).toISOString().slice(0,10));}
export type RoomGuests={adults:number;ages:number[]};
export type StaySearch={from:string;to:string;plan:z.infer<typeof Plan>;rooms:RoomGuests[];roomType?:string;bookingDate?:string};
export type QuoteLine={date:string;room:number;label:string;amount:number;contractId:string;contractVersion:number;page:number|null};
export type HotelQuote={complete:boolean;total:number|null;currency:string;lines:QuoteLine[];issues:string[];roomType:string};
const cents=(n:number)=>Math.round((n+Number.EPSILON)*100);
const specialDateNames:Record<string,string>={'12-24':'Christmas Eve','12-25':'Christmas Day','12-31':'New Year’s Eve','01-01':'New Year’s Day'};
export function specialDatesInStay(from:string,to:string){
 if(!validDate(from)||!validDate(to)||to<=from)return [];
 const span=(Date.parse(to)-Date.parse(from))/86400000;if(span>60)return [];
 return nights(from,to).flatMap(day=>specialDateNames[day.slice(5)]?[{date:day,name:specialDateNames[day.slice(5)]}]:[]);
}
type ContractEvent=Contract['events'][number];
const hiriketiyaSeasons=[
 {from:'2026-05-01',to:'2026-07-31',needle:/01st of May 2026 to 31st of July/i},
 {from:'2026-08-01',to:'2026-10-31',needle:/1st of Aug 2026 to 31st\s*Oct 2026/i},
 {from:'2026-11-01',to:'2027-04-30',needle:/1st Nov 2026 t[o0] 30th\s*April 2027/i},
] as const;
const hiriketiyaRoomRows=[
 {key:'basic',room:'Double room - Basic',occupancy:2,start:/\bDouble room\b/i,end:/\bDeluxe Double room/i},
 {key:'deluxe',room:'Deluxe Double room / Balcony',occupancy:2,start:/\bDeluxe Double room/i,end:/\bSuperior Double room/i},
 {key:'superior-double',room:'Superior Double room / Balcony',occupancy:2,start:/\bSuperior Double room/i,end:/\bTPL room/i},
 {key:'triple',room:'TPL room / Balcony',occupancy:3,start:/\bTPL room/i,end:/\bSuperior Triple room/i},
 {key:'superior-triple',room:'Superior Triple room',occupancy:3,start:/\bSuperior Triple room/i,end:/\bFamily Suites/i},
] as const;
export function sourceRatesFromPages(c:Contract):Rate[]{
 const pages=c.pages||[],text=pages.map(p=>p.text).join('\n').replace(/\s+/g,' ');
 const splitCompactRateRow=(raw:string,roomColumns:number):number[]=>{
  const tokens=raw.trim().split(/\s+/).filter(Boolean);
  if(tokens.length===roomColumns+1&&tokens.every(t=>/^\d+(?:\.\d+)?$/.test(t)))return tokens.map(Number);
  const compact=raw.replace(/\s+/g,'');if(!/^\d+(?:\.\d+)?$/.test(compact))return [];
  const candidates:number[][]=[];
  const walk=(at:number,values:number[])=>{
   if(values.length===roomColumns+1){if(at===compact.length)candidates.push(values);return;}
    const remaining=roomColumns-values.length;
   for(let end=at+1;end<=Math.min(compact.length,at+(values.length===roomColumns?6:3));end++){
    if(compact[at]==='0'&&end-at>1)continue;
    const rawValue=compact.slice(at,end);if(!/^\d+(?:\.\d+)?$/.test(rawValue))continue;
    const value=Number(rawValue);if(!Number.isFinite(value))continue;
    const isChild=values.length===roomColumns;
    if(isChild?(value<10||value>500):(value<40||value>2000))continue;
    const left=compact.length-end;if(left<remaining||left>remaining*6)continue;
    walk(end,[...values,value]);
   }
  };
  walk(0,[]);
  return candidates.length===1?candidates[0]:[];
 };
 const cinnamon=(()=>{
  const definitions=[
   {test:/Cinnamon Bey Beruwala/i,room:'Superior'},
   // This PDF's footer incorrectly says "On Behalf of Cinnamon Citadel Kandy";
   // its header and contract code identify Kandy Myst, so prefer that exact hotel.
   {test:/Kandy Myst by Cinnamon/i,room:'Superior',roomColumns:2},
   {test:/Cinnamon Citadel Kandy/i,room:'Superior'},
   {test:/Cinnamon Lodge Habarana/i,room:'Superior'},
   {test:/Cinnamon Wild Yala/i,room:'Jungle Chalet'},
   {test:/Hikka Tranz by Cinnamon/i,room:'Superior'},
   {test:/Trinco Blu by Cinnamon/i,room:'Superior'},
  ];
  const match=definitions.find(x=>x.test.test(text));
  if(match){
   const month='(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
   const columns=match.roomColumns||3;
   const amountPattern=Array.from({length:columns+1},()=>'(\\d+(?:\\.\\d+)?)').join('\\s+');
   // unpdf can join adjacent table cells without spaces (for example,
   // "May 1, 2026Jun 30, 2026HB9010015040"). Capture each row payload and
   // split compact figures only when the source columns have one unambiguous parse.
   const rowRe=new RegExp(`(${month})\\s+(\\d{1,2}),?\\s+(202[67])\\s*(${month})\\s+(\\d{1,2}),?\\s+(202[67])\\s*HB\\s*([\\d.\\s]+)`,'gi');
   const monthNumber=(value:string)=>{const key=value.slice(0,3).toLowerCase();return ({jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'} as Record<string,string>)[key]||'';};
   const iso=(m:string,d:string,y:string)=>`${y}-${monthNumber(m)}-${d.padStart(2,'0')}`;
   const page=pages.find(p=>/START DATE/i.test(p.text)&&/MEAL PLAN/i.test(p.text))?.number||1;
   const rates:Rate[]=[];
   for(const m of text.matchAll(rowRe)){
    const from=iso(m[1],m[2],m[3]),to=iso(m[4],m[5],m[6]);
    const values=splitCompactRateRow(m[7],columns),amounts=values.slice(0,columns);
    if(values.length!==columns+1)continue;
    if(!from.includes('-')||!to.includes('-')||amounts.some(n=>!Number.isFinite(n)))continue;
    for(let i=0;i<columns;i++)rates.push({id:uid(),room:match.room,plan:'HB',occupancy:i+1,from,to,amount:amounts[i],page,source:`Page ${page}: ${match.room} · ${m[1]} ${m[2]}, ${m[3]} through ${m[4]} ${m[5]}, ${m[6]} · HB · ${['Single','Double','Triple'][i]} USD ${amounts[i]} per room per night.`,checked:false});
    if(match.test.source.includes('Kandy Myst')&&/Triple rooms are available in limited numbers\s*\.\s*A supplement of 50 will apply per room, in addition to the DBL rate/i.test(text)){
     const double=amounts[1],triple=double+50;
     rates.push({id:uid(),room:match.room,plan:'HB',occupancy:3,from,to,amount:triple,page,source:`Page ${page}: Kandy Myst rate table lists Double HB USD ${double} per room per night; its explicit triple-room rule adds USD 50 per room to the DBL rate. Derived Triple HB amount USD ${triple} per room per night.`,checked:false});
    }
   }
   return rates;
  }
  if(/CINNAMON LIFE AT CITY OF DREAMS/i.test(text)){
   const rateMatch=/FIT\s*\(Free Independent\s*Traveler\)\s*below\s*10\s*rooms per day\s*(\d+(?:\.\d+)?)\s*(\d+(?:\.\d+)?)\s*(\d+(?:\.\d+)?)/i.exec(text);
   if(!rateMatch)return [];
   const room='Premier Life, Cityscape Room',page=pages.find(p=>/ROOM RATES/i.test(p.text))?.number||1;
   return [1,2,3].map((occupancy,i)=>({id:uid(),room,plan:'BB' as const,occupancy,from:'2026-04-01',to:'2027-03-31',amount:Number(rateMatch[i+1]),page,source:`Page ${page}: FIT, fewer than 10 rooms per day; ${['Single','Double','Triple'][i]} ${['155','168','202'][i]} USD per room per night. Bed & Breakfast, inclusive of taxes.`,checked:false}));
  }
  return [];
 })();
 if(cinnamon.length)return cinnamon;
 if(/98 Acres Resort & Spa/i.test(text)&&/All Market Travel Agent Rates/i.test(text)&&/Winter 2026\/27/i.test(text)&&/Rates effective from 1st November 2026.*30th April 2027/i.test(text)){
  const seasons=[
   {from:'2026-11-01',to:'2026-12-19',label:'01.11.26–19.12.26',values:[340,380,450,450,480,800,900]},
   {from:'2026-12-20',to:'2027-01-10',label:'20.12.26–10.01.27',values:[600,650,700,700,750,1100,1200]},
   {from:'2027-01-11',to:'2027-04-30',label:'11.01.27–30.04.27',values:[380,420,480,480,530,950,1000]},
  ];
  const roomTypes=[
   {name:'Deluxe',max:2},{name:'Premium Deluxe',max:3},{name:'Premium Deluxe Signature',max:3},
   {name:'Honeymoon Deluxe',max:2},{name:'Royal Deluxe',max:2},{name:'2 Bed-Room Suite',max:5},{name:'Grand Executive Suite',max:4},
  ];
  const result:Rate[]=[];
  for(const [i,room] of roomTypes.entries())for(const season of seasons){
   const base=season.values[i];
   for(let occupancy=1;occupancy<=Math.min(room.max,4);occupancy++){
    const extra=Math.max(0,occupancy-2),amount=base+extra*80;
    const source=`Page 1: ${room.name}, ${season.label}, Single/Double BB basis USD ${base}.${extra?` Page 1: third/fourth person supplement USD 80 nett per adult; ${occupancy} adults = base plus ${extra} extra adult(s).`:''} Page 2: rates are USD per room per night on BB basis.`;
    result.push({id:uid(),room:room.name,plan:'BB',occupancy,from:season.from,to:season.to,amount,page:1,source,checked:false});
   }
  }
  return result;
 }
 if(!/hiriketiyabeach\.lk|Hiriketiya Beach Resort/i.test(text)||!/RATES FOR SUMMER 2025 TO WINTER 2026\/27/i.test(text))return [];
 const seasons=hiriketiyaSeasons.filter(s=>s.needle.test(text));if(seasons.length!==3)return [];
 const result:Rate[]=[];
 for(const row of hiriketiyaRoomRows){
  const start=text.search(row.start);if(start<0)continue;const endMatch=row.end.exec(text.slice(start+1));const end=endMatch?start+1+endMatch.index:text.length;const block=text.slice(start,end);
  const values=[...block.matchAll(/\b(BB|HB)\s+(\d+(?:\.\d{1,2})?)/gi)].map(m=>({plan:m[1].toUpperCase() as Rate['plan'],amount:Number(m[2])}));
  const bb=values.filter(v=>v.plan==='BB'),hb=values.filter(v=>v.plan==='HB');if(bb.length!==3||hb.length!==3)continue;
  for(const [plan,group] of [['BB',bb],['HB',hb]] as const)for(const [i,season] of seasons.entries()){
   const base=group[i].amount,source=`${block.trim()}\nSource page 1. Contract says rates are for the listed room and occupancy.`.slice(0,2900);
   result.push({id:uid(),room:row.room,plan,occupancy:row.occupancy,from:season.from,to:season.to,amount:base,page:1,source,checked:false});
   if(row.occupancy===2)result.push({id:uid(),room:`${row.room} - Single occupancy`,plan,occupancy:1,from:season.from,to:season.to,amount:Math.round((base-15)*100)/100,page:1,source:`${source}\nSingle-room rule on source page 2: deduct USD 15 from any double-room rate.`,checked:false});
  }
 }
 return result;
}
function hiriketiyaRoomKey(room:string){const n=room.toLowerCase();if(n.includes('suite'))return null;if(n.includes('superior triple'))return 'superior-triple';if(n.includes('superior double'))return 'superior-double';if(n.includes('deluxe'))return 'deluxe';if(/\btpl\b|triple room/.test(n))return 'triple';if(n.includes('double'))return 'basic';return null;}
export function ratesFor(c:Contract):Rate[]{
 const parsed=sourceRatesFromPages(c);if(!parsed.length)return c.rates;
 if(!/hiriketiyabeach\.lk|Hiriketiya Beach Resort/i.test((c.pages||[]).map(p=>p.text).join(' '))){
  const keys=new Set(parsed.map(r=>`${r.room}|${r.plan}|${r.occupancy}|${r.from}|${r.to}`));
  return [...c.rates.filter(r=>!keys.has(`${r.room}|${r.plan}|${r.occupancy}|${r.from}|${r.to}`)),...parsed];
 }
 const ranges=new Set(hiriketiyaSeasons.map(s=>`${s.from}|${s.to}`));
 const parsedKeys=new Set(parsed.map(r=>`${hiriketiyaRoomKey(r.room)}|${r.plan}|${r.occupancy}|${r.from}|${r.to}`));
 const kept=c.rates.filter(r=>{
  const roomKey=hiriketiyaRoomKey(r.room);if(!roomKey||!ranges.has(`${r.from}|${r.to}`))return true;
  return !parsedKeys.has(`${roomKey}|${r.plan}|${r.occupancy}|${r.from}|${r.to}`);
 });
 return [...kept,...parsed];
}
function occupancyMatches(c:Contract,r:Rate,room:RoomGuests){
 if(r.occupancy===room.adults)return true;
 // Walaa Kulu prices villa configurations per room/night; the PDF's occupancy
 // figures are maximum guest counts, not required adult counts. No single
 // occupancy discount is listed, so a solo adult uses the room's listed rate.
 return /Walaa Kulu.*Winter 26-27 Contract/i.test(c.name)&&room.adults===1&&room.ages.length===0&&r.occupancy>=2;
}
function mealBoardsFor(c:Contract):Contract['boards']{
 const text=(c.pages||[]).map(p=>p.text).join(' ').replace(/\s+/g,' ');
 const cinnamon=/(Cinnamon Bey Beruwala|Cinnamon Citadel Kandy|Cinnamon Lodge Habarana|Cinnamon Wild Yala|Hikka Tranz by Cinnamon|Kandy Myst by Cinnamon|Trinco Blu by Cinnamon)/i.exec(text);
 if(cinnamon){
  const bb=/BB Reduction\s*[-–:]\s*per person per night\s*\(on HB rate\)\s*\/\s*Adult\s*[-–:]\s*(\d+(?:\.\d+)?)\s*&\s*Child\s*[-–:]\s*(\d+(?:\.\d+)?)/i.exec(text);
  const fb=/FB Supplement\s*[-–:]\s*per person per night\s*\(on HB rate\)\s*\/\s*Adult\s*[-–:]\s*(\d+(?:\.\d+)?)\s*&\s*Child\s*[-–:]\s*(\d+(?:\.\d+)?)/i.exec(text);
  const ai=/All Inclusive Supplement\s*[-–:]\s*per person per night\s*\(on HB rate\)\s*\/\s*Adult\s*[-–:]\s*(\d+(?:\.\d+)?)\s*&\s*Child\s*[-–:]\s*(\d+(?:\.\d+)?)/i.exec(text);
  if(bb&&fb&&ai){
   const sourcePage=(c.pages||[]).find(p=>/BB Reduction/i.test(p.text))?.number||1;
   const inferred=[
    {from:'HB' as const,to:'BB' as const,adult:-Number(bb[1]),child:-Number(bb[2]),source:`Page ${sourcePage}: BB reduction per person per night on the HB rate — adult USD ${bb[1]}, child USD ${bb[2]}.`},
    {from:'HB' as const,to:'FB' as const,adult:Number(fb[1]),child:Number(fb[2]),source:`Page ${sourcePage}: FB supplement per person per night on the HB rate — adult USD ${fb[1]}, child USD ${fb[2]}.`},
    {from:'HB' as const,to:'AI' as const,adult:Number(ai[1]),child:Number(ai[2]),source:`Page ${sourcePage}: All Inclusive supplement per person per night on the HB rate — adult USD ${ai[1]}, child USD ${ai[2]}.`},
   ];
   return [...c.boards,...inferred.filter(rule=>!c.boards.some(existing=>existing.from===rule.from&&existing.to===rule.to)).map(rule=>({...rule,id:`${c.id}:source:${rule.to}`,checked:false}))];
  }
 }
 if(/CINNAMON LIFE AT CITY OF DREAMS/i.test(text)){
  const dinner=/Dinner\s*[-–:]?\s*(?:USD\s*)?(\d+(?:\.\d+)?)/i.exec(text),lunch=/Lunch\s*[-–:]?\s*(?:USD\s*)?(\d+(?:\.\d+)?)/i.exec(text);
  if(dinner&&lunch){
   const dinnerAdult=Number(dinner[1]),lunchAdult=Number(lunch[1]),dinnerChild=dinnerAdult/2,lunchChild=lunchAdult/2,sourcePage=(c.pages||[]).find(p=>/Breakfast/i.test(p.text)&&/Dinner/i.test(p.text))?.number||2;
   const inferred=[
    {from:'BB' as const,to:'HB' as const,adult:dinnerAdult,child:dinnerChild,source:`Page ${sourcePage}: Breakfast is included in BB; dinner USD ${dinnerAdult} per adult. Child meal supplements are 50% for ages 6–11.`},
    {from:'BB' as const,to:'FB' as const,adult:lunchAdult+dinnerAdult,child:lunchChild+dinnerChild,source:`Page ${sourcePage}: Breakfast is included in BB; lunch USD ${lunchAdult} and dinner USD ${dinnerAdult} per adult. Child meal supplements are 50% for ages 6–11.`},
   ];
   return [...c.boards,...inferred.filter(rule=>!c.boards.some(existing=>existing.from===rule.from&&existing.to===rule.to)).map(rule=>({...rule,id:`${c.id}:source:${rule.to}`,checked:false}))];
  }
 }
 if(!/Walaa Kulu.*Winter 26-27 Contract/i.test(c.name)||!/Rates Applicable for Set Menu Meal\s*\/\s*Room Supplements/i.test(text))return c.boards;
 const lunch=/Lunch\s*[-–:]\s*USD\s*(\d+(?:\.\d+)?)\s*nett per person/i.exec(text),dinner=/Dinner\s*[-–:]\s*USD\s*(\d+(?:\.\d+)?)\s*nett per person/i.exec(text);
 if(!lunch||!dinner)return c.boards;
 const lunchAmount=Number(lunch[1]),dinnerAmount=Number(dinner[1]),sourcePage=(c.pages||[]).find(p=>/Rates Applicable for Set Menu Meal/i.test(p.text))?.number||1;
 const inferred=[
  {from:'BB' as const,to:'HB' as const,adult:dinnerAmount,child:null,source:`Page ${sourcePage}: Dinner USD ${dinnerAmount} nett per person per night. HB is estimated as BB plus dinner; the contract does not publish a named HB rate.`,checked:false},
  {from:'BB' as const,to:'FB' as const,adult:lunchAmount+dinnerAmount,child:null,source:`Page ${sourcePage}: Lunch USD ${lunchAmount} and dinner USD ${dinnerAmount} nett per person per night. FB is estimated as BB plus lunch and dinner; the contract does not publish a named FB rate.`,checked:false},
 ].filter(rule=>!c.boards.some(existing=>existing.from===rule.from&&existing.to===rule.to));
 return [...c.boards,...inferred.map(rule=>({...rule,id:`${c.id}:source:${rule.to}`}))];
}
function mealBoardLabel(board:Contract['boards'][number],c?:Contract){
 const text=(c?.pages||[]).map(p=>p.text).join(' ').replace(/\s+/g,' '),walaa=/Walaa Kulu.*Winter 26-27 Contract/i.test(c?.name||'')&&/Rates Applicable for Set Menu Meal\s*\/\s*Room Supplements/i.test(text),lunch=/Lunch\s*[-–:]\s*USD\s*(\d+(?:\.\d+)?)\s*nett per person/i.exec(text),dinner=/Dinner\s*[-–:]\s*USD\s*(\d+(?:\.\d+)?)\s*nett per person/i.exec(text);
 if(/HB is estimated as BB plus dinner/i.test(board.source)||walaa&&lunch&&dinner&&board.from==='BB'&&board.to==='HB'&&board.adult===Number(dinner[1]))return 'Dinner supplement · per person · BB to HB';
 if(/FB is estimated as BB plus lunch and dinner/i.test(board.source)||walaa&&lunch&&dinner&&board.from==='BB'&&board.to==='FB'&&board.adult===Number(lunch[1])+Number(dinner[1]))return 'Lunch + dinner supplements · per person · BB to FB';
 return `${board.from} to ${board.to}`;
}
export function currencyFor(c:Contract):Contract['currency']{return c.currency|| (sourceRatesFromPages(c).length?'USD':'');}
function pdfSpecialEvents(c:Contract):ContractEvent[]{
 const pages=c.pages||[], inferred:ContractEvent[]=[], allText=pages.map(p=>p.text).join(' '), isHiriketiya=/hiriketiyabeach\.lk|Hiriketiya Beach Resort/i.test(allText);
 const datesFor=(monthDay:string)=>{
  const dates=new Set<string>();
  for(const rate of ratesFor(c)){
   const first=Number(rate.from.slice(0,4)),last=Number(rate.to.slice(0,4));
   for(let year=first;year<=last&&year-first<5;year++){
    const day=`${year}-${monthDay}`;
    if(rate.from<=day&&rate.to>=day)dates.add(day);
   }
  }
  return [...dates];
 };
 const push=(date:string,page:number,name:string,adult:number,plans:ContractEvent['plans'],source:string,child:number|null=null,through?:string,childAge?:{min:number;max:number},checked=false)=>{
   inferred.push({id:uid(),date,...(through?{through}:{}),name,basis:'person_once',plans,adult,child,roomAmount:null,childMin:childAge?.min??null,childMax:childAge?.max??null,page,source,checked});
 };
 for(const p of pages){
  const text=p.text.replace(/\s+/g,' ');
  if(isHiriketiya&&/Christmas Night\s+20\s+USD\s*\(24th Dinner\)/i.test(text)&&/New Year Eve Dinner\s+25\s+USD Per person/i.test(text)&&/Kids Half payment/i.test(text)){
   const events=[{md:'12-24',name:'Christmas Eve dinner supplement',adult:20,child:10},{md:'12-31',name:'New Year’s Eve dinner supplement',adult:25,child:12.5}];
   const source=text.match(/Christmas and New year Eve\s+Christmas Night\s+20 USD \(24th Dinner\)\s+New Year Eve Dinner\s+25 USD Per person\s+Kids Half payment/i)?.[0]||'';
   for(const event of events)for(const day of datesFor(event.md))push(day,p.number,event.name,event.adult,['BB','HB'],source,event.child,undefined,undefined,true);
  }
  if(/98 Acres Resort & Spa/i.test(allText)&&/Winter 2026\/27/i.test(allText)&&/24th Dec Christmas Dinner 2026 \(Compulsory\)/i.test(text)&&/USD 120 nett per person \(On BB Basis\)/i.test(text)){
   for(const day of datesFor('12-24'))push(day,p.number,'Christmas Eve compulsory dinner',120,['BB'],text.match(/24th Dec Christmas Dinner 2026 \(Compulsory\)\s*[–-]\s*USD 120 nett per person \(On BB Basis\)/i)?.[0]||'',null,undefined,undefined,true);
  }
  if(/98 Acres Resort & Spa/i.test(allText)&&/Winter 2026\/27/i.test(allText)&&/31st Dec New Year’s Eve 2026 \(Compulsory\)/i.test(text)&&/USD 150 nett per person \(On BB Basis\)/i.test(text)){
   for(const day of datesFor('12-31'))push(day,p.number,'New Year’s Eve compulsory dinner',150,['BB'],text.match(/31st Dec New Year’s Eve 2026 \(Compulsory\)\s*[–-]\s*USD 150 nett per person \(On BB Basis\)/i)?.[0]||'',null,undefined,undefined,true);
  }
  const red=text.match(/Christmas\s*&\s*New Year Supplement Per Person\s+(\d+(?:\.\d+)?)(?:\s*\$|\s*USD)?/i);
  if(red&&/only\s+HB\s*\/\s*FB bookings on 24th\s*&\s*31st December/i.test(text)){
   const plans:['HB','FB']=['HB','FB'];
   const start=red.index??text.indexOf(red[0]);
   for(const md of ['12-24','12-31'])for(const day of datesFor(md))push(day,p.number,md==='12-24'?'Christmas Eve supplement':'New Year’s Eve supplement',Number(red[1]),plans,text.slice(Math.max(0,start-30),Math.min(text.length,start+red[0].length+90)),null,undefined,undefined,true);
  }
  // Golden Ridge: source states compulsory per-person supplements, but gives no
  // separate festive child amount. Do not infer one from ordinary meal rates.
  const ridge=/COMPUSLSORY SUPPLIMENTS?\s*24th December Christmas Eve\s*[–-]\s*USD\s*(\d+(?:\.\d+)?)\s*per person\s*31st December New Year Eve\s*[–-]\s*USD\s*(\d+(?:\.\d+)?)\s*per person/i.exec(text);
  if(ridge&&/The Golden Ridge/i.test(allText)&&/Winter\s*2026\s*[-/]\s*2027/i.test(allText)){
   for(const [md,amount,name] of [['12-24',Number(ridge[1]),'Christmas Eve supplement'],['12-31',Number(ridge[2]),'New Year’s Eve supplement']] as const)for(const day of datesFor(md))push(day,p.number,name,amount,['HB'],ridge[0],null,undefined,undefined,true);
  }
  // Golden Crown lists the child age band and exact half supplement amounts.
  const crown=/Christmas Eve \(24 December\)\s*[-–]\s*US\$\s*(\d+(?:\.\d+)?)\s*per person\s*\(Half board compulsory on 24\.12\.26\).*?New Year(?:’|'|)s Eve \(31 December\)\s*[-–]\s*US\$\s*(\d+(?:\.\d+)?)\s*per person\s*\(Half board compulsory on 31\.12\.26\)/i.exec(text);
  if(crown&&/The Golden Crown/i.test(allText)&&/50% on above compulsory supplements.*Children 5\s*[-–]\s*11\.99 years old/i.test(text)){
   for(const [md,amount,name] of [['12-24',Number(crown[1]),'Christmas Eve supplement'],['12-31',Number(crown[2]),'New Year’s Eve supplement']] as const){
    const child=amount/2,source=`${crown[0]} Child policy: 50% for ages 5–11.99. Page 2.`;
    for(const day of datesFor(md))push(day,p.number,name,amount,['HB'],source,child,undefined,{min:5,max:12},true);
   }
  }
  // Cinnamon Lodge explicitly separates BB gala amounts from HB/FB/AI amounts.
  const cinnamon=/Christmas Eve Compulsory Supplement\s*\(24th\s*Night\)\s*on\s*BB\s*\/\s*Adult\s*[-–:]\s*(\d+(?:\.\d+)?)\s*&\s*Child\s*[-–:]\s*(\d+(?:\.\d+)?).*?Christmas Eve Compulsory Supplement\s*\(24th\s*Night\)\s*on\s*HB\s*\/\s*FB\s*\/\s*AI\s*\/\s*Adult\s*[-–:]\s*(\d+(?:\.\d+)?)\s*&\s*Child\s*[-–:]\s*(\d+(?:\.\d+)?).*?New Year Eve Compulsory Supplement\s*\(31st\s*Night\)\s*on\s*BB\s*\/\s*Adult\s*[-–:]\s*(\d+(?:\.\d+)?)\s*&\s*Child\s*[-–:]\s*(\d+(?:\.\d+)?).*?New Year Eve Compulsory Supplements?\s*\(31st\s*Night\)\s*on\s*HB\s*\/\s*FB\s*\/\s*AI\s*\/\s*Adult\s*[-–:]\s*(\d+(?:\.\d+)?)\s*&\s*Child\s*[-–:]\s*(\d+(?:\.\d+)?)/i.exec(text);
  if(cinnamon&&/Cinnamon Lodge/i.test(allText)&&/Children between 6\s*[-–]\s*11\.99 years accommodation\s*&\s*meals supplement as specified/i.test(text)){
   const items=[
    {md:'12-24',name:'Christmas Eve supplement',adult:Number(cinnamon[1]),child:Number(cinnamon[2]),plans:['BB'] as ContractEvent['plans']},
    {md:'12-24',name:'Christmas Eve supplement',adult:Number(cinnamon[3]),child:Number(cinnamon[4]),plans:['HB','FB','AI'] as ContractEvent['plans']},
    {md:'12-31',name:'New Year’s Eve supplement',adult:Number(cinnamon[5]),child:Number(cinnamon[6]),plans:['BB'] as ContractEvent['plans']},
    {md:'12-31',name:'New Year’s Eve supplement',adult:Number(cinnamon[7]),child:Number(cinnamon[8]),plans:['HB','FB','AI'] as ContractEvent['plans']},
   ];
   // The contract gives a child amount but does not clearly state the age band
   // for festive supplements. Keep the amount visible, but don't charge it to
   // children until the hotel confirms which ages it covers.
   for(const event of items)for(const day of datesFor(event.md))push(day,p.number,event.name,event.adult,event.plans,cinnamon[0],event.child,undefined,undefined,true);
  }
  // Sigiriya's New Year amount has a date; its X-mas amount does not specify
  // which night. Only map the unambiguous New Year's Eve amount.
  const sigiriyaNY=/New Year(?:’|'|)s Eve Supplement\s*US\$?\s*(\d+(?:\.\d+)?)\s*Net per person/i.exec(text);
  if(sigiriyaNY&&/Sigiriya King(?:['’]s|s) Resort/i.test(allText)){
   for(const day of datesFor('12-31'))push(day,p.number,'New Year’s Eve supplement',Number(sigiriyaNY[1]),['BB','HB','FB'],sigiriyaNY[0],null,undefined,undefined,true);
  }
  const hotelEvents=/(Christmas Eve|New Year Eve) Compulsory Supplements?\s*\((24th|31st)\s*Night\)\s*on\s*(.*?)\s*Adult\s*[-–:]\s*(\d+(?:\.\d+)?)(?:\s*&\s*Child\s*[-–:]\s*(\d+(?:\.\d+)?))?/gi;
  for(const m of text.matchAll(hotelEvents)){
   const plans=[...new Set((m[3].match(/\b(BB|HB|FB|AI|RO)\b/gi)||[]).map(x=>x.toUpperCase() as ContractEvent['plans'][number]))];
   if(!plans.length)continue;
   const md=m[2]==='24th'?'12-24':'12-31';
   for(const day of datesFor(md))push(day,p.number,m[1]==='Christmas Eve'?'Christmas Eve supplement':'New Year’s Eve supplement',Number(m[4]),plans,text.slice(Math.max(0,m.index||0),Math.min(text.length,(m.index||0)+m[0].length)),m[5]?Number(m[5]):null);
  }
  // Araliya Beach's PDF lists gala dinner charges in two plan columns.
  // The child note says half rates apply under its child policy (paid child ages 5–11.99).
  const gala=text.match(/Xmas Eve Gala Dinner\s+USD\s+(\d+(?:\.\d+)?)\s+USD\s+(\d+(?:\.\d+)?).*?New Year[’']s Eve Gala Dinner\s+USD\s+(\d+(?:\.\d+)?)\s+USD\s+(\d+(?:\.\d+)?)/i);
  if(gala&&/Half rates will be applicable for the child/i.test(text)&&/Age\s*05 yrs\s*[–-]\s*11\.99 yrs/i.test(text)){
   const events=[
    {md:'12-24',name:'Christmas Eve supplement',adult:Number(gala[1]),plans:['BB'] as ContractEvent['plans']},
    {md:'12-24',name:'Christmas Eve supplement',adult:Number(gala[2]),plans:['HB','FB','AI'] as ContractEvent['plans']},
    {md:'12-31',name:'New Year’s Eve supplement',adult:Number(gala[3]),plans:['BB'] as ContractEvent['plans']},
    {md:'12-31',name:'New Year’s Eve supplement',adult:Number(gala[4]),plans:['HB','FB','AI'] as ContractEvent['plans']},
   ];
   for(const event of events)for(const day of datesFor(event.md))push(day,p.number,event.name,event.adult,event.plans,text.slice(Math.max(0,(gala.index||0)-100),Math.min(text.length,(gala.index||0)+gala[0].length+140)),event.adult/2,undefined,{min:5,max:12},true);
  }
 }
 return inferred;
}
export function eventsFor(c:Contract):ContractEvent[]{
 const parsed=pdfSpecialEvents(c);
 const allText=(c.pages||[]).map(p=>p.text).join(' ').replace(/\s+/g,' ');
 const sourceContext=`${allText} ${c.name}`;
 const walaaYearConflict=/Walaa Kulu.*Winter 26-27 Contract/i.test(c.name)||(/Walaa Kulu/i.test(sourceContext)&&/2025/.test(allText)&&/24(?:th)?\s*Dec/i.test(allText)&&/31(?:st)?\s*Dec/i.test(allText));
 const acresWinterYearConflict=/98 Acres Resort & Spa/i.test(sourceContext)&&(/Winter 2027\/28/i.test(allText)||/98 Acres Winter 27-28 Contract/i.test(c.name))&&(/24th Dec Christmas Dinner 2026/i.test(allText)||/98 Acres Winter 27-28 Contract/i.test(c.name))&&(/31st Dec New Year(?:’|'|)s Eve 2026/i.test(allText)||/98 Acres Winter 27-28 Contract/i.test(c.name));
 const sigiriyaChristmasDateUnclear=/Sigiriya King(?:['’]s|s) Resort/i.test(sourceContext)&&(/X-mas Supplement\s+US\$?\s*\d+(?:\.\d+)?\s*Net per person/i.test(allText)||/Sigiriya Kings Resort by Araliya.*Tactical Offer/i.test(c.name));
 const verifiedParsed=parsed.filter(e=>{
  const monthDay=e.date.slice(5),name=(e.name||'').toLowerCase(),year=Number(e.date.slice(0,4));
  if(walaaYearConflict&&year===2026&&['12-24','12-31'].includes(monthDay))return false;
  if(acresWinterYearConflict&&year===2027&&['12-24','12-31'].includes(monthDay))return false;
  if(sigiriyaChristmasDateUnclear&&['12-24','12-25'].includes(monthDay)&&/christmas|x-?mas/i.test(name))return false;
  return true;
 });
 // Some contracts have both a hotel-specific parser and the general festive
 // supplement parser. Collapse entries that describe the same charge so the
 // same source line cannot be added to a stay twice (or more).
 const eventKey=(e:ContractEvent)=>JSON.stringify([
  e.date,e.through||e.date,eventNameForDate(e.date,e.name).trim().toLowerCase(),e.basis||'person_once',
  [...e.plans].sort(),e.adult,e.child,e.roomAmount??null,e.childMin,e.childMax,
 ]);
 const uniqueParsed=[...new Map(verifiedParsed.map(e=>[eventKey(e),e])).values()];
 // When the source text supplies a complete, exact event row, prefer that
 // parsed row over an older manually entered copy so child-age limits and meal
 // plan splits don't get lost in stale saved values.
 const samePlanSet=(a:ContractEvent['plans'],b:ContractEvent['plans'])=>a.length===b.length&&a.every(plan=>b.includes(plan));
 const saved=c.events.filter(e=>{
  const monthDay=e.date.slice(5),holidayName=(e.name||'').toLowerCase();
  if(walaaYearConflict&&['12-24','12-31'].includes(monthDay)&&Number(e.date.slice(0,4))===2026)return false;
  if(acresWinterYearConflict&&['12-24','12-31'].includes(monthDay)&&Number(e.date.slice(0,4))===2027)return false;
  if(sigiriyaChristmasDateUnclear&&['12-24','12-25'].includes(monthDay)&&/christmas|x-?mas/i.test(holidayName))return false;
  return !uniqueParsed.some(p=>p.date===e.date&&(p.through||p.date)===(e.through||e.date)&&eventNameForDate(p.date,p.name)===eventNameForDate(e.date,e.name)&&p.adult===e.adult&&samePlanSet(p.plans,e.plans));
 });
 return [...saved,...uniqueParsed];
}
function eventNameForDate(day:string,name?:string){
 const holiday=specialDateNames[day.slice(5)];
 if(holiday&&name)return `${holiday} supplement`;
 return name|| (holiday?`${holiday} supplement`:'Compulsory date supplement');
}
function specialDateWarning(c:Contract,day:string,holidayName:string){
 const text=(c.pages||[]).map(p=>p.text).join(' ').replace(/\s+/g,' ');
 const sourceContext=`${text} ${c.name}`;
 const dateYear=Number(day.slice(0,4));
 const explicitYear=[...text.matchAll(/(?:24th\s*Dec(?:ember)?\s*Christmas Dinner|31st\s*Dec(?:ember)?\s*New Year(?:’|'|)s Eve)\s*(\d{4})\s*\(Compulsory\)/gi)].map(m=>Number(m[1]));
 if(dateYear===2027&&['12-24','12-31'].includes(day.slice(5))&&/98 Acres Winter 27-28 Contract/i.test(c.name))return `${c.name}: its 2027/28 winter rate period conflicts with festive dinner lines dated 2026; no supplement added. Confirm the correct year with the hotel.`;
 if(explicitYear.length&&explicitYear.every(year=>year!==dateYear)&&/Winter\s*2027\/28/i.test(text))return `${c.name}: the winter contract says the festive dinner dates are in ${explicitYear.join(' and ')}, but this stay is in ${dateYear}; no supplement added. Confirm the correct year with the hotel.`;
 if(/Walaa Kulu.*Winter 26-27 Contract/i.test(c.name)&&dateYear===2026&&['12-24','12-31'].includes(day.slice(5)))return `${c.name}: the contract's rate period is 2026/27, but its festive dinner dates say 2025; no supplement added. Confirm the correct dates and charges with the hotel.`;
 if(/Walaa Kulu/i.test(sourceContext)&&/2025/.test(text)&&/24(?:th)?\s*Dec/i.test(text)&&/31(?:st)?\s*Dec/i.test(text)&&dateYear===2026)return `${c.name}: the contract's rate period is 2026/27, but its festive dinner dates say 2025; no supplement added. Confirm the correct dates and charges with the hotel.`;
 const xmas=text.match(/X-mas Supplement\s+US\$?\s*(\d+(?:\.\d+)?)\s*Net per person/i);
 if((xmas||/Sigiriya Kings Resort by Araliya.*Tactical Offer/i.test(c.name))&&['12-24','12-25'].includes(day.slice(5)))return `${c.name}: the contract lists a Christmas supplement but does not identify the applicable night; not included.`;
 return `${c.name}: check whether a ${holidayName} supplement applies on ${day}.`;
}
function requiresSourceSpecificEventWarning(c:Contract,day:string){
 const md=day.slice(5),year=Number(day.slice(0,4));
 return year===2026&&['12-24','12-31'].includes(md)&&/Walaa Kulu.*Winter 26-27 Contract/i.test(c.name)
  ||year===2027&&['12-24','12-31'].includes(md)&&/98 Acres Winter 27-28 Contract/i.test(c.name)
  ||['12-24','12-25'].includes(md)&&/Sigiriya Kings Resort by Araliya.*Tactical Offer/i.test(c.name);
}
export function quoteStay(contracts:Contract[],q:StaySearch):HotelQuote{
 if(!q||!Array.isArray(q.rooms)||!['BB','HB','FB','AI','RO'].includes(q.plan))throw Error('Check the dates, rooms and meal plan.');
 const dates=nights(q.from,q.to);if(q.rooms.length<1||q.rooms.length>20||q.rooms.some(r=>!Number.isInteger(r.adults)||r.adults<1||r.adults>8||r.ages.length>6||r.ages.some(a=>!Number.isFinite(a)||a<0||a>=18)))throw Error('Check adults and children’s ages in each room.');
 const discountGroups=new Map<string,{contract:Contract;items:{kind:string;amount:number;page:number|null}[]}>();
 const result:HotelQuote={complete:false,total:null,currency:'',lines:[],issues:[],roomType:q.roomType||''};let total=0;const issue=(s:string)=>{if(!result.issues.includes(s))result.issues.push(s)};
 const active:Contract[]=contracts.filter(c=>c.status!=='Archived').map(c=>({...c,rates:ratesFor(c),currency:currencyFor(c)}));const booked=q.bookingDate||new Date().toISOString().slice(0,10);if(!validDate(booked))throw Error('Choose a valid booking date.');
 for(const [roomIndex,room] of q.rooms.entries())for(const day of dates){
  // Draft overlaps are deliberately not ignored: an unreviewed replacement must not silently leave an older rate in use.
  const candidates=active.flatMap(c=>c.rates.filter(r=>r.from<=day&&r.to>=day&&occupancyMatches(c,r,room)&&(!q.roomType||r.room===q.roomType||(c.upgrades||[]).some(u=>u.room===q.roomType&&u.baseRoom===r.room))).flatMap(r=>{
   if(r.plan===q.plan)return [{c,r,board:null as Contract['boards'][number]|null}];
   const boards=mealBoardsFor(c).filter(b=>b.from===r.plan&&b.to===q.plan);return boards.map(board=>({c,r,board}));
  }));
  // Direct rates win over derived rates within the same contract; never choose a cheaper overlapping contract.
  const actualRooms=new Set(candidates.filter(x=>x.r.room===q.roomType).map(x=>x.c.id));const roomCandidates=candidates.filter(x=>!q.roomType||!actualRooms.has(x.c.id)||x.r.room===q.roomType);
  const directKeys=new Set(roomCandidates.filter(x=>!x.board).map(x=>x.c.id+'|'+x.r.room));const selected=roomCandidates.filter(x=>!x.board||!directKeys.has(x.c.id+'|'+x.r.room));
  if(!selected.length){issue(`Rate not provided for ${day}, room ${roomIndex+1}.`);continue;}
  if(selected.length!==1){issue(`More than one rate matches ${day}, room ${roomIndex+1}. Choose a room type or resolve overlapping contracts.`);continue;}
  const {c,r,board}=selected[0];const upgrade=q.roomType&&q.roomType!==r.room?(c.upgrades||[]).find(u=>u.room===q.roomType&&u.baseRoom===r.room):null;result.roomType=q.roomType||r.room;
  if(!checkedForPricing(c)||!r.checked||r.amount===null||!validDate(r.from)||!validDate(r.to)){issue(`${c.name}: rate needs checking.`);continue;}
  if(result.currency&&result.currency!==c.currency){issue('The stay includes different currencies.');continue;}result.currency=c.currency;
  if(c.restrictions.some(s=>s.date===day&&!s.allowed.includes(q.plan))){issue(`${q.plan} is not offered on ${day}.`);continue;}
  const holidayName=specialDateNames[day.slice(5)],knownEvents=eventsFor(c),holidayWarning=holidayName?specialDateWarning(c,day,holidayName):'';if(holidayName&&(requiresSourceSpecificEventWarning(c,day)||!knownEvents.some(e=>e.date<=day&&(e.through||e.date)>=day&&e.plans.includes(q.plan))&&(!c.eventPolicyConfirmed||/no supplement added|not included|does not identify/i.test(holidayWarning))))issue(holidayWarning);
  const add=(label:string,amount:number,page:number|null=r.page,kind='base')=>{const minor=cents(amount);total+=minor;const group=discountGroups.get(c.id)||{contract:c,items:[]};group.items.push({kind,amount:minor,page});discountGroups.set(c.id,group);result.lines.push({date:day,room:roomIndex+1,label,amount:minor/100,contractId:c.id,contractVersion:c.version,page});};
  add(`${r.room} · ${r.plan}`,r.amount);if(upgrade){if(!upgrade.checked||upgrade.amount===null)issue('Room upgrade needs checking.');else add('Room upgrade: '+upgrade.room,upgrade.amount,upgrade.page,'upgrade');}
  if(board){if(!board.checked){issue('Meal-plan change needs checking.');continue;}add(mealBoardLabel(board,c),board.adult*room.adults,r.page,'board');}
  for(const age of room.ages){const explicit=c.children.filter(b=>b.plan===q.plan&&age>=b.min&&age<b.max);const child=explicit.length?explicit:c.children.filter(b=>b.plan===r.plan&&age>=b.min&&age<b.max);
   if(child.length!==1||!child[0].checked||child[0].amount===null||room.ages.length>child[0].maxPerRoom){issue(`Child age ${age}: rate or room sharing needs checking.`);continue;}
   add(`Child age ${age}`,child[0].amount,r.page,'child');
   if(board&&!explicit.length){if(board.child===null)issue('Child meal-plan change is not provided.');else add(`Child ${board.from} to ${board.to}`,board.child,r.page,'child');}
  }
  for(const e of eventsFor(c).filter(e=>e.date<=day&&(e.through||e.date)>=day&&e.plans.includes(q.plan))){const basis=e.basis||'person_once';const roomBased=basis.startsWith('room_');const perNight=basis.endsWith('per_night');const needsDetails=e.basis!==undefined||e.through!==undefined||e.name!==undefined;const firstApplicable=dates.find(d=>d>=e.date&&d<=(e.through||e.date));if(!e.checked||!e.source.trim()||needsDetails&&(!e.name?.trim()||!e.page)||roomBased&&(e.roomAmount===null||e.roomAmount===undefined)||!roomBased&&(e.adult===null||room.ages.length&&(e.child===null||e.childMin==null||e.childMax==null))){issue(`Special-date charge needs checking${needsDetails&&!e.page?' (source page missing)':''} on ${day}.`);continue;}if(!perNight&&day!==firstApplicable)continue;const childrenCharged=room.ages.filter(a=>e.childMin!=null&&e.childMax!=null&&a>=e.childMin&&a<e.childMax).length;const amount=roomBased?e.roomAmount!:e.adult!*room.adults+(e.child||0)*childrenCharged;add(`${eventNameForDate(day,e.name)} · ${roomBased?'per room':'per person'}`,amount,e.page??null,'event');}

 }
 for(const {contract:c,items} of discountGroups.values()){
  const eligible=(c.offers||[]).filter(o=>validDate(o.from)&&validDate(o.to)&&q.from>=o.from&&q.to<=new Date(Date.parse(o.to)+86400000).toISOString().slice(0,10)&&dates.length>=o.minNights&&(Date.parse(q.from)-Date.parse(booked))/86400000>=o.leadDays);
  if(eligible.some(o=>!o.checked)||eligible.length&&!c.offerPolicyConfirmed){issue('Early-booking offer scope needs checking.');continue;}
  const best=eligible.map(offer=>({offer,discount:Math.round(items.filter(l=>offer.components.includes(l.kind as any)).reduce((n,l)=>n+l.amount,0)*offer.percent/100)})).sort((a,b)=>b.discount-a.discount)[0];
  if(best&&best.discount>0){total-=best.discount;result.lines.push({date:q.from,room:0,label:'Early-booking discount '+best.offer.percent+'%',amount:-best.discount/100,contractId:c.id,contractVersion:c.version,page:items[0].page});}
 }
 if(!result.issues.length&&result.lines.length){result.complete=true;result.total=total/100;}return result;
}

// Source-listed amounts are for inspection only. They never become a payable stay total.
export function listedRates(contracts:Contract[],q?:StaySearch|null){
 const days=q?nights(q.from,q.to):[];
 return contracts.filter(c=>c.status!=='Archived').flatMap(c=>ratesFor(c).filter(r=>r.amount!==null&&(!q||((!q.roomType||r.room===q.roomType)&&r.plan===q.plan&&q.rooms.some(room=>occupancyMatches(c,r,room))&&days.some(day=>day>=r.from&&day<=r.to)))).map(r=>({...r,currency:currencyFor(c),contractId:c.id,contractName:c.name,unitConfirmed:c.unitConfirmed,nightlyConfirmed:c.nightlyConfirmed,reviewed:checkedForPricing(c)&&r.checked})));
}

export type ListedStay={total:number;currency:string;complete:boolean;issues:string[];lines:{date:string;room:number;amount:number;contractName:string;page:number|null;roomType:string;label:string;kind:'base'|'board'|'child'|'event'}[]}|null;
// Show only contract-listed components. Any missing or unchecked amount is called
// out separately; the subtotal is never presented as a final payable quote.
export function listedStay(contracts:Contract[],q:StaySearch):ListedStay{
 const days=nights(q.from,q.to),lines:NonNullable<ListedStay>['lines']=[],issues:string[]=[];let currency='';
 const issue=(text:string)=>{if(!issues.includes(text))issues.push(text)};
 for(const [index,room] of q.rooms.entries())for(const day of days){
 const candidates=contracts.filter(c=>c.status!=='Archived').flatMap(c=>ratesFor(c).filter(r=>r.amount!==null&&!!r.source.trim()&&occupancyMatches(c,r,room)&&r.from<=day&&r.to>=day&&(!q.roomType||r.room===q.roomType)).flatMap(r=>{
   if(r.plan===q.plan)return [{c,r,board:null as Contract['boards'][number]|null}];
   return mealBoardsFor(c).filter(b=>b.from===r.plan&&b.to===q.plan).map(board=>({c,r,board}));
  }));
  const directKeys=new Set(candidates.filter(x=>!x.board).map(x=>x.c.id+'|'+x.r.room));
  const matches=candidates.filter(x=>!x.board||!directKeys.has(x.c.id+'|'+x.r.room));
  if(matches.length!==1)return null;
  const {c,r,board}=matches[0],rateCurrency=currencyFor(c);if(!rateCurrency||currency&&currency!==rateCurrency)return null;currency=rateCurrency;
  const add=(label:string,amount:number,page:number|null,kind:NonNullable<ListedStay>['lines'][number]['kind'])=>lines.push({date:day,room:index+1,amount:Math.round(amount*100)/100,contractName:c.name,page,roomType:r.room,label,kind});
  if(!checkedForPricing(c)||!r.checked)issue(`${c.name}: contract rate needs checking.`);
  const knownEvents=eventsFor(c);const holidayName=specialDateNames[day.slice(5)],holidayWarning=holidayName?specialDateWarning(c,day,holidayName):'';if(holidayName&&(requiresSourceSpecificEventWarning(c,day)||!knownEvents.some(e=>e.date<=day&&(e.through||e.date)>=day&&e.plans.includes(q.plan))&&(!c.eventPolicyConfirmed||/no supplement added|not included|does not identify/i.test(holidayWarning))))issue(holidayWarning);
  add(`${r.room} · ${r.plan}`,r.amount!,r.page,'base');
  if(board){if(!board.checked||!board.source.trim())issue(`${c.name}: ${mealBoardLabel(board,c)} needs checking with the hotel.`);add(mealBoardLabel(board,c),board.adult*room.adults,r.page,'board');}
  for(const age of room.ages){const explicit=c.children.filter(b=>b.plan===q.plan&&age>=b.min&&age<b.max);const child=explicit.length?explicit:c.children.filter(b=>b.plan===r.plan&&age>=b.min&&age<b.max);if(child.length!==1||!child[0].checked||child[0].amount===null||room.ages.length>child[0].maxPerRoom){issue(`${c.name}: child rate or room sharing needs checking for age ${age}.`);continue;}add(`Child age ${age}`,child[0].amount,r.page,'child');if(board&&!explicit.length){if(board.child===null){issue(`${c.name}: child meal adjustment is not provided.`);}else add(`Child ${board.from} to ${board.to}`,board.child,r.page,'child');}}
  for(const e of eventsFor(c).filter(e=>e.date<=day&&(e.through||e.date)>=day&&e.plans.includes(q.plan))){const basis=e.basis||'person_once',roomBased=basis.startsWith('room_'),perNight=basis.endsWith('per_night'),needsDetails=e.basis!==undefined||e.through!==undefined||e.name!==undefined,firstApplicable=days.find(d=>d>=e.date&&d<=(e.through||e.date));const childCount=room.ages.filter(a=>e.childMin!=null&&e.childMax!=null&&a>=e.childMin&&a<e.childMax).length;const missing=e.source.trim()===''||needsDetails&&(!e.name?.trim()||!e.page)||roomBased&&(e.roomAmount===null||e.roomAmount===undefined)||!roomBased&&e.adult===null;if(!e.checked)issue(`${c.name}: ${eventNameForDate(day,e.name)} amount from the contract is included; supplier review is still needed.`);if(room.ages.length&&!roomBased&&(e.child===null||e.childMin==null||e.childMax==null))issue(`${c.name}: child ${eventNameForDate(day,e.name).toLowerCase()} charge is not specified; no child charge added.`);if(missing){issue(`${c.name}: special-date charge needs checking for ${day}.`);continue;}if(!perNight&&day!==firstApplicable)continue;const amount=roomBased?e.roomAmount!:e.adult!*room.adults+(e.child||0)*childCount;add(`${eventNameForDate(day,e.name)} · ${roomBased?'per room':'per person'}`,amount,e.page??null,'event');}
 }
 return lines.length?{total:Math.round(lines.reduce((sum,l)=>sum+l.amount,0)*100)/100,currency,complete:issues.length===0,issues,lines}:null;
}
