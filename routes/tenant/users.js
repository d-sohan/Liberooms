const router = require('express').Router();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const models = require('../../models');


router.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb+srv://sohan:3Hzwv3miueDhTAwk@cluster0.ee94p.mongodb.net/liberoomsDB');


let dashboardFailed = false;
let dashboardMsg = "";
let searchFailed = false;
let searchMsg = "";
let showResults = false;
let results = {};

function setDialog(path, failed = false, msg = "") {
    switch (path) {
        case "houseReg":
            houseRegFailed = failed;
            houseRegMsg = msg;
            break;
        case "dashboard":
            dashboardMsg = msg;
            dashboardFailed = failed;
            break;
        case "signup":
            signupMsg = msg;
            signupFailed = failed;
            break;
        case "forgot":
            forgotFailed = failed;
            forgotMsg = msg;
        default:
            break;
    }
}

const House = models.houseModel;



router.get('/', function (req, res) {
    res.render('tenant_dashboard', { tenantPtr: req.tenant, userHeader: "Tenant", userType: "tenant", dialog: { msg: dashboardMsg, hasFailed: dashboardFailed, } })
    setDialog("dashboard");
});


router.get('/search', function (req, res) {
    res.render('search', { results: results, showResults: showResults, tenantPtr: req.tenant, userHeader: "Tenant", userType: "tenant", dialog: { msg: searchMsg, hasFailed: searchFailed, } })
    showResults = false;
    results = {};
});

router.post('/search', function (req, res) {
    let city = (req.body.search).toLowerCase().trim();
    House.find({ city: city }, function (err, foundHouses) {
        if (err) {
            console.error(err);
            setDialog("dashboard", true, "Error while searching for houses");
            res.redirect(`/tenant/user/${req.tenant.username}`);
        }
        else {
            results = foundHouses;
            showResults = true;
            res.redirect(`/tenant/user/${req.tenant.username}/search`);
        }
    })
})


































module.exports = router;
