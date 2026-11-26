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
  // T2 - Sap xep theo min_price, khong index vs co index.
  const own='IX_EXP_T2_MinPrice';
  indexes(); removeOwn(own); assertBaseline();
  const queries=[
    ['SORT_ALL', () => col.find({},{_id:1,min_price:1}).sort({min_price:1,_id:1})],
    ['TOP100_ASC', () => col.find({},{_id:1,min_price:1}).sort({min_price:1,_id:1}).limit(100)],
    ['TOP100_DESC', () => col.find({},{_id:1,min_price:1}).sort({min_price:-1,_id:-1}).limit(100)]
  ];
  function phase(label) {
    for(const [name,q] of queries) {
      info('T2 '+label+' '+name,q());
      measure('T2 '+label+' '+name,()=>loopQuery(q()),1);
    }
  }
  try {
    print('----- BEFORE INDEX -----'); phase('BEFORE');
    col.createIndex({min_price:1},{name:own});
    indexes();
    print('----- AFTER INDEX -----'); phase('AFTER');
  } finally { removeOwn(own); }
  indexes();

})();
