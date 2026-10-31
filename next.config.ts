import type {NextConfig} from 'next';
const config:NextConfig={
 images:{remotePatterns:[{protocol:'https',hostname:'do6raq9h04ex.cloudfront.net'},{protocol:'https',hostname:'images.squarespace-cdn.com'},{protocol:'https',hostname:'www.hiriketiyabeach.lk'}]},
 outputFileTracingExcludes:{'/*':['./data/**/*','./PDFS/**/*','./.env*','./.git/**/*']},
};
export default config;
