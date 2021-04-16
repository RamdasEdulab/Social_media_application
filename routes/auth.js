const express = require("express");
const router = express.Router();
const User = require("../models/user");
const passport = require("../passport");
const multer = require("multer");
const cloudinary = require("cloudinary");
const jwt = require("jsonwebtoken");

const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

const imageFilter = function(req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: imageFilter
});



router.post("/register", upload.single("file"), (req, res) => {
  const { username, password } = req.body;
  if (req.file) {
    const file = req.file.path;
          User.findOne({ username: username })
            .then(user => {
              if (user) {
                return res.json({
                  error: "Username taken"
                });
              }
              const newUser = new User({
                username: req.body.username,
                password: req.body.password,
                avatar: req.body.avatar,
                
              });
              newUser.save((err, savedUser) => {
                if (err) return res.json(err);
                res.json({ success: "Successfully registered" });
              });
            })
            .catch(err => {
              res.json(err);
            });
        }
      });
  

router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.json({ message: info.message });
    }
    req.login(user, { session: false }, loginErr => {
      if (loginErr) {
        return next(loginErr);
      }
      const token = jwt.sign(JSON.stringify(user), process.env.JWT_SECRET);
      const userInfo = {
        id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar
      };
      return res.json({ userInfo, token });
    });
  })(req, res, next);
});

router.post("/logout", (req, res) => {
  req.logout();
  res.json({ message: "Logging out" });
});

module.exports = router;
