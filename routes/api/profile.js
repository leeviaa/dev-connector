const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Profile = require('../../src/models/Profile');
const User = require('../../src/models/User');

//@route     GET api/profile/me
//@access    Public
//@descr     GET current users profile
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);
    //if no profile, error
    if (!profile) {
      return res.status(400).json({ msg: 'Cannot find profile for this user' });
    }
    // if there is a profile, send it back
    res.json(profile);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server error');
  }
});

//@route     POST api/profile
//@access    Private
//@descr     POST new profile
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required.').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //extract fields
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedIn,
    } = req.body;
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills)
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    //Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedIn) profileFields.social.linkedIn = linkedIn;

    try {
      //look for profile
      let profile = await Profile.findOne({ user: req.user.id });
      //if found, update whatever has been updated from profileFields
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          //getting req.user.id from auth middleware
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        //then return the updated profile
        return res.json(profile);
      }

      //Create profile if not already there
      profile = new Profile(profileFields);
      //await save
      await profile.save();
      //send response of profile
      res.json(profile);
    } catch (e) {
      console.error(e.message);
      res.status(500).send('Server Error');
    }

    console.log(profileFields.social.youtube);

    res.send('Hello');
  }
);

//@route     GET api/profile
//@access    Public
//@descr     GET ALL users profile
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.send(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route     POST api/profile/user/:user_id
//@access    Public
//@descr     GET profile by user ID
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(404).json({ msg: 'No profile found' });
    }

    res.send(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'No profile found' });
    }
    res.status(500).send('Server Error');
  }
});

//@route     DELETE api/profile
//@access    Private
//@descr     Delete profile, user and posts
router.delete('/', auth, async (req, res) => {
  try {
    //@todo = remove users posts

    //remove profile
    await Profile.findOneAndRemove({
      user: req.user.id,
    });
    //remove user
    await User.findOneAndRemove({
      _id: req.user.id,
    });

    res.json('User deleted');
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'No profile found' });
    }
    res.status(500).send('Server Error');
  }
});

//@route PUT api/profile/experience
//@desc  add profile experience
//@access Private

router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'title is required').not().isEmpty(),
      check('company', 'Company is required'),
      check('from', 'From date is required'),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title: title,
      company: company,
      location: location,
      from: from,
      to: to,
      current: current,
      description: description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

//@route DELETE api/profile/experience/:exp_id
//@desc  delete profile experience
//@access Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    //ger profile of logged in user
    const profile = await Profile.findOne({ user: req.user.id });
    //get  index of experience to remove
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);
    //splice out experience
    profile.experience.splice(removeIndex, 1);
    //save profile
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

//@route PUT api/profile/education
//@desc  add profile education
//@access Private

router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'degree is required'),
      check('from', 'From date is required'),
      check('field of study', 'Field of study is required'),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from: from,
      to: to,
      current: current,
      description: description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

//@route DELETE api/profile/education/:edu_id
//@desc  delete profile education
//@access Private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    //ger profile of logged in user
    const profile = await Profile.findOne({ user: req.user.id });
    //get  index of education to remove
    profile.education = profile.education.filter((edu) => {
      return edu._id.toString() !== req.params.edu_id;
    });
    //save profile
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
