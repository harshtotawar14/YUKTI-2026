'use strict';

const {readFileSync,readdirSync}=require('node:fs');
const {resolve}=require('node:path');
const {Pool}=require('pg');
const {hashPassword}=require('./security.cjs');
const {PUBLIC_DEMO_PASSWORD,DEMO_ACCOUNTS,DEMO_WORKER_EMAILS}=require('./demo-access.cjs');

let pool;
let readyPromise;

const RESOURCE_ERROR_CODES=new Set(['53000','53100','53200','53300','53400','57P03']);

function getPool(){
  const connectionString=process.env.DATABASE_URL;
  if(!connectionString)throw Object.assign(new Error('DATABASE_URL is not configured.'),{status:503,code:'DATABASE_NOT_CONFIGURED'});
  if(!pool){
    const local=/localhost|127\.0\.0\.1/.test(connectionString);
    const managedRuntime=Boolean(process.env.VERCEL);
    pool=new Pool({
      connectionString,
      // A serverless deployment can have many warm function instances. Keep each
      // instance to one backend connection so a small managed Postgres plan is not
      // exhausted by parallel pools during the SIH demo.
      max:managedRuntime?1:5,
      idleTimeoutMillis:managedRuntime?1500:10000,
      connectionTimeoutMillis:managedRuntime?3000:5000,
      allowExitOnIdle:true,
      ssl:local?false:{rejectUnauthorized:false}
    });
    pool.on('error',error=>console.error('[sanpaid-db-pool]',error.code||'POOL_ERROR',error.message));
  }
  return pool;
}

function migrationSql(){
  const directory=resolve(__dirname,'../../database/migrations');
  return readdirSync(directory).filter(name=>/^\d+_.+\.sql$/.test(name)).sort().map(name=>({name,sql:readFileSync(resolve(directory,name),'utf8')}));
}

async function seed(client){
  const password=process.env.SANPAID_DEMO_PASSWORD||PUBLIC_DEMO_PASSWORD;
  if(password.length<8)throw Object.assign(new Error('Demo password must contain at least 8 characters.'),{status:503,code:'DEMO_PASSWORD_INVALID'});
  const passwordHash=await hashPassword(password);
  const services=[
    ['Electrician','electrician','⚡',499],['Plumber','plumber','🔧',449],['Carpenter','carpenter','🪚',549],
    ['House Cleaning','house-cleaning','🧹',399],['AC Repair','ac-repair','❄️',699],['Appliance Repair','appliance-repair','🛠️',599],
    ['Painter','painter','🎨',649],['Gardener','gardener','🌿',349],['Pest Control','pest-control','🧪',799],
    ['Driver','driver','🚗',499],['Elder Care','elder-care','🤝',599],['Beauty at Home','beauty-at-home','✨',549]
  ];
  await client.query(`INSERT INTO cooperatives(name,code,region) VALUES
    ('YUKTI Kolhapur Services Cooperative','YUKTI-01','Kolhapur, Maharashtra'),
    ('YUKTI Panhala Worker Cooperative','NARMADA-02','Panhala, Kolhapur, Maharashtra')
    ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,region=EXCLUDED.region`);
  for(const [name,slug,icon,price] of services){
    await client.query(`INSERT INTO services(name,slug,icon,base_price) VALUES($1,$2,$3,$4)
      ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,icon=EXCLUDED.icon,base_price=EXCLUDED.base_price,active=true`,[name,slug,icon,price]);
  }
  const coop=(await client.query("SELECT id FROM cooperatives WHERE code='YUKTI-01'")).rows[0];
  for(const {email,name,role} of DEMO_ACCOUNTS){
    await client.query(`INSERT INTO users(email,name,role,password_hash,cooperative_id) VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,role=EXCLUDED.role,password_hash=EXCLUDED.password_hash,cooperative_id=EXCLUDED.cooperative_id,active=true`,[email,name,role,passwordHash,coop.id]);
  }
  const workerUsers=(await client.query('SELECT id,email FROM users WHERE email=ANY($1::text[]) ORDER BY email',[DEMO_WORKER_EMAILS])).rows;
  for(let index=0;index<workerUsers.length;index+=1){
    const row=workerUsers[index];
    await client.query(`INSERT INTO workers(user_id,cooperative_id,identity_status,availability_status,rating,demo_distance_km)
      VALUES($1,$2,'VERIFIED','AVAILABLE',$3,$4)
      ON CONFLICT(user_id) DO UPDATE SET cooperative_id=EXCLUDED.cooperative_id,identity_status='VERIFIED',availability_status='AVAILABLE',rating=EXCLUDED.rating,demo_distance_km=EXCLUDED.demo_distance_km,updated_at=now()`,[row.id,coop.id,index?4.72:4.91,index?6.4:3.2]);
  }
  await client.query(`INSERT INTO worker_skills(worker_id,service_id,status)
    SELECT w.id,s.id,'VERIFIED' FROM workers w JOIN users u ON u.id=w.user_id CROSS JOIN services s
    WHERE u.email=ANY($1::text[])
    ON CONFLICT(worker_id,service_id) DO UPDATE SET status='VERIFIED'`,[DEMO_WORKER_EMAILS]);
}

function shouldBootstrapDatabase(){
  if(process.env.SANPAID_AUTO_MIGRATE==='1')return true;
  return !process.env.VERCEL;
}

async function bootstrapDatabase(){
  const client=await getPool().connect();
  try{
    const schema=readFileSync(resolve(__dirname,'../../database/schema.sql'),'utf8');
    const migrations=migrationSql();
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('sanpaid-schema-v3'))");
    await client.query(schema);
    for(const migration of migrations)await client.query(migration.sql);
    await seed(client);
    await client.query('COMMIT');
  }catch(error){
    await client.query('ROLLBACK').catch(()=>{});
    throw error;
  }finally{
    client.release();
  }
}

async function ensureDatabase(){
  if(!readyPromise){
    // Production migrations are applied out of band. Do not spend an extra DB
    // connection/query on every new Vercel function instance before the real query.
    const readiness=shouldBootstrapDatabase()?bootstrapDatabase():Promise.resolve();
    readyPromise=readiness.catch(error=>{readyPromise=null;throw error;});
  }
  return readyPromise;
}

function isResourceError(error){return RESOURCE_ERROR_CODES.has(String(error?.code||''));}
async function resetPool(){
  const current=pool;
  pool=undefined;
  readyPromise=undefined;
  if(current)await current.end().catch(()=>{});
}

async function query(text,params=[]){
  await ensureDatabase();
  try{return await getPool().query(text,params);}
  catch(error){
    if(!isResourceError(error))throw error;
    // Quota, memory and connection-slot errors will not recover in 250 ms.
    // Retrying every browser request doubles pressure on the database.
    console.warn('[sanpaid-db-resource]',error.code,error.message);
    throw error;
  }
}

async function transaction(work){
  await ensureDatabase();
  const client=await getPool().connect();
  try{
    await client.query('BEGIN');
    const result=await work(client);
    await client.query('COMMIT');
    return result;
  }catch(error){
    await client.query('ROLLBACK').catch(()=>{});
    throw error;
  }finally{
    client.release();
  }
}

module.exports={getPool,ensureDatabase,query,transaction,migrationSql,shouldBootstrapDatabase,isResourceError,resetPool};
