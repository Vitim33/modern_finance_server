const express = require("express");
const router = express.Router();
const pixController = require("../controllers/pix.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/PixKey", authMiddleware, pixController.createPixKey);
router.delete("/deletePixKey/:keyType/:keyValue", authMiddleware, pixController.deletePixKey);
router.delete("/deleteQrCode/:txid", authMiddleware, pixController.deleteQrCode);
router.get("/getPixKeysByAccountId/:accountId", authMiddleware, pixController.getPixKeysByAccountId);
router.get("/getQrCode/:payload", authMiddleware, pixController.getQrCode);
router.post("/transferPix", authMiddleware, pixController.transferPix);
router.post("/createPixQr", authMiddleware, pixController.createPixQr);

module.exports = router;
