// V2 schema: original 9 collections and 21 secondary indexes; no data deletion.
// Flexible original document model: no new fields or validators.
// Reruns add missing collections/equivalent indexes; conflicts stop execution.
(() => {
// Run the whole file in mongosh. Do not load the destructive original script.
// Fill expectedHost from db.getMongo().host; independently verify server identity.
// Endpoint equality is a routing guard, not server authentication or TLS validation.
const expectedHost = null;
const confirmation = null;
const targetName = "bkpee_db";
if (db.getName() !== targetName) throw new Error("Connect directly to bkpee_db.");
if (typeof expectedHost !== "string" || !expectedHost.trim() ||
    db.getMongo().host !== expectedHost) throw new Error("Missing or incorrect expectedHost.");
if (confirmation !== "SCHEMA bkpee_db") throw new Error("Confirmation required: " + "SCHEMA bkpee_db");
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
// Exact original definitions from ../init_mongodb.js. Never drop conflicting indexes.
currentDb.accounts.createIndex({ username: 1 }, { unique: true });
currentDb.accounts.createIndex({ email: 1 }, { unique: true });
currentDb.accounts.createIndex({ phone: 1 }, { unique: true });
currentDb.accounts.createIndex({ roles: 1 });
currentDb.categories.createIndex({ category_name: 1 }, { unique: true });
currentDb.categories.createIndex({ parent_category_id: 1 });
currentDb.categories.createIndex({ target_type: 1 });
currentDb.shipping_providers.createIndex({ provider_name: 1 }, { unique: true });
currentDb.products.createIndex({ seller_id: 1 });
currentDb.products.createIndex({ category_id: 1, min_price: 1 });
currentDb.products.createIndex({ product_name: "text", description: "text" });
currentDb.products.createIndex({ "variants.variant_id": 1 });
currentDb.orders.createIndex({ buyer_id: 1, order_time: -1 });
currentDb.orders.createIndex({ "shop_orders.seller_id": 1, order_time: -1 });
currentDb.orders.createIndex({ "payment.transaction_code": 1 }, { unique: true });
currentDb.promotions.createIndex({ seller_id: 1, expiration_date: 1 });
currentDb.promotions.createIndex({ applicable_variant_ids: 1 });
currentDb.evaluations.createIndex({ product_id: 1, rating: -1 });
currentDb.evaluations.createIndex({ variant_id: 1 });
currentDb.reports.createIndex({ reporter_id: 1 });
currentDb.reports.createIndex({ reported_account_id: 1 });
print("MONGODB_V2_SCHEMA_READY: 9 collections, 21 secondary indexes requested.");
})();
