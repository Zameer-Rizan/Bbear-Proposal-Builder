import fs from 'node:fs/promises';
import path from 'node:path';
import {root} from './store';
import {cloud,cloudEnabled,checked} from './supabase';
function filename(name:string){if(!/^[\w.-]+$/.test(name)||name==='.'||name==='..')throw Error('Invalid file');return name;}
export async function readFile(name:string){filename(name);if(!cloudEnabled())return fs.readFile(path.join(root,'files',name));const c=await cloud();const blob=checked(await c.storage.from('bbear-private').download(name));return Buffer.from(await blob.arrayBuffer());}
export async function writeFile(name:string,bytes:Buffer,type:string){filename(name);if(!cloudEnabled()){await fs.mkdir(path.join(root,'files'),{recursive:true});return fs.writeFile(path.join(root,'files',name),bytes,{flag:'wx'});}const c=await cloud();checked(await c.storage.from('bbear-private').upload(name,bytes,{contentType:type,upsert:false}));}
