'use strict';

const {readFileSync,readdirSync}=require('node:fs');
const {resolve}=require('node:path');
const {Pool}=require('pg');
const {hashPassword}=require('./security.cjs');

let pool;
let readyPromise;

function getPool(){
  const connectionString=process.env.DATABASE_URL;
  if(!connectionString)throw Object.assign(new Error('DATABASE_URL is not configured.'),{status:503,code:'DATABASE_NOT_CONFIGURED'});
  if(!pool){
    const local=/localhost|127\.0\.0\.1/.test(connectionString);
    pool=new Pool({connectionString,max:5,idleTimeoutMillis:10000,connectionTimeoutMillis:10000,ssl:local?false:{rejectUnauthorized:false}});
  }
  return pool;
}

function migrationSql(){
  const directory=resolve(__dirname,'../../database/migrations');
  return readdirSync(directory).filter(name=>/^\d+_.+\.sql$/.test(name)).sort().map(name=>({name,sql:readFileSync(resolve(directory,name),'utf8')}));
}

async function seed(client){
  const password=process.env.SANPAID_DEMO_PASSWORD;
  if(!password||password.length<8)throw Object.assign(new Error('SANPAID_DEMO_PASSWORD must contain at least 8 characters.'),{status:503,code:'DEMO_PASSWORD_NOT_CONFIGURED'});
  const passwordHash=await hashPassword(password);
  const services=[
    ['Electrician','electrician','⚡',499],['Plumber','plumber','🔧',449],['Carpenter','carpenter','🪚',549],
    ['House Cleaning','house-cleaning','🧹',399],['AC Repair','ac-repair','❄️',699],['Appliance Repair','appliance-repair','🛠️',599],
    ['Painter','painter','🎨',649],['Gardener','gardener','🌿',349],['Pest Control','pest-control','🧪',799],
    ['Driver','driver','🚗',499],['Elder Care','elder-care','🤝',599],['Beauty at Home','beauty-at-home','✨',549]
  ];
  await client.query(`INSERT INTO cooperatives(name,code,region) VALUES
    ('YUKTI Community Services Cooperative','YUKTI-01','Indore'),
    ('Narmada Worker Cooperative','NARMADA-02','Bhopal')
    ON CONFLICT(code) DO NOTHING`);
  for(const [name,slug,icon,price] of services){
    await client.query(`INSERT INTO services(name,slug,icon,base_price) VALUES($1,$2,$3,$4)
      ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,icon=EXCLUDED.icon,base_price=EXCLUDED.base_price,active=true`,[name,slug,icon,price]);
  }
  const coop=(await client.query("SELECT id FROM cooperatives WHERE code='YUKTI-01'")).rows[0];
  const accounts=[
    ['customer.connected@sanpaid.demo','Demo Customer','CUSTOMER'],
    ['worker1.connected@sanpaid.demo','Asha Verma','WORKER'],
    ['worker2.connected@sanpaid.demo','Ravi Kumar','WORKER'],
    ['admin.connected@sanpaid.demo','Cooperative Admin','COOPERATIVE_ADMIN'],
    ['federation.connected@sanpaid.demo','Federation Admin','FEDERATION_ADMIN']
  ];
  for(const [email,name,role] of accounts){
    await client.query(`INSERT INTO users(email,name,role,password_hash,cooperative_id) VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,role=EXCLUDED.role,password_hash=EXCLUDED.password_hash,cooperative_id=EXCLUDED.cooperative_id,active=true`,[email,name,role,passwordHash,coop.id]);
  }
  const workerUsers=(await client.query("SELECT id,email FROM users WHERE role='WORKER' ORDER BY email")).rows;
  for(let index=0;index<workerUsers.length;index+=1){
    const row=workerUsers[index];
    await client.query(`INSERT INTO workers(user_id,cooperative_id,identity_status,availability_status,rating,demo_distance_km)
      VALUES($1,$2,'VERIFIED','AVAILABLE',$3,$4) ON CONFLICT(user_id) DO UPDATE SET cooperative_id=EXCLUDED.cooperative_id`,[row.id,coop.id,index?4.72:4.91,index?6.4:3.2]);
  }
  await client.query(`INSERT INTO worker_skills(worker_id,service_id,status)
    SELECT w.id,s.id,'VERIFIED' FROM workers w CROSS JOIN services s
    ON CONFLICT(worker_id,service_id) DO UPDATE SET status='VERIFIED'`);
}

async function ensureDatabase(){
  if(!readyPromise){
    readyPromise=(async()=>{
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
      }catch(error){await client.query('ROLLBACK').catch(()=>{});readyPromise=null;throw error;}finally{client.release();}
    })();
  }
  return readyPromise;
}

async function query(text,params=[]){await ensureDatabase();return getPool().query(text,params);}
async function transaction(work){
  await ensureDatabase();const client=await getPool().connect();
  try{await client.query('BEGIN');const result=await work(client);await client.query('COMMIT');return result;}
  catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
}

module.exports={getPool,ensureDatabase,query,transaction,migrationSql};
