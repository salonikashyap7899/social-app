import mongoose from 'mongoose';

/**
 * Likes and comments are embedded sub-documents rather than their own
 * collections, so the whole app fits in exactly two collections: users + posts.
 * The username is denormalised onto each like/comment so the feed can render
 * "liked by X" without a second query.
 */
const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    avatar: { type: String, default: '' },
    text: {
      type: String,
      required: [true, 'Comment cannot be empty'],
      trim: true,
      maxlength: [500, 'Comment must be at most 500 characters'],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/** Collection 2 of 2: posts */
const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Denormalised author details - a feed page then needs zero joins.
    authorUsername: { type: String, required: true },
    authorAvatar: { type: String, default: '' },

    // Either text or image is enough; the route validates "at least one".
    text: { type: String, trim: true, maxlength: [1000, 'Post must be at most 1000 characters'], default: '' },
    image: { type: String, default: '' }, // data URL, compressed client-side

    likes: { type: [likeSchema], default: [] },
    comments: { type: [commentSchema], default: [] },

    // Kept in sync on every like/comment so the feed never counts arrays at read time.
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Feed is newest-first; _id breaks ties so cursor pagination is stable.
postSchema.index({ createdAt: -1, _id: -1 });

export default mongoose.model('Post', postSchema);
