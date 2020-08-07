const express = require('express');
const router = express.Router();

//@route     GET api/users
//@descr     Test route
//@access    Public
router.get('/', async (req, res) => {
  res.send('Post Router...');
});

module.exports = router;
