import type {Hotel} from './model';
// Exact property matches only; official property pages are retained as provenance.
export const officialHotelPhotos=[
 {name:'Araliya Red',source:'https://www.araliyaresorts.com/araliya-red/photo-gallery/',image:'https://do6raq9h04ex.cloudfront.net/sites/5/2024/06/Gallery-2.jpg'},
 {name:"Sigiriya King's Resort by Araliya",source:'https://sigiriyakingsresort.com/',image:'https://images.squarespace-cdn.com/content/v1/5abc34ff36099b63f9d2bbff/1606886112883-V41GAIA9Z3PV1KY01WJ6/_DSC4216.jpg?format=1000w'},
 {name:'Hiriketiya Beach Resort',source:'https://www.hiriketiyabeach.lk/',image:'https://www.hiriketiyabeach.lk/wp-content/uploads/2026/04/home-desk-banner-1.webp'},
];
const key=(s:string)=>s.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
export function hotelPhoto(h:Hotel){return h.photo||officialHotelPhotos.find(p=>key(p.name)===key(h.name))?.image||'';}

export function officialHotelPhoto(h:Hotel){return !h.photo?officialHotelPhotos.find(p=>key(p.name)===key(h.name))||null:null;}
