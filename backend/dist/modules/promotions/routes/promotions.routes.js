"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const utils_1 = require("../../../utils");
const promotions_controller_1 = require("../controllers/promotions.controller");
const router = (0, express_1.Router)();
router.get("/", (0, utils_1.catchAsync)(promotions_controller_1.promotionsController.list));
router.post("/validate", (0, utils_1.catchAsync)(promotions_controller_1.promotionsController.validate));
exports.default = router;
