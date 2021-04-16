const User = require("../models/user");
const Post = require("../models/post");
const multer = require("multer");
const cloudinary = require("cloudinary");
const middleware = require("../middleware");
const express = require("express");
const router = express.Router();
const { checkProfileOwnership } = middleware;

const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

const imageFilter = function(req, file, cb) {
  
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: imageFilter
});



  
  router.get("/users/:user_id", (req, res) => {
    let newUser = {};
    User.findOne({ _id: req.params.user_id })
      .populate("followers")
      .populate("following")
      .populate("bookmarks")
      .then(user => {
        return (newUser = user);
      })
      .then(user => {
        return Post.find()
          .sort({ timePosted: -1 })
          .populate("comments")
          .populate("likes")
          .where("author.id")
          .equals(req.params.user_id);
      })
      .then(posts => {
        res.json({ posts: posts, user: newUser });
      })
      .catch(err => {
        res.json(err);
      });
  });

  // update user profile
    router.post("/users/:user_id/follow", (req, res) => {
    User.findOne({ _id: req.params.user_id })
      .then(async user => {
        let currentUser = await User.findOne({ _id: req.user._id });
        user.followers.push(req.user._id);
        user.save();
        currentUser.following.push(user._id);
        currentUser.save();
        const data = {
          _id: req.user._id,
          username: req.user.username,
          avatar: currentUser.avatar
        };
        res.json(data);
      })
      .catch(err => {
        res.json({ message: "Error occured" });
      });
  });

  
  router.delete("/users/:user_id/follow", (req, res) => {
    User.findOneAndUpdate(
      { _id: req.params.user_id },
      {
        $pull: { followers: { $in: req.user._id } }
      }
    )
      .then(user => {
        return User.findOneAndUpdate(
          { _id: req.user._id },
          {
            $pull: { following: { $in: [req.params.user_id] } }
          }
        );
      })
      .then(response => {
        return User.findOne({ _id: req.params.user_id })
          .populate("followers")
          .populate("following")
          .populate("posts");
      })
      .then(user => {
        res.json(user);
      })
      .catch(err => {
        res.json({ message: "Error occured" });
      });
  });

  
module.exports = router;
