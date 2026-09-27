"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySocketToken = verifySocketToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function verifySocketToken(token) {
    try {
        const secret = process.env.JWT_SECRET;
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch {
        return null;
    }
}
