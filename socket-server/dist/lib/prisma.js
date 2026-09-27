"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = require("fs");
const path_1 = require("path");
const client_1 = require("../../../web/node_modules/@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const explicitDatabaseUrl = process.env.DATABASE_URL;
dotenv_1.default.config();
if (process.env.NODE_ENV !== 'production' && !explicitDatabaseUrl) {
    const webEnvPath = (0, path_1.resolve)(__dirname, '../../../web/.env');
    if ((0, fs_1.existsSync)(webEnvPath)) {
        const webEnv = dotenv_1.default.parse((0, fs_1.readFileSync)(webEnvPath));
        if (webEnv.DATABASE_URL) {
            process.env.DATABASE_URL = webEnv.DATABASE_URL;
        }
    }
}
let prisma;
if (global.prisma) {
    exports.prisma = prisma = global.prisma;
}
else {
    const connectionString = process.env.DATABASE_URL;
    const pool = new pg_1.Pool({ connectionString });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    exports.prisma = prisma = new client_1.PrismaClient({ adapter });
    if (process.env.NODE_ENV !== 'production') {
        global.prisma = prisma;
    }
}
