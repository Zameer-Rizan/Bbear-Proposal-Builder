import {z} from 'zod';
const id=z.string().uuid();
export const moneyValue=z.number().nonnegative().max(1e8).nullable();
export const Plan=z.enum(['BB','HB','FB','AI','RO']);
export const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(validDate,'Choose a real calendar date');
export const RateSchema=z.object({id,room:z.string().min(1).max(180),plan:Plan,occupancy:z.number().int().min(1).max(8),from:date,to:date,amount:moneyValue,page:z.number().int().min(1),source:z.string().max(3000),checked:z.boolean()}).refine(r=>r.from<=r.to,'End date must follow start date');
export const MealSchema=z.object({id,label:z.string().max(100),adult:moneyValue,child:moneyValue,unit:z.string().max(160),note:z.string().max(1000),page:z.number().int().min(1)});
export const ChildSchema=z.object({id,min:z.number().min(0).max(18),max:z.number().min(0).max(18),maxPerRoom:z.number().int().min(0).max(6),plan:Plan,amount:moneyValue,source:z.string().max(2000),checked:z.boolean()}).refine(r=>r.min<r.max,'Child age range is invalid');
export const OfferSchema=z.object({id,from:date,to:date,leadDays:z.number().int().min(0).max(1000),minNights:z.number().int().min(1).max(60),percent:z.number().min(0).max(100),components:z.array(z.enum(['base','board','child','event','upgrade'])).min(1),source:z.string().max(2000),checked:z.boolean()}).refine(o=>o.from<=o.to,'Check offer travel dates');
export const UpgradeSchema=z.object({id,room:z.string().min(1).max(180),baseRoom:z.string().min(1).max(180),amount:moneyValue,page:z.number().int().min(1),source:z.string().max(2000),checked:z.boolean()}).refine(u=>u.room!==u.baseRoom,'Choose a different upgraded room');
export const EventSchema=z.object({id,date,through:date.optional(),name:z.string().max(160).optional(),basis:z.enum(['person_once','person_per_night','room_once','room_per_night']).optional(),plans:z.array(Plan).min(1),adult:moneyValue,child:moneyValue,roomAmount:moneyValue.optional(),childMin:z.number().min(0).max(18).nullable().default(null),childMax:z.number().min(0).max(18).nullable().default(null),page:z.number().int().min(1).optional(),source:z.string().max(2000),checked:z.boolean()}).refine(e=>(!e.through||e.date<=e.through),'Last applicable night must be on or after the first night').refine(e=>e.childMin===null&&e.childMax===null||e.childMin!==null&&e.childMax!==null&&e.childMin<e.childMax,'Check the child charge age range');
export const BoardSchema=z.object({id,from:Plan,to:Plan,adult:z.number().min(-1e6).max(1e6),child:z.number().min(-1e6).max(1e6).nullable(),source:z.string().max(2000),checked:z.boolean()}).refine(b=>b.from!==b.to,'Choose different meal plans');
export const HotelSchema=z.object({id,version:z.number().int().nonnegative(),name:z.string().min(1).max(180),place:z.string().max(120),stars:z.number().int().min(1).max(5).nullable(),starSource:z.string().max(400),photo:z.string().max(500),updated:z.string()}).refine(h=>!h.stars||!!h.starSource.trim(),'Add the source for the star category');
export const ContractSchema=z.object({id,version:z.number().int().nonnegative(),hotelId:id,name:z.string().min(1).max(220),sha:z.string().regex(/^[a-f0-9]{64}$/),fileKey:z.string().max(200),mime:z.string().max(100),status:z.enum(['Draft','Reviewed','Archived']),currency:z.enum(['USD','LKR','INR','']),unitConfirmed:z.boolean(),nightlyConfirmed:z.boolean(),offers:z.array(OfferSchema).max(100).default([]),offerPolicyConfirmed:z.boolean().default(false),upgrades:z.array(UpgradeSchema).max(50).default([]),rates:z.array(RateSchema).max(1500),meals:z.array(MealSchema).max(80),children:z.array(ChildSchema).max(100),events:z.array(EventSchema).max(100),boards:z.array(BoardSchema).max(50),restrictions:z.array(z.object({date,allowed:z.array(Plan).min(1),source:z.string().max(1000)})).max(100),issues:z.array(z.object({id,text:z.string().max(3000),resolution:z.string().max(3000)})).max(200),notes:z.string().max(30000),pages:z.array(z.object({number:z.number().int().min(1),text:z.string().max(60000)})).max(60),readStatus:z.string().max(200),updated:z.string()});
export type Hotel=z.infer<typeof HotelSchema>;export type Contract=z.infer<typeof ContractSchema>;export type Rate=z.infer<typeof RateSchema>;export type Meal=z.infer<typeof MealSchema>;
export const uid=()=>crypto.randomUUID();
export function blankHotel(name='New hotel'):Hotel{return {id:uid(),version:0,name,place:'',stars:null,starSource:'',photo:'',updated:new Date().toISOString()};}
export function blankContract(hotelId:string,name:string,sha:string):Contract{return {id:uid(),version:0,hotelId,name,sha,fileKey:'',mime:'',status:'Draft',currency:'',unitConfirmed:false,nightlyConfirmed:false,offers:[],offerPolicyConfirmed:false,upgrades:[],rates:[],meals:[],children:[],events:[],boards:[],restrictions:[],issues:[],notes:'',pages:[],readStatus:'Uploaded',updated:new Date().toISOString()};}
export function checkedForPricing(c:Contract){return c.status==='Reviewed'&&!!c.currency&&c.unitConfirmed&&c.nightlyConfirmed&&c.issues.every(i=>!!i.resolution.trim())&&(!(c.offers||[]).length||c.offerPolicyConfirmed); }
export function assertReviewed(c:Contract){if(c.status!=='Reviewed')return;if(!c.currency||!c.unitConfirmed||!c.nightlyConfirmed||!c.rates.length||c.rates.some(r=>!r.checked||r.amount===null||!r.source.trim())||c.issues.some(i=>!i.resolution.trim())||c.events.some(e=>!e.checked||!e.source.trim()||((e.basis!==undefined||e.through!==undefined||e.name!==undefined)&&(!e.name?.trim()||!e.page))||((e.basis||'person_once').startsWith('room_')?e.roomAmount===null||e.roomAmount===undefined:e.adult===null))||c.boards.some(b=>!b.checked)||c.children.some(r=>!r.checked||r.amount===null)||(c.offers||[]).some(o=>!o.checked)||((c.offers||[]).length&&!c.offerPolicyConfirmed)||(c.upgrades||[]).some(u=>!u.checked||u.amount===null||!u.source.trim()))throw Error('Check the rates, charging basis and open questions before marking this contract reviewed.');}
export function validDate(s:string){const d=new Date(s+'T00:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
export function normalizeHotelName(name:string){return name.trim().replace(/\s+/g,' ').toLowerCase();}
export function nights(from:string,to:string){if(!validDate(from)||!validDate(to))throw Error('Choose valid arrival and departure dates.');const n=(Date.parse(to)-Date.parse(from))/86400000;if(n<1||n>60)throw Error('Choose a stay between 1 and 60 nights.');return Array.from({length:n},(_,i)=>new Date(Date.parse(from)+i*86400000).toISOString().slice(0,10));}
export type RoomGuests={adults:number;ages:number[]};
export type StaySearch={from:string;to:string;plan:z.infer<typeof Plan>;rooms:RoomGuests[];roomType?:string;bookingDate?:string};
export type QuoteLine={date:string;room:number;label:string;amount:number;contractId:string;contractVersion:number;page:number|null};
export type HotelQuote={complete:boolean;total:number|null;currency:string;lines:QuoteLine[];issues:string[];roomType:string};
const cents=(n:number)=>Math.round((n+Number.EPSILON)*100);
export function quoteStay(contracts:Contract[],q:StaySearch):HotelQuote{
 if(!q||!Array.isArray(q.rooms)||!['BB','HB','FB','AI','RO'].includes(q.plan))throw Error('Check the dates, rooms and meal plan.');
 const dates=nights(q.from,q.to);if(q.rooms.length<1||q.rooms.length>20||q.rooms.some(r=>!Number.isInteger(r.adults)||r.adults<1||r.adults>8||r.ages.length>6||r.ages.some(a=>!Number.isFinite(a)||a<0||a>=18)))throw Error('Check adults and children’s ages in each room.');
 const discountGroups=new Map<string,{contract:Contract;items:{kind:string;amount:number;page:number|null}[]}>();
 const result:HotelQuote={complete:false,total:null,currency:'',lines:[],issues:[],roomType:q.roomType||''};let total=0;const issue=(s:string)=>{if(!result.issues.includes(s))result.issues.push(s)};
 const active=contracts.filter(c=>c.status!=='Archived');const booked=q.bookingDate||new Date().toISOString().slice(0,10);if(!validDate(booked))throw Error('Choose a valid booking date.');
 for(const [roomIndex,room] of q.rooms.entries())for(const day of dates){
  // Draft overlaps are deliberately not ignored: an unreviewed replacement must not silently leave an older rate in use.
  const candidates=active.flatMap(c=>c.rates.filter(r=>r.from<=day&&r.to>=day&&r.occupancy===room.adults&&(!q.roomType||r.room===q.roomType||(c.upgrades||[]).some(u=>u.room===q.roomType&&u.baseRoom===r.room))).flatMap(r=>{
   if(r.plan===q.plan)return [{c,r,board:null as Contract['boards'][number]|null}];
   const boards=c.boards.filter(b=>b.from===r.plan&&b.to===q.plan);return boards.map(board=>({c,r,board}));
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
  const add=(label:string,amount:number,page:number|null=r.page,kind='base')=>{const minor=cents(amount);total+=minor;const group=discountGroups.get(c.id)||{contract:c,items:[]};group.items.push({kind,amount:minor,page});discountGroups.set(c.id,group);result.lines.push({date:day,room:roomIndex+1,label,amount:minor/100,contractId:c.id,contractVersion:c.version,page});};
  add(`${r.room} · ${r.plan}`,r.amount);if(upgrade){if(!upgrade.checked||upgrade.amount===null)issue('Room upgrade needs checking.');else add('Room upgrade: '+upgrade.room,upgrade.amount,upgrade.page,'upgrade');}
  if(board){if(!board.checked){issue('Meal-plan change needs checking.');continue;}add(`${board.from} to ${board.to}`,board.adult*room.adults,r.page,'board');}
  for(const age of room.ages){const explicit=c.children.filter(b=>b.plan===q.plan&&age>=b.min&&age<b.max);const child=explicit.length?explicit:c.children.filter(b=>b.plan===r.plan&&age>=b.min&&age<b.max);
   if(child.length!==1||!child[0].checked||child[0].amount===null||room.ages.length>child[0].maxPerRoom){issue(`Child age ${age}: rate or room sharing needs checking.`);continue;}
   add(`Child age ${age}`,child[0].amount,r.page,'child');
   if(board&&!explicit.length){if(board.child===null)issue('Child meal-plan change is not provided.');else add(`Child ${board.from} to ${board.to}`,board.child,r.page,'child');}
  }
  for(const e of c.events.filter(e=>e.date<=day&&(e.through||e.date)>=day&&e.plans.includes(q.plan))){const basis=e.basis||'person_once';const roomBased=basis.startsWith('room_');const perNight=basis.endsWith('per_night');const needsDetails=e.basis!==undefined||e.through!==undefined||e.name!==undefined;const firstApplicable=dates.find(d=>d>=e.date&&d<=(e.through||e.date));if(!e.checked||!e.source.trim()||needsDetails&&(!e.name?.trim()||!e.page)||roomBased&&(e.roomAmount===null||e.roomAmount===undefined)||!roomBased&&(e.adult===null||room.ages.length&&(e.child===null||e.childMin==null||e.childMax==null))){issue(`Special-date charge needs checking${needsDetails&&!e.page?' (source page missing)':''} on ${day}.`);continue;}if(!perNight&&day!==firstApplicable)continue;const childrenCharged=room.ages.filter(a=>e.childMin!=null&&e.childMax!=null&&a>=e.childMin&&a<e.childMax).length;const amount=roomBased?e.roomAmount!:e.adult!*room.adults+(e.child||0)*childrenCharged;add(needsDetails?`${e.name} · ${roomBased?'per room':'per person'}`:'Compulsory date supplement · per person',amount,e.page??null,'event');}

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
 return contracts.filter(c=>c.status!=='Archived').flatMap(c=>c.rates.filter(r=>r.amount!==null&&(!q||((!q.roomType||r.room===q.roomType)&&r.plan===q.plan&&q.rooms.some(room=>room.adults===r.occupancy)&&days.some(day=>day>=r.from&&day<=r.to)))).map(r=>({...r,currency:c.currency,contractId:c.id,contractName:c.name,unitConfirmed:c.unitConfirmed,nightlyConfirmed:c.nightlyConfirmed,reviewed:checkedForPricing(c)&&r.checked})));
}

export type ListedStay={total:number;currency:string;lines:{date:string;room:number;amount:number;contractName:string;page:number;roomType:string}[]}|null;
// Published SGL/DBL/TPL room amount for the chosen adults per room.
// Display subtotal only; this never marks a supplier quote approved.
export function listedStay(contracts:Contract[],q:StaySearch):ListedStay{
 const days=nights(q.from,q.to),lines:NonNullable<ListedStay>['lines']=[];let currency='';
 for(const [index,room] of q.rooms.entries())for(const day of days){
  const matches=contracts.filter(c=>c.status!=='Archived').flatMap(c=>c.rates.filter(r=>r.amount!==null&&!!r.source.trim()&&r.plan===q.plan&&r.occupancy===room.adults&&r.from<=day&&r.to>=day&&(!q.roomType||r.room===q.roomType)).map(r=>({c,r})));
  if(matches.length!==1)return null;
  const {c,r}=matches[0];if(!c.currency||currency&&currency!==c.currency)return null;currency=c.currency;
  lines.push({date:day,room:index+1,amount:r.amount!,contractName:c.name,page:r.page,roomType:r.room});
 }
 return lines.length?{total:Math.round(lines.reduce((sum,l)=>sum+l.amount,0)*100)/100,currency,lines}:null;
}
