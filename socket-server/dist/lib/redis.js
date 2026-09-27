"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const redis = process.env.NODE_ENV === 'production' && process.env.REDIS_URL
    ? new ioredis_1.default(process.env.REDIS_URL)
    : {}; // mock or disable for local
if (redis.on) {
    redis.on('error', (err) => {
        console.error('Redis error:', err);
    });
}
exports.default = redis;
