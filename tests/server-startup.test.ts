import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('Cloud startup imports storage without creating local folders',()=>{
 const temp=mkdtempSync(path.join(tmpdir(),'bbear-startup-'));const data=path.join(temp,'must-not-be-created');
 try{const run=spawnSync(process.execPath,['--import','tsx','--input-type=module','-e',"await import('./lib/store.ts'); await import('./lib/files.ts');"],{cwd:process.cwd(),env:{...process.env,STORAGE_MODE:'supabase',DATA_DIR:data},encoding:'utf8'});assert.equal(run.status,0,run.stderr);assert.equal(existsSync(data),false,'Importing the cloud API must not write to the deployment filesystem');}finally{rmSync(temp,{recursive:true,force:true});}
});
