process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;
let invTestRes;

beforeEach(async function () {
    //before each request, insert a new company to db
    let res = await db.query(
        `INSERT INTO companies (code, name, description) 
        VALUES ('MSFT', 'Microsoft','Many things') 
        RETURNING code, name,description`);
    let invRes = await db.query(
        `INSERT INTO invoices(comp_code, amt, paid, paid_date)
        VALUES('MSFT', 100, false, null)
        RETURNING id, comp_code, amt, paid, paid_date`);
    testCompany = res.rows[0];
    invTestRes = invRes.rows[0];

});


afterEach(async function () {
    // delete any data created by tests
    await db.query("DELETE FROM companies");
});


afterAll(async function () {
    // close db connection
    await db.end();
});

//Test GET route / companies

describe("GET /companies", function () {
    test("Gets a list of companies", async () => {
        const res = await request(app).get("/companies");
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            "companies": [testCompany]
        });
    });
});

//Test GET route / companies/:id


describe("GET /companies/:id", () => {
    test("Gets a single company", async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`)
        expect(res.body).toEqual(
            {
                "company": {
                    code: "MSFT",
                    name: "Microsoft",
                    description: "Many things",
                    invoices: [invTestRes],
                }
            }
        )
    });

    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).get(`/company/0`)
        expect(res.statusCode).toBe(404);
    })
})

//Test POST route /companies
describe("POST /companies", () => {
    test("Creates a single company", async () => {
        const res = await request(app).post('/companies').send({ code: 'testComp2', name: 'Company2', description: 'testing company2' });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            company: { code: 'testComp2', name: 'Company2', description: 'testing company2' }
        })
    })
})

//Test PATCH route /companies

describe("PATCH /companies/:id", () => {
    test("Updates a company", async () => {
        const res = await request(app)
            .patch(`/companies/MSFT`)
            .send({ name: 'MicrosoftTwo', description: "ManythingsTwo" });
        console.log(res.body)
        expect(res.body).toEqual({
            "company": {
                code: "MSFT",
                name: "MicrosoftTwo",
                description: "ManythingsTwo",
            }
        })
    })
    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).patch(`/companies/wrongCode`).send({ name: 'wrongComp' });
        expect(res.statusCode).toBe(404);
    })
})

//Test Delete route /companies

describe("DELETE /", function () {

    test("Delete a company", async function () {
        const res = await request(app)
            .delete("/companies/MSFT");

        expect(res.body).toEqual({ "status": "deleted" });
    });

    test("It should return 404 for no company found", async function () {
        const res = await request(app)
            .delete("/companies/wrong company");

        expect(res.status).toEqual(404);
    });
});

