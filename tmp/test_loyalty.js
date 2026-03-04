const http = require('http');

const makeRequest = (options, postData) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
};

async function testLoyalty() {
    try {
        console.log("Fetching customers...");
        const customersRes = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/customers',
            method: 'GET'
        });

        if (customersRes.status !== 200 || customersRes.data.length === 0) {
            console.log("No customers found or error fetching customers.");
            return;
        }

        // Pick the first customer
        const customer = customersRes.data[0];
        const originalPoints = customer.loyaltyPoints;
        console.log(`Testing with Customer: ${customer.name}, ID: ${customer.id}, Initial Points: ${originalPoints}`);

        // Create a sale to earn points
        console.log("\nCreating a sale to earn points...");
        let saleData = {
            items: [{ productId: null, productName: "Test Item", quantity: 1, price: 50.00 }],
            subtotal: 50.00,
            tax: 0,
            discount: 0,
            discountTotal: 0,
            total: 50.00,
            paymentMethod: "Cash",
            customerId: customer.id
        };

        const saleRes = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/sales',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, saleData);

        console.log(`Sale response status: ${saleRes.status}`);

        // Fetch customer again to check points
        const customerRes2 = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: `/api/customers/${customer.id}`,
            method: 'GET'
        });

        console.log(`Points after sale ($50 spent = 50 pts): ${customerRes2.data.loyaltyPoints}`);

        // Redeem some points
        console.log("\nRedeeming 20 points...");
        let redeemData = {
            customerId: customer.id,
            points: 20
        };

        const redeemRes = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/loyalty/redeem',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, redeemData);

        console.log(`Redeem response status: ${redeemRes.status}`);
        console.log("Message:", redeemRes.data.message);

        // Fetch ledger
        console.log("\nFetching Loyalty Ledger...");
        const ledgerRes = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: `/api/customers/${customer.id}/loyalty`,
            method: 'GET'
        });

        console.log(`Ledger entries found: ${ledgerRes.data.length}`);
        ledgerRes.data.forEach(entry => {
            console.log(`- ${new Date(entry.createdAt).toISOString()} | ${entry.pointsDelta > 0 ? '+' : ''}${entry.pointsDelta} | ${entry.reason}`);
        });

        console.log("\nTest Completed Successfully!");
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testLoyalty();
