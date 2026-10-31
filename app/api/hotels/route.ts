import {NextRequest} from 'next/server';import {hotelsAPI} from '@/lib/hotels/api';
export const runtime='nodejs';export const maxDuration=120;
export async function GET(req:NextRequest){return hotelsAPI(req);}
