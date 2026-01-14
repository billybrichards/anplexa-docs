"use strict";
/**
 * Session Repository Interface
 *
 * Defines the contract for session data persistence operations.
 * Part of the Clean Architecture domain layer - inner layers define the interface,
 * outer layers (infrastructure) implement it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const Session_js_1 = require("../../domain/entities/Session.js");
Object.defineProperty(exports, "Session", { enumerable: true, get: function () { return Session_js_1.Session; } });
