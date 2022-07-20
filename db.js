/** Database setup for BizTime. */


const { Client } = require("pg");

const client = new Client({
    connectionString: "postgresql:///biztime",
});

client.connect()
    .then(() => {
        console.log("connect successful")
    })
    .catch((e) => { console.log(e) })


module.exports = client;