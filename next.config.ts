import type {NextConfig} from 'next';
const config:NextConfig={
 outputFileTracingExcludes:{'/*':['./data/**/*','./PDFS/**/*','./.env*','./.git/**/*']},
};
export default config;
