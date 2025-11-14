const express = require("express");
const router = express.Router();
const pixController = require("../controllers/pix.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/create_pix_key", authMiddleware, pixController.createPixKey);
router.delete("/delete_pix_key/:keyType/:keyValue", authMiddleware, pixController.deletePixKey);
router.delete("/delete_qr_code/:txid", authMiddleware, pixController.deleteQrCode);
router.get("/get_pix_keys_by_accountId/:accountId", authMiddleware, pixController.getPixKeysByAccountId);
router.get("/get_qr_code/:payload", authMiddleware, pixController.getQrCode);
router.post("/transfer_pix", authMiddleware, pixController.transferPix);
router.post("/transfer_qr_code", authMiddleware, pixController.transferQrCode);
router.post("/create_pix_qr", authMiddleware, pixController.createPixQr);

module.exports = router;
