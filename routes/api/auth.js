const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

//@route     GET api/auth
//@descr     Test route
//@access    Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (e) {}
});

//@route POST api/auth
//@descript Authenticate user and get token
//@access PUBLIC
router.post(
  '/',
  [
    check('email', 'Please enter a valid email.').isEmail(),
    check('password', 'Password is requireds').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
      // try and find user based on email provided
      let user = await User.findOne({ email });
      //See if user  exits, if not send error msg
      if (!user) {
        return res.status(400).json({
          errors: [{ msg: 'Invalid Credentials' }],
        });
      }
      // If user exist, continue...
      const isMatch = await bcrypt.compare(password, user.password);
      // if no match throw error
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }
      //CREATE PAYLOAD
      const payload = {
        user: {
          id: user.id,
        },
      };

      // sign the token
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 36000 },
        (err, token) => {
          if (err) {
            throw new Error(err);
          }
          res.send({ token });
        }
      );

      //return JWT
    } catch (e) {
      console.error(e.message);
      res.status(500).send(e.message);
    }
  }
);

module.exports = router;
