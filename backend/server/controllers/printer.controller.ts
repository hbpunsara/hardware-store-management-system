import { Request, Response } from "express";

export const printerController = {
    printReceipt: async (req: Request, res: Response) => {
        try {
            const { receiptData } = req.body;
            if (!receiptData) {
                return res.status(400).json({ message: "No receipt data provided" });
            }

            // Hardware level ESC/POS logic dynamically required
            // Using a mock logger if standard ESC/POS hardware is detached during dev
            let escpos;
            try {
                // Attempt to load standard ESC/POS drivers if available on host machine
                escpos = require('escpos');
                escpos.USB = require('escpos-usb');
            } catch (e) {
                console.warn("[ESC/POS Print Engine] Native 'escpos' drivers not found. Simulating hardware print job via terminal logger.");

                const storeName = receiptData.storeName || 'HARDWARE STORE';
                const lines = [
                    "===================================",
                    `        ${storeName.toUpperCase()}        `,
                    "===================================",
                    `Date: ${new Date().toLocaleString()}`,
                    "-----------------------------------",
                    ...(receiptData.items || []).map((i: any) => {
                        const namePart = String(i.name || i.productName || 'Item').substring(0, 15).padEnd(16);
                        const pricePart = `LKR ${Number(i.price).toLocaleString()}`;
                        return `${i.quantity}x ${namePart} ${pricePart}`;
                    }),
                    "-----------------------------------",
                    `Subtotal:                 LKR ${receiptData.subtotal}`,
                    `Tax:                      LKR ${receiptData.tax}`,
                    `Total:                    LKR ${receiptData.total}`,
                    "===================================",
                    "       Thank you for shopping!       ",
                    "===================================\n"
                ];
                console.log("\n" + lines.join("\n"));

                return res.json({ message: "Printed successfully (Mocked)" });
            }

            // Actual hardware print execution logic if modules exist
            const device = new escpos.USB();
            const printer = new escpos.Printer(device);

            device.open((error: any) => {
                if (error) {
                    console.error("Printer connection error:", error);
                    return res.status(500).json({ message: "Failed to connect to USB ESC/POS peripheral." });
                }

                printer
                    .font('a')
                    .align('ct')
                    .style('b')
                    .size(1, 1)
                    .text(receiptData.storeName || 'HARDWARE STORE')
                    .text('================')
                    .align('lt');

                (receiptData.items || []).forEach((item: any) => {
                    printer.text(`${item.quantity}x ${item.name || item.productName} ... LKR ${item.price}`);
                });

                printer
                    .text('----------------')
                    .text(`TOTAL: LKR ${receiptData.total}`)
                    .cut()
                    .close();

                res.json({ message: "Printed successfully sent to hardware." });
            });

        } catch (error) {
            console.error("Print job error", error);
            res.status(500).json({ message: "Failed to process print job" });
        }
    }
};
