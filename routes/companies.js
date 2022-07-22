
const express = require("express");
const slugify = require("slugify");
const ExpressError = require("../expressError")

const db = require("../db");

const router = new express.Router();

/** GET / => list of companies.
 *
 * =>  {companies: [{code, name, descrip}, {code, name, descrip}, ...]}
 *
 * */

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT code, name, description FROM companies`);

        return res.json({ "companies": results.rows });
    }

    catch (err) {
        return next(err);
    }
});



/** GET /[code] => detail on company
 *
 * =>  {company: {code, name, descrip, invoices: [id, ...]}}
 *
 * */

router.get("/:id", async function (req, res, next) {
    try {
        const comp_id = req.params.id;

        const comp_result = await db.query(
            `SELECT code, name, description
         FROM companies
         WHERE code =$1`, [comp_id]);


        const inv_result = await db.query(
            `SELECT id 
            FROM invoices
            WHERE comp_code=$1`,
            [comp_id]
        );
        //If the company given cannot be found, this should return a 404 status response.
        if (comp_result.rows.length === 0) {
            throw new ExpressError(`Company ${comp_id} does not exist`, 404)
        }
        const comp = comp_result.rows[0];
        const invs = inv_result.rows;

        //filter to create a new array of invoices id corresponding to company code inputted
        const invs_arr = invs.filter(inv => inv.id);

        const compRes = { "company": comp, "invoices": invs_arr }
        return res.json(compRes);
    }

    catch (err) {
        return next(err);
    }
});




/*POST /companies
Adds a company. Needs to be given JSON like: {code, name, description} . Returns obj of new company: {company: {code, name, description}}*/

//Note that we use HTTP status code 201 (“Created”) here, not 200 (“Ok”).

router.post("/", async function (req, res, next) {
    try {
        const { name, description } = req.body;
        let code = slugify(name, { lower: true })
        const result = await db.query(
            `INSERT INTO companies (code, name, description)
             VALUES ($1, $2, $3)
             RETURNING code, name, description`,
            [code, name, description]
        );

        return res.status(201).json({ "company": result.rows[0] });
    }

    catch (err) {
        return next(err);
    }
});

/*
PUT /companies/[code] - Edit existing company. Should return 404 if company cannot be found.
 
Needs to be given JSON like: {name, description} - Returns update company object: {company: {code, name, description}}
*/

router.patch("/:id", async function (req, res, next) {
    try {
        const { name, description } = req.body;
        const id = req.params.id;
        const result = await db.query(
            `UPDATE companies SET name=$1, description=$2
             WHERE code = $3
             RETURNING code, name, description`,
            [name, description, id]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(`Company ${id} does not exist`, 404)
        }

        return res.json({ "company": result.rows[0] });
    } catch (err) {
        return next(err);
    };
});


/*
DELETE /companies/[code] - Deletes company.
 
Should return 404 if company cannot be found. Returns {status: "deleted"} */


router.delete("/:id", async function (req, res, next) {
    try {
        const id = req.params.id;
        const result = await db.query(
            `DELETE FROM companies WHERE code = $1
            RETURNING code`,
            [id]
        );
        if (result.rows.length === 0) {
            throw new ExpressError(`Company ${id} does not exist`, 404)
        }
        return res.json({ status: "deleted" });
    }

    catch (err) {
        return next(err);
    }
});

module.exports = router;