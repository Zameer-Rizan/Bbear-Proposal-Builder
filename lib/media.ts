import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {cloud,cloudEnabled,checked} from './supabase';
import {root} from './store';
import {writeFile} from './files';
export type MediaPhoto={name:string;url:string;title:string;hash:string};
export function mediaPhoto(name:string):MediaPhoto|null{
 const m=/^bbear-travels-([a-z0-9-]{1,160})--([a-f0-9]{64})\.jpg$/.exec(name);
 return m?{name,url:'/api/files/'+name,title:m[1].replaceAll('-',' '),hash:m[2]}:null;
}
export function photoSlug(name:string){return name.replace(/\.[^.]+$/,'').toLowerCase().replace(/^bbear-travels-?/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,140)||'photo';}
export async function listMedia():Promise<MediaPhoto[]>{
 let names:string[]=[];
 if(cloudEnabled()){const c=await cloud();for(let offset=0;;offset+=1000){const data=checked(await c.storage.from('bbear-private').list('',{limit:1000,offset,sortBy:{column:'name',order:'asc'},search:'bbear-travels-'}));names.push(...data.map(x=>x.name));if(data.length<1000)break;}}
 else{await fs.mkdir(path.join(root,'files'),{recursive:true});names=await fs.readdir(path.join(root,'files'));}
 return names.map(mediaPhoto).filter((x):x is MediaPhoto=>!!x);
}
const active=new Map<string,Promise<{photo:MediaPhoto;duplicate:boolean}>>();
export async function addMedia(file:File){
 if(file.size===0||file.size>12*1024*1024)throw Error('Choose a photo smaller than 12 MB.');
 const bytes=await sharp(Buffer.from(await file.arrayBuffer()),{limitInputPixels:30000000}).rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).jpeg({quality:90}).toBuffer();
 const hash=createHash('sha256').update(bytes).digest('hex');
 const pending=active.get(hash);if(pending){const result=await pending;return {...result,duplicate:true};}
 const job=(async()=>{const existing=(await listMedia()).find(p=>p.hash===hash);if(existing)return {photo:existing,duplicate:true};const name='bbear-travels-'+photoSlug(file.name)+'--'+hash+'.jpg';await writeFile(name,bytes,'image/jpeg');return {photo:mediaPhoto(name)!,duplicate:false};})();
 active.set(hash,job);try{return await job;}finally{active.delete(hash);}
}
