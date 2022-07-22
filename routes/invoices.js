
const express = require("express");
const db = require("../db");
const ExpressError = require("../expressError");
const router = express.Router();

/*GET / invoices
Return info on invoices: like { invoices: [{ id, comp_code }, ...] }
*/

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT id,comp_code FROM invoices`);

        return res.json({ "invoices": results.rows });
    }

    catch (err) {
        return next(err);
    }
});


/*GET /invoices/[id] Returns obj on given invoice. If invoice cannot be found, returns 404.
Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}*/


router.get("/:id", async function (req, res, next) {
    try {
        const inv_id = req.query.id;

        const results = await db.query(
            `SELECT inv.id, inv.amt, inv.paid, inv.add_date, inv.paid_date,
       FROM invoices AS inv
        INNER JOIN companies AS comp ON (inv.comp_code = comp.id)
       WHERE id=$1`, [inv_id]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Cannot find invoice : ${inv_id}`, 404);
        }
        const invoice = results.rows[0]
        const invoice_data = {
            id: invoice.id,
            amt: invoice.amt,
            paid: invoice.paid,
            add_date: invoice.add_date,
            paid_date: invoice.paid_date,
            company: {
                code: invoice.comp_code,
                name: invoice.name,
                description: invoice.description
            }
        }
        return res.json({ "invoice": invoice_data })
    }
    catch (err) {
        return next(err);
    }
});
/*
POST /invoices. Adds an invoice. Needs to be passed in JSON body of: {comp_code, amt}
Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}*/


router.post("/", async function (req, res, next) {
    try {
        const { comp_code, amt } = req.body;

        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt)
           VALUES ($1, $2)
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]
        );

        return res.status(201).json({ "invoices": result.rows[0] });
    }

    catch (err) {
        return next(err);
    }
});

/** PUT /[code] => update invoice
 *
 * {amt, paid}  =>  {id, comp_code, amt, paid, add_date, paid_date}
 *
 * If paying unpaid invoice, set paid_date; if marking as unpaid, clear paid_date.
 * */

router.patch("/:id", async function (req, res, next) {
    try {
        const { amt, paid } = req.body;
        const id = req.params.id;
        let paidDate = null;

        const invRes = await db.query(
            `SELECT * FROM invoices WHERE id = $1`, [id]
        )
        if (invRes.rows.length === 0) {
            throw new ExpressError(`Invoice ${id} does not exist`, 404);
        }
        //if invoice is not paid & paid is true = paying unpaid invoice
        if (!invRes.rows[0].paid && paid) {
            paidDate = new Date();
        } else if (!paid) {
            paidDate = null;
        } else {
            paidDate = invRes.rows[0].paid_date;
        }

        const result = await db.query(
            `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3
           WHERE id = $4
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, id]
        );

        return res.json({ "invoice": result.rows[0] });
    }

    catch (err) {
        return next(err);
    }
});


/*
DELETE / invoices / [id] Deletes an invoice.

If invoice cannot be found, returns a 404. Returns: { status: "deleted" }
*/

router.delete("/:id", async function (req, res, next) {
    try {
        const inv_id = req.params.id;
        const result = await db.query(
            `DELETE FROM invoices 
            WHERE id =$1
            RETURNING id`,
            [inv_id]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Cannot find invoice : ${inv_id}`, 404);
        }
        return res.json({ "status": "deleted" })
    } catch (err) {
        return next(err);
    };
});

module.exports = router;