const mongoose = require('mongoose');

/**
 * Comment Schema
 * Represents comments on tokens
 */
const commentSchema = new mongoose.Schema(
  {
    // Token being commented on
    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      required: true,
      index: true,
    },
    mintAddress: {
      type: String,
      required: true,
      index: true,
    },
    // User making the comment
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userWallet: {
      type: String,
      required: true,
    },
    // Comment content
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    // Reply to another comment
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    // Reply count
    replyCount: {
      type: Number,
      default: 0,
    },
    // Engagement
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Image attachment (optional)
    image: {
      type: String,
      default: null,
    },
    // Moderation
    isHidden: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // Flag for inappropriate content
    flags: {
      type: Number,
      default: 0,
    },
    flaggedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reason: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret.likedBy;
        delete ret.flaggedBy;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
commentSchema.index({ createdAt: -1 });
commentSchema.index({ token: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: -1 });
commentSchema.index({ likes: -1 });

// Virtual for formatted timestamp
commentSchema.virtual('formattedTime').get(function () {
  return this.createdAt.toISOString();
});

// Methods
commentSchema.methods.like = async function (userId) {
  const userIdStr = userId.toString();
  const alreadyLiked = this.likedBy.some((id) => id.toString() === userIdStr);

  if (alreadyLiked) {
    // Unlike
    this.likedBy = this.likedBy.filter((id) => id.toString() !== userIdStr);
    this.likes = Math.max(0, this.likes - 1);
  } else {
    // Like
    this.likedBy.push(userId);
    this.likes += 1;
  }

  return this.save();
};

commentSchema.methods.isLikedBy = function (userId) {
  return this.likedBy.some((id) => id.toString() === userId.toString());
};

commentSchema.methods.flag = async function (userId, reason) {
  const userIdStr = userId.toString();
  const alreadyFlagged = this.flaggedBy.some(
    (f) => f.user.toString() === userIdStr
  );

  if (!alreadyFlagged) {
    this.flaggedBy.push({
      user: userId,
      reason,
      createdAt: new Date(),
    });
    this.flags += 1;

    // Auto-hide if too many flags
    if (this.flags >= 5) {
      this.isHidden = true;
    }
  }

  return this.save();
};

commentSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = '[Comment deleted]';
  return this.save();
};

commentSchema.methods.incrementReplyCount = async function () {
  this.replyCount += 1;
  return this.save();
};

// Static methods
commentSchema.statics.getByToken = function (tokenId, limit = 50, skip = 0) {
  return this.find({
    token: tokenId,
    parentComment: null,
    isDeleted: false,
    isHidden: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'walletAddress username avatar');
};

commentSchema.statics.getByMintAddress = function (mintAddress, limit = 50, skip = 0) {
  return this.find({
    mintAddress,
    parentComment: null,
    isDeleted: false,
    isHidden: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'walletAddress username avatar');
};

commentSchema.statics.getReplies = function (parentCommentId, limit = 20, skip = 0) {
  return this.find({
    parentComment: parentCommentId,
    isDeleted: false,
    isHidden: false,
  })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'walletAddress username avatar');
};

commentSchema.statics.getByUser = function (userId, limit = 50, skip = 0) {
  return this.find({
    user: userId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('token', 'name symbol image mintAddress');
};

commentSchema.statics.getTopComments = function (tokenId, limit = 10) {
  return this.find({
    token: tokenId,
    parentComment: null,
    isDeleted: false,
    isHidden: false,
  })
    .sort({ likes: -1 })
    .limit(limit)
    .populate('user', 'walletAddress username avatar');
};

commentSchema.statics.getCommentCount = async function (tokenId) {
  return this.countDocuments({
    token: tokenId,
    isDeleted: false,
    isHidden: false,
  });
};

commentSchema.statics.getRecentComments = function (limit = 20) {
  return this.find({
    parentComment: null,
    isDeleted: false,
    isHidden: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'walletAddress username avatar')
    .populate('token', 'name symbol image mintAddress');
};

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
