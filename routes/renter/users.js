const router = require('express').Router();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const models = require('../../models');

router.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect('mongodb+srv://sohan:3Hzwv3miueDhTAwk@cluster0.ee94p.mongodb.net/liberoomsDB');







const House = models.houseModel;

let houseRegMsg = "";
let houseRegFailed = false;
let dashboardFailed = false;
let dashboardMsg = "";
let houseManMsg = "", houseManFailed = false;

let viewHouses = false;
let selectedHouseIndex = -1;




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



router.get('/', function (req, res) {
    res.render('renter_dashboard', { renterPtr: req.renter, userHeader: "Renter", userType: "renter", dialog: { msg: dashboardMsg, hasFailed: dashboardFailed, } })
    setDialog("dashboard");
    selectedHouseIndex = -1;
    viewHouses = false;

});

router.get('/houses/create', function (req, res) {
    res.render('newhouse', { renterPtr: req.renter, userHeader: "Renter", userType: "renter", dialog: { msg: houseRegMsg, hasFailed: houseRegFailed, } })
    setDialog("houseReg");
});



router.get('/houses/manage', function (req, res) {
    const email = req.renter.email;
    House.find({ ownerEmail: email }, function (err, foundHouses) {
        if (err) {
            console.error(err);
            setDialog("dashboard", true, "Error while searching for houses");
            res.redirect(`/renter/user/${req.renter.username}`);
        }
        else {
            res.render('managehouse', { chosenHouse: foundHouses[selectedHouseIndex], viewHouses: viewHouses, ownerHouses: foundHouses, renterPtr: req.renter, userHeader: "Renter", userType: "renter", dialog: { msg: houseManMsg, hasFailed: houseManFailed, } })
        }
    })
})

router.get('/ads/create', function (req, res) {
    res.send(`${req.renter.fname}'s new ad`);
})


router.post('/houses/create', function (req, res) {
    const house = new House({
        houseNumber: req.body.housenumber,
        street: (req.body.street).trim().toLowerCase(),
        city: (req.body.city).trim().toLowerCase(),
        pin: req.body.pincode,
        state: (req.body.state).trim().toLowerCase(),
        country: (req.body.country).trim().toLowerCase(),
        occupantEmail: "",
        ownerEmail: req.renter.email,
        occupied: false,
        adId: null,
        complaints: [],
        notifications: [],
        requests: []
    });

    House.findOne({ $and: [{ houseNumber: req.body.housenumber }, { pin: req.body.pincode }] }, function (err, foundHouse) {
        if (err) {
            console.error(err);
            setDialog("houseReg", true, "Error occured while checking for existing houses");
            res.redirect(`/renter/user/${req.renter.username}/houses/create`);
        }
        else {
            if (foundHouse) {
                setDialog("houseReg", true, `House with number ${foundHouse.houseNumber} at pincode ${foundHouse.pin} already registered.\nOwner's email is ${foundHouse.ownerEmail}`);
                res.redirect(`/renter/user/${req.renter.username}/houses/create`);
            }
            else {
                house.save(function (err) {
                    if (err) {
                        console.error(err);
                        setDialog("houseReg", true, "Error occured while inserting house");
                        res.redirect(`/renter/user/${req.renter.username}/houses/create`);
                    }
                    else {
                        setDialog("houseReg");
                        setDialog("dashboard", false, "House registered successfully");
                        res.redirect(`/renter/user/${req.renter.username}`);
                    }
                });
            }
        }
    });
});


router.post('/houses/manage', function (req, res) {
    selectedHouseIndex = parseInt(req.body.house);
    viewHouses = true;
    res.redirect(`/renter/user/${req.renter.username}/houses/manage`);

})

module.exports = router;

