import { Router } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

const MAX_IMAGE_CHARS = 3000000; // ~2.2 MB of binary once base64 is decoded
const PAGE_SIZE_DEFAULT = 10;
const PAGE_SIZE_MAX = 30;
const COMMENT_PREVIEW = 2; // newest N comments shipped with each feed item

/** Cursor = base64("<createdAt ISO>|<_id>"), so paging is stable as new posts arrive. */
function encodeCursor(post) {
  return Buffer.from(`${post.createdAt.toISOString()}|${post._id}`).toString('base64url');
}

function decodeCursor(cursor) {
  try {
    const [iso, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    const createdAt = new Date(iso);
    if (Number.isNaN(createdAt.getTime()) || !mongoose.isValidObjectId(id)) return null;
    return { createdAt, id: new mongoose.Types.ObjectId(id) };
  } catch {
    return null;
  }
}

/**
 * Feed projection. Full like/comment arrays stay on the server - the client only
 * needs the counts, a few names, and whether *this* viewer already liked the post.
 */
function feedProjection(viewerId) {
  return {
    author: 1,
    authorUsername: 1,
    authorAvatar: 1,
    text: 1,
    image: 1,
    likesCount: 1,
    commentsCount: 1,
    createdAt: 1,
    likedByMe: viewerId ? { $in: [viewerId, '$likes.user'] } : { $literal: false },
    likePreview: { $slice: ['$likes.username', 3] },
    comments: { $slice: ['$comments', -COMMENT_PREVIEW] },
  };
}

/**
 * GET /api/posts?cursor=&limit=
 * Public, newest-first feed with cursor (keyset) pagination - no skip(), so page
 * 50 costs the same as page 1.
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX);
    const viewerId = req.user?._id ?? null;

    const match = {};
    if (req.query.author) {
      if (!mongoose.isValidObjectId(req.query.author)) {
        return res.status(400).json({ message: 'Invalid author id' });
      }
      match.author = new mongoose.Types.ObjectId(req.query.author);
    }
    if (req.query.cursor) {
      const cursor = decodeCursor(req.query.cursor);
      if (!cursor) return res.status(400).json({ message: 'Invalid cursor' });
      // Strictly "older than the cursor", with _id breaking same-millisecond ties.
      match.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    }

    // Fetch one extra row to learn whether another page exists.
    const rows = await Post.aggregate([
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: limit + 1 },
      { $project: feedProjection(viewerId) },
    ]);

    const hasMore = rows.length > limit;
    const posts = hasMore ? rows.slice(0, limit) : rows;

    res.json({
      posts,
      nextCursor: hasMore ? encodeCursor(posts[posts.length - 1]) : null,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/posts - create a post. Text or image is enough; neither alone is required. */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const text = (req.body.text || '').trim();
    const image = req.body.image || '';

    if (!text && !image) {
      return res.status(400).json({ message: 'Add some text or an image to post' });
    }
    if (image && !/^data:image\/(png|jpe?g|gif|webp);base64,/.test(image)) {
      return res.status(400).json({ message: 'Unsupported image format' });
    }
    if (image.length > MAX_IMAGE_CHARS) {
      return res.status(413).json({ message: 'Image is too large (max ~2MB)' });
    }

    const post = await Post.create({
      author: req.user._id,
      authorUsername: req.user.username,
      authorAvatar: req.user.avatar,
      text,
      image,
    });

    // Return the same shape the feed uses so the client can prepend it directly.
    res.status(201).json({
      post: {
        _id: post._id,
        author: post.author,
        authorUsername: post.authorUsername,
        authorAvatar: post.authorAvatar,
        text: post.text,
        image: post.image,
        likesCount: 0,
        commentsCount: 0,
        createdAt: post.createdAt,
        likedByMe: false,
        likePreview: [],
        comments: [],
      },
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/posts/:id/likes - the full list of usernames who liked a post. */
router.get('/:id/likes', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).select('likes').lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ likes: post.likes });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/posts/:id/like - toggle this user's like.
 * Both branches are a single atomic update, so concurrent likes cannot drift
 * the counter away from the array.
 */
router.post('/:id/like', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Add the like only if this user is not already in the array.
    const added = await Post.findOneAndUpdate(
      { _id: id, 'likes.user': { $ne: userId } },
      {
        $push: { likes: { user: userId, username: req.user.username } },
        $inc: { likesCount: 1 },
      },
      { new: true, projection: 'likesCount likes.username' }
    ).lean();

    if (added) {
      return res.json({
        liked: true,
        likesCount: added.likesCount,
        likePreview: added.likes.slice(0, 3).map((l) => l.username),
      });
    }

    // Already liked (or the post is gone) - remove it.
    const removed = await Post.findOneAndUpdate(
      { _id: id, 'likes.user': userId },
      { $pull: { likes: { user: userId } }, $inc: { likesCount: -1 } },
      { new: true, projection: 'likesCount likes.username' }
    ).lean();

    if (!removed) return res.status(404).json({ message: 'Post not found' });

    res.json({
      liked: false,
      likesCount: removed.likesCount,
      likePreview: removed.likes.slice(0, 3).map((l) => l.username),
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/posts/:id/comments - every comment on a post, oldest first. */
router.get('/:id/comments', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).select('comments').lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ comments: post.comments });
  } catch (err) {
    next(err);
  }
});

/** POST /api/posts/:id/comments - add a comment. */
router.post('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Comment cannot be empty' });
    if (text.length > 500) {
      return res.status(400).json({ message: 'Comment must be at most 500 characters' });
    }

    const comment = {
      user: req.user._id,
      username: req.user.username,
      avatar: req.user.avatar,
      text,
      createdAt: new Date(),
    };

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: comment }, $inc: { commentsCount: 1 } },
      { new: true, projection: 'commentsCount comments' }
    ).lean();

    if (!post) return res.status(404).json({ message: 'Post not found' });

    res.status(201).json({
      comment: post.comments[post.comments.length - 1],
      commentsCount: post.commentsCount,
    });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/posts/:id - authors can remove their own posts. */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).select('author');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
