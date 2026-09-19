const modulePath = "../src/lib/local-db.ts";
const { closeLocalDatabase, getLocalDatabase } = await import(modulePath);
getLocalDatabase();
closeLocalDatabase();
console.log("local-migration-ok");
