"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
const generateToken = (userId, email, role, sessionId) => {
    const expiresIn = environment_1.env.JWT_EXPIRE;
    return jsonwebtoken_1.default.sign({
        userId,
        email,
        role,
        sid: sessionId,
    }, environment_1.env.JWT_SECRET, {
        expiresIn,
        algorithm: "HS256",
    });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, environment_1.env.JWT_SECRET);
    }
    catch (error) {
        throw new Error("Invalid token");
    }
};
exports.verifyToken = verifyToken;
exports.default = { generateToken: exports.generateToken, verifyToken: exports.verifyToken };
