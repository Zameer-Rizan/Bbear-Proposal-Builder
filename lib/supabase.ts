import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export const cloudEnabled=()=>process.env.STORAGE_MODE==='supabase';
export async function cloud(){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_ANON_KEY;
 if(!url||!key)throw Error('Supabase settings are missing.');
 const jar=await cookies();
 return createServerClient(url,key,{cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},cookies:{getAll:()=>jar.getAll(),setAll:values=>{for(const {name,value,options} of values)jar.set(name,value,options)}}});
}
export async function staff(){const c=await cloud();const {data:{user},error}=await c.auth.getUser();if(error||!user)return null;const {data,error:denied}=await c.from('bbear_staff').select('user_id').eq('user_id',user.id).maybeSingle();return !denied&&data?user:null;}
export function checked<T>({data,error}:{data:T;error:any}):NonNullable<T>{if(error){if(error.message?.includes('CONFLICT'))throw Error('CONFLICT');throw Error('Online storage is unavailable. Please try again.');}if(data===null||data===undefined)throw Error('Online storage returned no data.');return data as NonNullable<T>;}
