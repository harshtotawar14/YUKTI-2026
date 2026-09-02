import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {ensureDatabase,query}=require('../api/_lib/db.cjs');

await ensureDatabase();
const result=await query("SELECT count(*)::int AS services FROM services WHERE active=true");
console.log(`SanPaid database ready with ${result.rows[0].services} active services.`);

