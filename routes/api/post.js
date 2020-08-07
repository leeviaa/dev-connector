const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const Profile = require('../../src/models/Profile');
const auth = require('../../middleware/auth');

//@route     POST api/posts
//@descr     Create a post
//@access    Private
router.post(
  '/',
  [auth, [check('text', 'Text must be entered').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.Array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route     GET api/posts
//@descr     Read all posts
//@access    Public

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    if (!posts) {
      return res.status(404).json({ msg: 'Posts not found.' });
    }

    res.json(posts);
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Posts not found.' });
    }
    res.status(500).send('Server error');
  }
});

//@route     GET api/posts/:post_id
//@descr     Read single post by id
//@access    Private

router.get('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
});

//@route     DELETE api/posts/:post_id
//@descr     delete single post by id
//@access    Private

router.delete('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findByIdAndRemove(req.params.post_id);

    //Check user
    if (post.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: 'User not authorized to delete this post.' });
    }
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.json({ msg: 'Post removed successfully' });
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
});

//@route     PUT api/posts//like/:post_id
//@descr     Like a post by id
//@access    Private
router.put('/like/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    //check if post has been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'You have already liked this post' });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err);
    res.status(500).send('server error');
  }
});

//@route PUT api/posts/unlike/:post_id
//@descr unlike a post
//@access
router.put('/unlike/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    //check if post has been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res
        .status(400)
        .json({ msg: 'You have already unliked this post' });
    }
    //Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err);
    res.status(500).send('server error');
  }
});

//@route     Post api/posts/comment/:id
//@descr     Comment on a post
//@access    Private
router.post(
  '/comment/:id',
  [auth, [check('text', 'Text must be entered').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route     delete api/posts/comment/:id/:comment_id
//@descr     Delete comment
//@access    Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //Pull out comment from post
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    //Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }
    //Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'user not authorized' });
    }
    //If all is good so far, continue to delte

    // find index of comment
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);
    //splice from comment array
    post.comments.splice(removeIndex, 1);
    //save post
    await post.save();
    res.send(post.comments);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
module.exports = router;
