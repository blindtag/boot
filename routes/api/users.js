const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const User = require('../../models/User');
const colors = require('colors');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

//Post public api/users (register)
//Use check to validate user data and validationResult to accept errors 
router.post('/', [check('name', 'Please enter a name').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters')
    .isLength({min: 6})
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
    if(user){
        res.status(400).json({errors: [{msg: 'User already exists'}]}.cyan.underline)
    }
     
    //Get gravatar
    const avatar = gravatar.url(email, {
    s:'200',
    r: 'pg',
    d: 'mm'
    });

    user =new User({
    name, email, password, avatar
    });

    //Encrypt password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    //Return token and log user in after save
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