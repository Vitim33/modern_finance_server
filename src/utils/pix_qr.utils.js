const crc = require("crc");

function generatePixPayload({ pixKey, merchantName, merchantCity, amount, txid }) {
  function format(id, value) {
    const length = String(value.length).padStart(2, "0");
    return `${id}${length}${value}`;
  }

  const payload = [
    format("00", "01"), 
    format("26", [
      format("00", "BR.GOV.BCB.PIX"),
      format("01", pixKey),
    ].join("")),
    format("52", "0000"),
    format("53", "986"), 
    format("54", amount.toFixed(2)),
    format("58", "BR"),
    format("59", merchantName.substring(0, 25)),
    format("60", merchantCity.substring(0, 15)),
    format("62", format("05", txid)),
  ].join("");

  const crc16 = crc.crc16xmodem(payload + "6304").toString(16).toUpperCase().padStart(4, "0");

  return `${payload}6304${crc16}`;
}

module.exports = { generatePixPayload };
