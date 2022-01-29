import PouchDB from "pouchdb";
import MemoryAdapter from "pouchdb-adapter-memory";

PouchDB.plugin(MemoryAdapter);

export const orders = new PouchDB("orders", { adapter: "memory" });
export const goods = new PouchDB("goods", { adapter: "memory" });

goods.bulkDocs([{ _id: "001", title: "Fee", amount: 1050, currency: "EUR" }]);
