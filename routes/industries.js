
const express = require("express");

const ExpressError = require("../expressError")

const db = require("../db");

const router = new express.Router();

// List all industries

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT * FROM industries`);

        return res.json({ "industries": results.rows });
    }

    catch (err) {
        return next(err);
    }
});


// Add new industry

router.post("/", async function (req, res, next) {
    try {
        const { code, industry, comp_code } = req.body;

        const result = await db.query(
            `INSERT INTO industries (code, industry, comp_code)
           VALUES ($1, $2, $3)
           RETURNING code, industry, comp_code`,
            [code, industry, comp_code]
        );

        return res.status(201).json({ "industry": result.rows[0] });
    }

    catch (err) {
        return next(err);
    }
});



module.exports = router;