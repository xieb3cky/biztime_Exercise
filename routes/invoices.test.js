const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testInv;


afterEach(async function () {
    // delete any data created by tests
    await db.query("DELETE FROM invoices");
});

afterAll(async () => {
    await db.end();
});


describe("GET /invoices", function () {

    test("Get all invoices", async () => {
        const res = await request(app).get("/invoices");
        expect(res.body).toEqual({
            "invoices": [
                { id: 1, comp_code: "apple" },
                { id: 2, comp_code: "apple" },
                { id: 3, comp_code: "apple" },
                { id: 4, comp_code: "ibm" },
            ]
        });
    })

});

describe("GET invoices/1", function () {

    test("Get information 1 invoice", async () => {
        const res = await request(app).get("/invoices/1");
        expect(res.body).toEqual(
            {
                "invoice": {
                    id: 1,
                    amt: 100,
                    add_date: '2018-01-01T08:00:00.000Z',
                    paid: false,
                    paid_date: null,
                    company: {
                        code: 'apple',
                        name: 'Apple',
                        description: 'Maker of OSX.',
                    }
                }
            }
        );
    });

    test("It should return 404 for invoice not found ", async () => {
        const res = await request(app).get("/invoices/444");
        expect(res.status).toEqual(404);
    })
});


describe("POST /invoices", function () {

    test("Add a new invoice", async () => {
        const res = await request(app)
            .post("/invoices")
            .send({ amt: 200, comp_code: 'ibm' });

        expect(res.body).toEqual(
            {
                "invoice": {
                    id: 5,
                    comp_code: "ibm",
                    amt: 200,
                    add_date: expect.any(String),
                    paid: false,
                    paid_date: null,
                }
            }
        );
    });
});




describe("PUT /invoices/id", function () {

    test("Update invoice", async () => {
        const res = await request(app)
            .put("/invoices/1")
            .send({ amt: 1000, paid: false });

        expect(res.body).toEqual(
            {
                "invoice": {
                    id: 1,
                    comp_code: 'apple',
                    paid: false,
                    amt: 1000,
                    add_date: expect.any(String),
                    paid_date: null,
                }
            }
        );
    });

    test("It should return 404 for invoice not found", async () => {
        const res = await request(app)
            .put("/invoices/4444")
            .send({ amt: 1000 });

        expect(res.status).toEqual(404);
    });

    test("Return 500 for missing data", async () => {
        const res = await request(app)
            .put("/invoices/1")
            .send({});
        expect(res.status).toEqual(500);
    })
});


describe("DELETE /invoices/id", function () {

    test("Delete an invoice ", async () => {
        const res = await request(app)
            .delete("/invoices/1");

        expect(res.body).toEqual({ "status": "deleted" });
    });

    test("Return 404 for invoice not found", async () => {
        const res = await request(app)
            .delete("/invoices/444");

        expect(res.status).toEqual(404);
    });
});

