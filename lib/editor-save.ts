import {ProposalSchema,type Proposal} from './model';
// Keep edits made while a save is in flight; only advance the database version.
export function reconcileSave(current:Proposal,sent:Proposal,saved:Proposal){
 if(current.id!==sent.id)return {proposal:current,dirty:false,switched:true};
 const edited=proposalFingerprint(current)!==proposalFingerprint(sent);
 return {proposal:edited?{...current,version:saved.version,updated:saved.updated}:saved,dirty:edited,switched:false};
}

export function proposalFingerprint(p:Proposal){const {version,updated,...content}=p;return JSON.stringify(content);}
export function copyProposal(p:Proposal):Proposal{return {...structuredClone(p),id:crypto.randomUUID(),version:0,title:p.title+' — copy',status:'Draft',priceState:p.priceState==='Approved'?'Estimate':p.priceState,updated:new Date().toISOString()};}
export function parseChildAges(text:string):number[]|null{
 if(!text.trim())return [];
 const parts=text.split(',').map(s=>s.trim());
 if(parts.some(s=>!/^\d{1,2}$/.test(s)||Number(s)>17))return null;
 return parts.map(Number);
}
export function cataloguePhotos(tours:any[],search=''){
 const selected=tours.filter(t=>(String(t.title)+' '+String(t.tagline||'')).toLowerCase().includes(search.trim().toLowerCase()));
 return [...new Set<string>(selected.flatMap(t=>[...(t.gallery||[]),t.cover_image].map(v=>typeof v==='string'?v:v?.url).filter(Boolean)).map((u:string)=>u.startsWith('/')?'https://bbeartravels.com'+u:u).filter((u:string)=>{try{return new URL(u).origin==='https://bbeartravels.com'}catch{return false}}))];
}

export function importProposal(value:unknown):Proposal{const parsed=ProposalSchema.parse(value);return {...parsed,id:crypto.randomUUID(),version:0,status:'Draft',showPrice:false,priceState:parsed.price>0?'Estimate':'Needs pricing',updated:new Date().toISOString()};}
