import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const output=resolve(root,'dist');
const publicExtensions=new Set(['.css','.html','.js','.svg','.webmanifest','.xml','.txt']);
const packageMetadata=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));

function resolveCommit(){
  const fromEnvironment=process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||'';
  if(fromEnvironment)return fromEnvironment.trim();
  try{return execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}
  catch{return 'LOCAL_BUILD';}
}

rmSync(output,{recursive:true,force:true});
mkdirSync(output,{recursive:true});

for(const entry of readdirSync(root,{withFileTypes:true})){
  if(!entry.isFile()||!publicExtensions.has(extname(entry.name)))continue;
  cpSync(resolve(root,entry.name),resolve(output,entry.name));
}

const buildInfo={
  product:'SanPaid',
  version:packageMetadata.version,
  runtime:'v70',
  commitSha:resolveCommit(),
  builtAt:new Date().toISOString(),
  source:'harshtotawar14/YUKTI-2026',
  branch:process.env.VERCEL_GIT_COMMIT_REF||process.env.GITHUB_REF_NAME||'local'
};

writeFileSync(resolve(output,'build-info.json'),`${JSON.stringify(buildInfo,null,2)}\n`);
console.log(`Built SanPaid ${buildInfo.version} (${buildInfo.commitSha}) into dist/.`);
