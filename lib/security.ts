import{createHmac,timingSafeEqual}from'node:crypto';import{NextRequest}from'next/server';
function sign(s:string){return createHmac('sha256',process.env.SESSION_SECRET||process.env.APP_PASSWORD||'local-only').update(s).digest('hex');}
export function token(){const value=String(Date.now()+12*3600000);return value+'.'+sign(value);}
export function authorized(req:NextRequest){if(!process.env.APP_PASSWORD)return ['localhost','127.0.0.1','[::1]'].includes(req.nextUrl.hostname);const [v,s]=req.cookies.get('bbear-session')?.value.split('.')||[];return !!v&&!!s&&Number(v)>Date.now()&&s.length===64&&timingSafeEqual(Buffer.from(s),Buffer.from(sign(v)));}
export function originOK(req:NextRequest){const origin=req.headers.get('origin');if(!origin)return true;try{return new URL(origin).host===req.headers.get('host');}catch{return false;}}
