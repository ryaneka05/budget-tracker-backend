const express = require('express');
const router = express.Router();

const userRoutes = require('./modules/user/user.route');

 router.use('/users', userRoutes);

 router.use((req, res) => {
    throw new NotFound("Route Tidak Ditemukan!")
 })
 
 module.exports = router;