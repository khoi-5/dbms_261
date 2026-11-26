// BKPEE Indexing - MongoDB 8.x / mongosh. Chi su dung bkpee_index_db.
// Chay trong PowerShell: mongosh "mongodb://127.0.0.1:27017/bkpee_index_db" --file "<duong-dan-file>"
(() => {
  if (db.getName() !== 'bkpee_index_db') throw new Error('Sai database: phai la bkpee_index_db.');
  const col = db.products;
  if (!db.getCollectionNames().includes('products')) throw new Error('Hay chay schema Indexing truoc.');
  const productCount = col.countDocuments({});
  if (productCount !== 3000 && productCount !== 16500)
    throw new Error('Can seed 10K (3000 products) hoac 50K (16500 products). Hien co: ' + productCount);
  const expectedVariants = productCount === 3000 ? 10000 : 50000;
  // Khong dung aggregate unwind tai day de tranh lam cham phep demo.
  print('DATASET: ' + productCount + ' products / ' + expectedVariants + ' variants nhung');
  function indexes() { print('INDEX products: ' + JSON.stringify(col.getIndexes().map(x => ({ name:x.name, key:x.key })))); }
  function assertBaseline(allowed = []) {
    const extra = col.getIndexes().filter(i => i.name !== '_id_' && !allowed.includes(i.name));
    if (extra.length) throw new Error('Co index phu tu bai khac, can don thu cong truoc khi do: ' + extra.map(x => x.name).join(', '));
  }
  function removeOwn(name) { if (col.getIndexes().some(i=>i.name===name)) col.dropIndex(name); }
  function ms(fn) { const a=Date.now(); const value=fn(); return {time:Date.now()-a,value}; }
  function loopQuery(query) {
    let total=0; const cursor=query;
    while (cursor.hasNext()) { cursor.next(); total++; }
    return total;
  }
  function info(label, statement) {
    const e=statement.explain('executionStats');
    const s=e.executionStats || {};
    const wp=e.queryPlanner && e.queryPlanner.winningPlan;
    function stages(node, out=[]) {
      if (!node || typeof node!=='object') return out;
      if (typeof node.stage==='string') out.push(node.stage);
      if (node.queryPlan) stages(node.queryPlan,out);
      if (node.inputStage) stages(node.inputStage,out);
      if (Array.isArray(node.inputStages)) node.inputStages.forEach(n=>stages(n,out));
      if (node.outerStage) stages(node.outerStage,out);
      if (node.innerStage) stages(node.innerStage,out);
      if (node.shards) Object.values(node.shards).forEach(n=>stages(n.winningPlan||n,out));
      return out;
    }
    print(label+' | explain | millis='+s.executionTimeMillis+' | docsExamined='+s.totalDocsExamined+' | keysExamined='+s.totalKeysExamined+' | nReturned='+s.nReturned+' | stages='+[...new Set(stages(wp))].join(' > '));
  }
  function measure(label, fn, runs) {
    const values=[];
    for (let i=0;i<runs+ (runs===3?1:0);i++) {
      const r=ms(fn); const warm=runs===3 && i===0;
      print(label+' | '+(warm?'WARMUP':'RUN '+(warm?0:(runs===3?i:i+1)))+' | ms='+r.time+' | docs='+r.value);
      if (!warm) values.push(r.time);
    }
    if (values.length===3) print(label+' | MEDIAN(ms)='+values.slice().sort((a,b)=>a-b)[1]);
  }
  // T4 - Chi phi INSERT 100 + UPDATE 100 khi khong/co 3 index.
  // Chi them document demo voi _id am; xoa het sau tung lan, khong sua seed goc.
  const own=['IX_EXP_T4_MinPrice','IX_EXP_T4_Seller','IX_EXP_T4_SellerPrice'];
  indexes(); own.forEach(removeOwn); assertBaseline();
  const originals=col.find({},{_id:1,product_name:1,seller_id:1,category_id:1,min_price:1,max_price:1,variants:1}).sort({_id:1}).limit(100).toArray();
  if(originals.length!==100) throw new Error('Khong du 100 products.');
  const ids=Array.from({length:100},(_,i)=>-i-1);
  const inserted=originals.map((p,i)=>({
    ...p, _id:ids[i], product_name:'INDEX T4 TEMP '+(i+1),
    min_price:150000+i, max_price:450000+i,
    variants:[]
  }));
  // Baseline phai khong ton tai _id tam. Khong xoa bat ky du lieu nao neu trung ID.
  if(col.countDocuments({_id:{$in:ids}})) throw new Error('Co _id am duoc su dung; dung lai de kiem tra.');
  function cleanupData() { col.deleteMany({_id:{$in:ids}}); }
  function oneRun(label,number) {
    let insertMs=0, updateMs=0;
    try {
      const a=ms(()=>col.insertMany(inserted,{ordered:true}));
      insertMs=a.time;
      const b=ms(()=>col.updateMany({_id:{$in:ids}},{$inc:{min_price:1}}));
      updateMs=b.time;
      if(b.value.matchedCount!==100 || b.value.modifiedCount!==100) throw new Error('UPDATE 100 khong dung.');
      print('T4 '+label+' RUN '+number+' | Insert100Ms='+insertMs+' | Update100Ms='+updateMs);
    } finally { cleanupData(); }
  }
  function phase(label) {
    for(let i=0;i<1;i++) {
      if (false && i===0) { oneRun(label,'WARMUP'); continue; }
      oneRun(label,i+1);
    }
  }
  try {
    print('T4 BASELINE'); phase('BASELINE');
    col.createIndex({min_price:1},{name:own[0]});
    col.createIndex({seller_id:1},{name:own[1]});
    col.createIndex({seller_id:1,min_price:1},{name:own[2]});
    indexes();
    print('T4 3_INDEXES'); phase('3_INDEXES');
  } finally { cleanupData(); own.forEach(removeOwn); }
  indexes();
  print('T4 | products sau khi don: '+col.countDocuments({}));

})();
