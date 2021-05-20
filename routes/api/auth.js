const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const colors = require('colors');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');

//Get public api/auth
router.get('/', auth,  async (req, res)=>{
try {
  const user = await User.findOne(req.user.id).select('-password');
    res.json(user);
} catch (err) {
    console.error(err.message.red.bold.underline);
    res.status(500).json('Server Error')
}  
})

//Post private api/auth (authenticate user and get token)
//Use check to validate user data and validationResult to accept errors 
router.post('/', [
    check('email', 'Please enter a registered email').isEmail(),
    check('password', 'Password is required')
    .exists()
], async (req, res)=>{
 const errors = validationResult(req);
 //if errors exist
 if(!errors.isEmpty()){
     return res.status(400).json({errors : errors.array()});
 }
 const {name, email, password} = req.body;
 try {
    //Unique user
    let user = await User.findOne({email});
    if(!user){
       return res.status(400).json({errors: [{msg: 'Invalid Credentials'}]}.cyan.underline)
    }
    
    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch){
        return res.status(400).json({errors: [{msg: 'Invalid Credentials'}]}.cyan.underline)
    }
    const payload ={
        user:{
            id: user.id
        }
    }  
    jwt.sign(payload, config.get('jwtSecret'), 
    {expiresIn: 360000}, (err, token)=>{
        if(err) throw err;
         res.json({token});
    });//3600

 } catch (err) {
     console.error(err.message.red.bold);
     res.status(500).send('Server error')
 }

 
});

module.exports = router;