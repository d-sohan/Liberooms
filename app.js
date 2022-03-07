const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');


app.get('/', function (req, res) {
    res.render('index');
});

const renterRouter = require("./routes/renter");
const tenantRouter = require("./routes/tenant");

app.use("/renter", renterRouter);
app.use("/tenant", tenantRouter);





app.listen(3000, function () {
    console.log("Server started on port 3000");
})