"use strict";
// Database package - exports Drizzle ORM schema and database client utilities
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notBetween = exports.between = exports.notInArray = exports.inArray = exports.isNotNull = exports.isNull = exports.ne = exports.lte = exports.gte = exports.gt = exports.lt = exports.sql = exports.asc = exports.desc = exports.like = exports.or = exports.and = exports.eq = exports.getDatabase = void 0;
// Export all schema tables and types
__exportStar(require("./schema/index.js"), exports);
// Export database client utilities
var client_js_1 = require("./client.js");
Object.defineProperty(exports, "getDatabase", { enumerable: true, get: function () { return client_js_1.getDatabase; } });
// Re-export drizzle-orm utilities to ensure consistent types across packages
var drizzle_orm_1 = require("drizzle-orm");
Object.defineProperty(exports, "eq", { enumerable: true, get: function () { return drizzle_orm_1.eq; } });
Object.defineProperty(exports, "and", { enumerable: true, get: function () { return drizzle_orm_1.and; } });
Object.defineProperty(exports, "or", { enumerable: true, get: function () { return drizzle_orm_1.or; } });
Object.defineProperty(exports, "like", { enumerable: true, get: function () { return drizzle_orm_1.like; } });
Object.defineProperty(exports, "desc", { enumerable: true, get: function () { return drizzle_orm_1.desc; } });
Object.defineProperty(exports, "asc", { enumerable: true, get: function () { return drizzle_orm_1.asc; } });
Object.defineProperty(exports, "sql", { enumerable: true, get: function () { return drizzle_orm_1.sql; } });
Object.defineProperty(exports, "lt", { enumerable: true, get: function () { return drizzle_orm_1.lt; } });
Object.defineProperty(exports, "gt", { enumerable: true, get: function () { return drizzle_orm_1.gt; } });
Object.defineProperty(exports, "gte", { enumerable: true, get: function () { return drizzle_orm_1.gte; } });
Object.defineProperty(exports, "lte", { enumerable: true, get: function () { return drizzle_orm_1.lte; } });
Object.defineProperty(exports, "ne", { enumerable: true, get: function () { return drizzle_orm_1.ne; } });
Object.defineProperty(exports, "isNull", { enumerable: true, get: function () { return drizzle_orm_1.isNull; } });
Object.defineProperty(exports, "isNotNull", { enumerable: true, get: function () { return drizzle_orm_1.isNotNull; } });
Object.defineProperty(exports, "inArray", { enumerable: true, get: function () { return drizzle_orm_1.inArray; } });
Object.defineProperty(exports, "notInArray", { enumerable: true, get: function () { return drizzle_orm_1.notInArray; } });
Object.defineProperty(exports, "between", { enumerable: true, get: function () { return drizzle_orm_1.between; } });
Object.defineProperty(exports, "notBetween", { enumerable: true, get: function () { return drizzle_orm_1.notBetween; } });
