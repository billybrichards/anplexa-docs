"use strict";
/**
 * @anplexa/services - Analytics Module
 * Unified PostHog wrapper for type-safe event tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEventProperties = exports.AnalyticsEvents = exports.flush = exports.pageView = exports.reset = exports.track = exports.identify = exports.initializeAnalytics = exports.getAnalyticsClient = exports.AnalyticsClient = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "AnalyticsClient", { enumerable: true, get: function () { return client_1.AnalyticsClient; } });
Object.defineProperty(exports, "getAnalyticsClient", { enumerable: true, get: function () { return client_1.getAnalyticsClient; } });
Object.defineProperty(exports, "initializeAnalytics", { enumerable: true, get: function () { return client_1.initializeAnalytics; } });
Object.defineProperty(exports, "identify", { enumerable: true, get: function () { return client_1.identify; } });
Object.defineProperty(exports, "track", { enumerable: true, get: function () { return client_1.track; } });
Object.defineProperty(exports, "reset", { enumerable: true, get: function () { return client_1.reset; } });
Object.defineProperty(exports, "pageView", { enumerable: true, get: function () { return client_1.pageView; } });
Object.defineProperty(exports, "flush", { enumerable: true, get: function () { return client_1.flush; } });
var events_1 = require("./events");
Object.defineProperty(exports, "AnalyticsEvents", { enumerable: true, get: function () { return events_1.AnalyticsEvents; } });
var events_2 = require("./events");
Object.defineProperty(exports, "isValidEventProperties", { enumerable: true, get: function () { return events_2.isValidEventProperties; } });
