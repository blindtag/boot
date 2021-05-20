const express = require('express');
const router = express.Router();
const Post = require('../../models/Post');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const auth = require('../../middleware/auth');
const {check, validationResult} = require('express-validator');


//Post private api/posts
router.post('/',[auth, [
    check('text', 'Text must be included').not().isEmpty()
]],  async(req, res)=>{
const errors = validationResult(req);
if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()});
}
try {
    const user = await User.findById(req.user.id).select('-password');
    const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
    })
    const post = await newPost.save();
    res.json(post);

} catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
}
});

//Get private api/posts
router.get('/', auth, async(req, res)=>{
    try {
        const posts = await Post.find().sort({date: -1});
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

//Get private api/posts/:id
router.get('/', auth, async(req, res)=>{
    try {
        const post = await Post.findById(req.params.id);
        if(!post){
            res.status(404).json({msg: 'Post not found'});
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            res.status(404).json({msg: 'Post not found'});
        }
        res.status(500).send('Server Error');
    }
})

//Delete private api/posts/:id
router.delete('/:id', auth, async(req, res)=>{
    try {
        const post = await Post.findById(req.params.id);
        if(!post){
            res.status(404).json({msg: 'Post not found'});
        }
        //check if user owns post
        if(post.user.toString() !== req.user.id ){
            return res.status(401).json({msg: 'User not authorized'});
        }
        await post.remove();
        res.json({msg: 'Post removed'});
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId'){
            res.status(404).json({msg: 'Post not found'});
        }
        res.status(500).send('Server Error');
    }
});

//Put private api/posts/like/:id
router.put('/like/:id', auth, async(req, res)=>{
    try {
        const post = await Post.findById(req.params.id);

        //if user has already liked the post
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
            return res.status(400).json({msg: 'Post already liked'});
        }

        post.likes.unshift({user: req.user.id});
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

//Put private api/posts/like/:id
router.put('/unlike/:id', auth, async(req, res)=>{
    try {
        const post = await Post.findById(req.params.id);

        //if post is liked
        if(post.likes.filter(like => like.user.toString() === req.user.id).length = 0){
            return res.status(400).json({msg: 'Post has not yet been liked'});
        }

        //Get remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

//Post private api/posts/comment/:id
router.post('/comment/:id', [auth,[
    check('text', 'Text is required').not().isEmpty()
]], async(req, res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    try {
         const user = await User.findById(req.user.id).select('-password');
         const post = await Post.findById(req.params.id);
        
         const newComment ={
             text: req.body.text,
             name: user.name,
             avatar: user.avatar,
             user: req.user.id
         }        

         post.comments.unshift(newComment);
         post.save();
         res.json(post.comments);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
 
});
//Delete private api/posts/comment/:id/:comment_id
router.delete('/comment/:id/:comment_id', auth, async(req, res)=>{
   
    try {
        const post = await Post.findById(req.params.id);
        const comment = post.comments.find(comment => comment.id ===  req.params.comment_id);

        //Check user
        if(comment.user.toString() !== req.user.id){
            return res.status(401).json({msg: 'User not authorized'});
        }
        //Get remove index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.params.id)
        post.comments.splice(removeIndex, 1);
         post.save();
         res.json(post.comments);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
 
});

module.exports = router;