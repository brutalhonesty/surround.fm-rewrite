'use strict';

var express = require('express');
var getUsers = require('./getUsers.controller');
var getUser = require('./getUser.controller');

var router = express.Router();

router.get('/', getUsers.index);
router.get('/:username', getUser.index);

module.exports = router;