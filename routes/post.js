const Post = require("../models/post");
const Comment = require("../models/comment");
const User = require("../models/user");
const multer = require("multer");
const cloudinary = require("cloudinary");
const middleware = require("../middleware");
const express = require("express");
const router = express.Router();
const { checkPostOwnership } = middleware;

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



 
  router.get("/posts", (req, res) => {
    Post.find({})
      .sort({ timePosted: -1 })
      .populate("comments")
      .populate("likes")
      .then(posts => {
        const data = {
          posts: posts,
          user: req.user
        };
        res.json(data);
      })
      .catch(err => {
        res.json(err);
      });
  });

  // create new post
  router.post("/posts", upload.single("file"),function(req,res){
    var data = new User({
      nmae: req.body.name,
      age:req.body.age,
      avatar:req.file.filename,
      bio:req.body.bio
    });
    data.save(function (err, result) {
      if (err) {
        console.error(err);
        return res.status(400).json({
          message: 'Bad Request'
        });
      } else {
        res.json({
          status: 200,
          data: result
        })
      }
  
    });
  
  });
  

  
  router.get("/posts/:post_id", (req, res) => {
    Post.findOne({ _id: req.params.post_id })
      .populate("comments")
      .populate("likes")
      .then(post => {
        if (post) {
          res.json(post);
        } else {
          res.json({ error: "Sorry, that post doesn't exist." });
        }
      })
      .catch(err => {
        res.json({ error: "Sorry, that post doesn't exist." });
      });
  });

  
  

  
 
 

  
  router.post("/posts/:post_id/likes", (req, res) => {
    Post.findOne({ _id: req.params.post_id })
      .populate("comments")
      .populate("likes")
      .then(async post => {
        let user = await User.findOne({ _id: req.user._id });
        post.likes.push(req.user._id);
        post.save();
        const data = {
          postId: post._id,
          like: {
            _id: user._id,
            username: user.username,
            avatar: user.avatar
          }
        };
        res.json(data);
      })
      .catch(err => {
        res.json(err);
      });
  });

 
  router.delete("/posts/:post_id/likes/:like_id", (req, res) => {
    Post.findOneAndUpdate(
      { _id: req.params.post_id },
      {
        $pull: { likes: { $in: [req.params.like_id] } }
      }
    )
      .then(post => {
        res.json({ message: "Unliked!" });
      })
      .catch(err => {
        res.json(err);
      });
  });

  module.exports = router ;
