// BKPEE INDEXING - MongoDB schema: 9 collections, chi co index _id_ mac dinh.
// Chay bang mongosh ket noi toi bkpee_index_db. Khong xoa du lieu cu.
(() => {
  if (db.getName() !== "bkpee_index_db") throw new Error("Hay ket noi dung database bkpee_index_db.");
  const currentDb = db; // Never switch database context.
const collections = ["accounts", "categories", "shipping_providers", "products", "carts", "promotions", "orders", "evaluations", "reports"];
const infos = currentDb.getCollectionInfos();
if (infos.some(c => !c.name.startsWith("system.") && !collections.includes(c.name)))
  throw new Error("Unexpected collection; inspect this database before proceeding.");
if (infos.some(c => collections.includes(c.name) &&
    (c.type !== "collection" || c.options?.capped || c.options?.timeseries)))
  throw new Error("Incompatible view/capped/time-series collection; refusing replacement.");

for (const name of collections) {
  if (!infos.some(c => c.name === name)) currentDb.createCollection(name);
}
// Khong tao 21 index phu tu schema V2. Index T1-T4 se tao/xoa rieng.
print("MONGODB_INDEX_SCHEMA_READY: 9 collections, chi co _id_ indexes neu database moi.");
})();
