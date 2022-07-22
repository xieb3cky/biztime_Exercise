/** BizTime express application. */


const express = require("express");
const ExpressError = require("./expressError")
const compRouter = require("./routes/companies")
const invsRouter = require("./routes/invoices")
const indRouter = require("./routes/industries")

const app = express();

app.use(express.json());


app.use('/companies', compRouter);
app.use('/invoices', invsRouter);
app.use('/industries', indRouter);

/** 404 handler */

app.use(function (req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});


module.exports = app;
