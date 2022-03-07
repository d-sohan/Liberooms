require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const nanoid = require('nanoid');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');

const router = express.Router();
const root = "/renter";


router.use(bodyParser.urlencoded({ extended: true }));



sgMail.setApiKey(process.env.SENDGRID_API_KEY);

mongoose.connect('mongodb+srv://sohan:3Hzwv3miueDhTAwk@cluster0.ee94p.mongodb.net/liberoomsDB');



const renterSchema = new mongoose.Schema({
    fname: {
        type: String,
        trim: true
    },
    lname: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        trim: true
    },
    ownerOf: [mongoose.ObjectId]
});

const Renter = mongoose.model('Renter', renterSchema);










let signupFailed = false;
let signupMsg = "";

let loginFailed = false;
let loginMsg = "";

let forgotFailed = false;
let forgotMsg = "";

let verifyFailed = false;
let verifyMsg = "";

let renterObj = null;

let generatedCode = "";




function setDialog(path, failed = false, msg = "") {
    switch (path) {
        case "verify":
            verifyFailed = failed;
            verifyMsg = msg;
            break;
        case "login":
            loginMsg = msg;
            loginFailed = failed;
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




let loggedIn = {};

function login(renter) {
    if (!isLogged(renter.username)) {
        loggedIn[renter.username] = renter;
        console.log(`${renter.username} logged in.`);
    }
    else {
        throw "already logged in";
    }
}
function logout(renter) {
    if (renter !== undefined && isLogged(renter.username)) {
        delete loggedIn[renter.username];
        console.log(`${renter.username} logged out.`);
    }
}
function isLogged(username) {
    return loggedIn.hasOwnProperty(username);
}



router.get('/', function (req, res) {
    res.render('home', { userHeader: "Renter", userType: "renter" });
});



router.get('/login', function (req, res) {
    res.render('login', { userType: "renter", userHeader: "Renter", dialog: { msg: loginMsg, hasFailed: loginFailed, } });
    setDialog("login");
});


router.get('/signup', function (req, res) {
    res.render('signup', { userType: "renter", userHeader: "Renter", dialog: { msg: signupMsg, hasFailed: signupFailed, } });
    setDialog("signup");

});


router.get('/forgot', function (req, res) {
    res.render('forgot', { userType: "renter", userHeader: "Renter", dialog: { msg: forgotMsg, hasFailed: forgotFailed, } });
    setDialog("forgot");
});

const userRouter = require('./renter/users');


router.use('/user/:username', function (req, res, next) {
    const uid = req.params.username;
    if (isLogged(uid)) {
        req.renter = loggedIn[uid];
        next();
    }
    else {
        res.redirect(root + "/login");
    }
}, userRouter);

















router.post('/logout/:username', function (req, res) {
    const uid = req.params.username;
    if (loggedIn[uid] === undefined) {
        res.write("Already logged out by another instance.\n");
        res.write("Please close this tab/window.");
        res.send();
    }
    else {
        logout(loggedIn[uid]);
        res.redirect(root + "/login");
    }
})


router.post('/login', function (req, res) {
    const uid = req.body.username;
    const pwd = req.body.password;

    Renter.findOne({ username: uid }, function (err, foundUser) {
        if (err) {
            setDialog("login", true, "Error while searching database");

            res.redirect(root + "/login");
        }
        else {
            if (foundUser) {
                if (foundUser.password === pwd) {
                    try {
                        setDialog("login");
                        login(foundUser);
                        renterObj = foundUser;
                        res.redirect(root+`/user/${uid}`);
                    }
                    catch (err) {
                        res.write("Already logged in by another instance.\n");
                        res.write("Please close this tab/window.");
                        res.send();
                    }
                }
                else {
                    setDialog("login", true, "Incorrect password");

                    res.redirect(root + "/login");
                }
            }
            else {
                setDialog("login", true, `Username ${uid} not found.`);

                res.redirect(root + "/login");
            }
        }
    })
});





















router.post('/signup', function (req, res) {
    renterObj = new Renter({
        fname: req.body.firstname,
        lname: req.body.lastname,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        ownerOf: []
    });

    Renter.findOne({ $or: [{ email: renterObj.email }, { username: renterObj.username }] }, function (err, foundUser) {
        if (err) {
            setDialog("signup", true, "Error occured while checking for existing username and email");

            res.redirect(root + '/signup');
        }
        else {
            if (foundUser) {
                let x = true, y = "";
                if (foundUser.username === renterObj.username && foundUser.email === renterObj.email)
                    y = `Renter with username ${renterObj.username} and email ${renterObj.email} already exists.`
                else if (foundUser.username === renterObj.username)
                    y = `Renter with username ${renterObj.username} already exists.`
                else
                    y = `Renter with email ${renterObj.email} already exists.`

                setDialog("signup", x, y);
                    
                res.redirect(root + '/signup');
            }
            else {
                generatedCode = nanoid.nanoid();
                try {
                    sgMail.send({
                        to: renterObj.email,
                        from: process.env.SENDER,
                        subject: "Liberooms Renter Verification",
                        text: `Code: ${generatedCode}`
                    });
                    res.render('verify', { purpose: "Verify", userHeader: "Renter", userType: "renter", userEmail: renterObj.email, dialog: { msg: verifyMsg, hasFailed: verifyFailed, } });
                    setDialog("verify");
                }
                catch (err) {
                    console.error(err);
                    if (err.response) {
                        console.error(err.response.body);
                    }
                    setDialog("signup", true, `Could not send verification email to ${renterObj.email}`);

                    res.redirect(root + '/signup');
                }
            }
        }
    });
});
















router.post('/forgot', function (req, res) {
    const email = req.body.email;
    Renter.findOne({ email: email }, function (err, foundUser) {
        if (err) {
            setDialog("forgot", true, "Error while checking database for email.");

            res.redirect(root + "/forgot");
        }
        else {
            if (foundUser) {
                renterObj = foundUser;
                generatedCode = nanoid.nanoid();
                try {
                    sgMail.send({
                        to: email,
                        from: process.env.SENDER,
                        subject: "Liberooms Authentication",
                        text: `Code to retrieve credentials: ${generatedCode}`
                    });
                    setDialog("forgot");
                    res.render('verify', { purpose: "Get Credentials", userHeader: "Renter", userType: "renter", userEmail: email, dialog: { msg: verifyMsg, hasFailed: verifyFailed, } });
                    setDialog("verify");
                }
                catch (err) {
                    setDialog("forgot", true, "Failed to send mail.");

                    res.redirect(root + "/forgot");
                }
            }
            else {
                setDialog("forgot", true, `Email ${email} not found.`);

                res.redirect(root + "/forgot");
            }
        }
    });
});










router.post('/verify', function (req, res) {
    const userCode = req.body.code;
    const purpose = req.body.submit;
    if (userCode === generatedCode) {
        if (purpose === 'Get Credentials') {
            const uid = renterObj.username;
            const pwd = renterObj.password;
            const email = renterObj.email;
            try {
                sgMail.send({
                    to: email,
                    from: process.env.SENDER,
                    subject: "Liberooms Credentials",
                    text: `Username: ${uid}\nPassword: ${pwd}`
                });
                setDialog("verify");
                setDialog("login", false, "Credentials mailed successfully. Please check your spam folder too.");
                res.redirect(root + "/login");
            }
            catch (err) {
                setDialog("forgot", true, "Failed to mail credentials.");
                if (err.response) {
                    forgotMsg = err.response.body;
                }
                res.redirect(root + "/forgot");
            }
        }
        else {
            const renter = renterObj;
            renter.save(function (err) {
                if (err) {
                    setDialog("signup", true, "DATABASE INSERTION ERROR" );
                    res.redirect(root + '/signup');
                }
                else {
                    setDialog("signup");
                    setDialog("login", false, "Signed Up successfully.")
                    res.redirect(root + "/login");
                }
            });
        }
        
    }
    else {
        setDialog("verify", true, "Wrong code entered");
        res.render('verify', { purpose: purpose, userHeader: "Renter", userType: "renter", userEmail: renterObj.email, dialog: { hasFailed: verifyFailed, msg: verifyMsg } });
        setDialog("verify");
    }
});

















module.exports = router;