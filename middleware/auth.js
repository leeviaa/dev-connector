const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  //Get token from header on request obj
  const token = req.header('x-auth-token');
  //if no token, send 401 code
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  //verify token if there is one
  try {
    //decode token
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    // assign value to user
    req.user = decoded.user;
    next();
  } catch (e) {
    res.status(401).json({ msg: 'Invalid token. Please try again' });
  }
};
