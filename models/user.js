const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

let userSchema = new mongoose.Schema({
  username: String,
  password: { type: String, select: false },
  avatar: String,
  avatarId: String,
  age:String,
  name: String,
  bio: String,
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  bookmarks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post"
    }
  ]
});

userSchema.methods = {
  checkPassword: function(inputPassword) {
    return bcrypt.compareSync(inputPassword, this.password);
  },
  hashPassword: plainTextPassword => {
    return bcrypt.hashSync(plainTextPassword, 10);
  }
};

userSchema.pre("save", function(next) {
  if (!this.password) {
    
    next();
  } else {
    this.password = this.hashPassword(this.password);
    next();
  }
});

module.exports = mongoose.model("User", userSchema);
