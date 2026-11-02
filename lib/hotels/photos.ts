import type {Hotel} from './model';
// Exact property matches only; official property pages are retained as provenance.
export const officialHotelPhotos=[
 {name:'Araliya Red',source:'https://www.araliyaresorts.com/araliya-red/photo-gallery/',image:'https://do6raq9h04ex.cloudfront.net/sites/5/2024/06/Gallery-2.jpg'},
 {name:"Sigiriya King's Resort by Araliya",source:'https://sigiriyakingsresort.com/',image:'https://images.squarespace-cdn.com/content/v1/5abc34ff36099b63f9d2bbff/1606886112883-V41GAIA9Z3PV1KY01WJ6/_DSC4216.jpg?format=1000w'},
 {name:'Hiriketiya Beach Resort',source:'https://www.hiriketiyabeach.lk/',image:'https://www.hiriketiyabeach.lk/wp-content/uploads/2026/04/home-desk-banner-1.webp'},
 {name:'Cinnamon Bey Beruwala',source:'https://www.cinnamonhotels.com/cinnamon-bey-beruwala',image:'https://d18slle4wlf9ku.cloudfront.net/www.cinnamonhotels.com-1302818674/cms/cache/v2/66b37ee28d3cd.jpg/800x800/fit/80/06e60d70e73e06f8f52124905f66d708.jpg'},
 {name:'Cinnamon Citadel Kandy',source:'https://www.cinnamonhotels.com/cinnamon-citadel-kandy',image:'https://d18slle4wlf9ku.cloudfront.net/www.cinnamonhotels.com-1302818674/cms/cache/v2/66e14d1c246cb.jpg/1200x630/fit/80/ec66a4c89e021e17a051f2e5418222e0.jpg'},
 {name:'Cinnamon Life',source:'https://www.cinnamonhotels.com/cinnamon-life-city-of-dreams-sri-lanka',image:'https://d18slle4wlf9ku.cloudfront.net/www.cinnamonhotels.com-1302818674/cms/cache/v2/66d830542208b.jpg/800x600/fit%3Bc%3A0%2C8%2C1417%2C877%3Bfp%3A40%2C43/80/ebb138a966b36c16810dcba875588b64.jpg'},
 {name:'Cinnamon Wild Yala',source:'https://www.cinnamonhotels.com/cinnamon-wild-yala',image:'https://d18slle4wlf9ku.cloudfront.net/www.cinnamonhotels.com-1302818674/cms/cache/v2/67f78100a1769.jpg/600x810/fit/80/f60d8852522864ef4fe2485a5c88eceb.jpg'},
 {name:'Hikka Tranz by Cinnamon',source:'https://www.cinnamonhotels.com/hikka-tranz-by-cinnamon',image:'https://d18slle4wlf9ku.cloudfront.net/www.cinnamonhotels.com-1302818674/cms/cache/v2/67f77c699bc2b.jpg/800x900/fit/80/950cab4c7f71756382ed2f5c46d9c387.jpg'},
 {name:'Trinco Blu by Cinnamon',source:'https://www.cinnamonhotels.com/trinco-blu-by-cinnamon',image:'https://d18slle4wlf9ku.cloudfront.net/www.cinnamonhotels.com-1302818674/cms/cache/v2/66bd882c7e4af.jpg/800x900/fit/80/0374329aef3f39f399d0d6ace3c0c3a8.jpg'},
 {name:'Kandy Myst by Cinnamon',source:'https://www.cinnamonhotels.com/kandy-myst-by-cinnamon',image:'https://d18slle4wlf9ku.cloudfront.net/www.cinnamonhotels.com-1302818674/cms/imagepool/68a2c21cc8195.jpeg'},
];
const key=(s:string)=>s.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
export function hotelPhoto(h:Hotel){return h.photo||officialHotelPhotos.find(p=>key(p.name)===key(h.name))?.image||'';}

export function officialHotelPhoto(h:Hotel){return !h.photo?officialHotelPhotos.find(p=>key(p.name)===key(h.name))||null:null;}
