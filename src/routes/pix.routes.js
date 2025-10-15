const express = require("express");
const router = express.Router();
const pixController = require("../controllers/pix.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/PixKey", authMiddleware, pixController.createPixKey);
router.get("/getPixKeys/:accountId", authMiddleware, pixController.getPixKeys);
router.get("/:pixKeyValue/PixKey", authMiddleware, pixController.getPixKeyByValue);
router.post("/transferPix", authMiddleware, pixController.transferPix);

module.exports = router;
