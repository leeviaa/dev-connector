const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../../src/models/User');

//@route     POST api/users
//@descr     Register user
//@access    Public
router.post(
  '/',
  [
    check('name', 'Name is a required field.').not().isEmpty(),
    check('email', 'Please enter a valid email.').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password, age } = req.body;

    try {
      // try and find user based on email provided
      let user = await User.findOne({ email });
      //See if user already exits, if so send error msg
      if (user) {
        return res.status(400).json({
          errors: [
            { msg: 'User already exists, please try a different email' },
          ],
        });
      }
      // If user doesnt exist, continue...

      //Get users gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });
      //create instance of user based on model
      user = new User({
        name,
        email,
        avatar,
        password,
        age,
      });
      //encrypt password with bcrypt
      user.password = await bcrypt.hash(password, 10);
      // save user
      await user.save();
      //get payload from jwt
      const payload = {
        user: {
          id: user.id,
        },
      };

      // verify
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
