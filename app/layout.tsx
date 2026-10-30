import type{Metadata,Viewport}from'next';import './globals.css';
export const metadata:Metadata={title:'Bbear Proposal Builder',description:'Create and manage Bbear Travels tour proposals.',icons:{icon:[{url:'/favicon-bear-v2.png',type:'image/png'}],apple:'/apple-touch-icon.png'},appleWebApp:{capable:true,title:'Bbear Builder'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#243d35'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
