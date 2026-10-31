import {NextRequest} from 'next/server';import {hotelsAPI} from '@/lib/hotels/api';
export const runtime='nodejs';export const maxDuration=120;
async function handler(req:NextRequest,{params}:{params:Promise<{path:string[]}>}){return hotelsAPI(req,(await params).path);}
export const GET=handler;export const POST=handler;
