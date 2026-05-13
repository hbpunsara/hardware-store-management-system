import { Request, Response } from "express";
import escpos from "escpos";
import USB from "escpos-usb";
import Network from "escpos-network";

export const printerController = {
  printReceipt: async (req: Request, res: Response) => {
    try {
      const { receiptData } = req.body;
      if (!receiptData) {
        return res.status(400).json({ message: "No receipt data provided" });
      }

      // 1. Setup Device Adapter
      let device: any;
      const printerIp = process.env.PRINTER_IP; // e.g. "192.168.1.100"
      const printerPort = parseInt(process.env.PRINTER_PORT || "9100", 10);

      try {
        if (printerIp) {
          console.log(`[Printer] Connecting to Network printer at ${printerIp}:${printerPort}`);
          device = new Network(printerIp, printerPort);
        } else {
          console.log("[Printer] Connecting to USB printer");
          device = new USB();
        }
      } catch (err) {
        console.warn("[Printer] Hardware initialization failed. Falling back to console simulation.");
        return simulatePrint(receiptData, res);
      }

      // 2. Execute Print Job
      const printer = new escpos.Printer(device);

      device.open((error: any) => {
        if (error) {
          console.error("[Printer] Connection error:", error);
          // If hardware is missing, we fallback to simulation for dev friendliness
          return simulatePrint(receiptData, res, "Hardware connection failed, simulation used.");
        }

        const storeName = receiptData.storeName || 'HARDWARE STORE';
        
        printer
          .font('a')
          .align('ct')
          .style('b')
          .size(2, 2)
          .text(storeName)
          .size(1, 1)
          .text('Professional Hardware Solutions')
          .text('================================')
          .feed(1)
          .align('lt');

        // Column Header
        printer.text('Item             Qty      Price');
        printer.text('--------------------------------');

        (receiptData.items || []).forEach((item: any) => {
          const name = (item.name || item.productName || 'Item').substring(0, 15).padEnd(16);
          const qty = String(item.quantity).padStart(3);
          const price = Number(item.price * item.quantity).toFixed(2).padStart(10);
          printer.text(`${name} ${qty} ${price}`);
        });

        printer
          .text('--------------------------------')
          .align('rt')
          .text(`SUBTOTAL: LKR ${Number(receiptData.subtotal).toFixed(2)}`)
          .text(`TAX:      LKR ${Number(receiptData.tax).toFixed(2)}`)
          .style('b')
          .size(1, 1)
          .text(`TOTAL:    LKR ${Number(receiptData.total).toFixed(2)}`)
          .size(1, 1)
          .style('normal')
          .feed(1)
          .align('ct')
          .text('Thank you for your business!')
          .text(new Date().toLocaleString())
          .feed(3)
          .cut()
          .close();

        res.json({ message: "Print job sent to thermal printer successfully." });
      });

    } catch (error) {
      console.error("Print job error", error);
      res.status(500).json({ message: "Failed to process print job" });
    }
  }
};

// Helper for dev simulation
function simulatePrint(receiptData: any, res: Response, note = "Printed successfully (Mocked)") {
  const storeName = receiptData.storeName || 'HARDWARE STORE';
  const lines = [
    "======= THERMAL RECEIPT =======",
    `        ${storeName.toUpperCase()}        `,
    "===============================",
    `Date: ${new Date().toLocaleString()}`,
    "-------------------------------",
    ...(receiptData.items || []).map((i: any) => {
      const namePart = String(i.name || i.productName || 'Item').substring(0, 15).padEnd(16);
      const pricePart = `LKR ${Number(i.price).toLocaleString()}`;
      return `${i.quantity}x ${namePart} ${pricePart}`;
    }),
    "-------------------------------",
    `Total:        LKR ${receiptData.total}`,
    "===============================",
    "       (END OF RECEIPT)        \n"
  ];
  console.log("\n" + lines.join("\n"));
  return res.json({ message: note });
}

