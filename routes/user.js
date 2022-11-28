
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/api/users', userController.getAllUsers);
router.put('/api/user', userController.addUser);
router.post('/api/user/:id', userController.updateUser);
router.post('/api/is-username-exist', userController.isUserNameExists);
router.get('/api/user/:id', userController.fetchUserById);
router.post('/api/forgot-password', userController.forgotPassword);
router.post('/api/reset-password', userController.resetPassword);
router.post('/api/login', userController.loginAuth);

module.exports = router