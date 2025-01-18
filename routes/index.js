const express = require('express')
const controller = require('../controller/controllerauth')
const auth = require('../middlewares/auth')
const blogController = require('../controller/controllerBlog')
const commentController = require('../controller/controllerComment')
const controllerComment = require('../controller/controllerComment')

const router = express.Router()

// testing
router.get('',(req,res)=>res.json({msg : 'Hello World!'}))
// router.get('/',(req,res)=>res.json({msg : 'root working'}))
router.get('/test',(req,res)=>res.json({msg : 'working'}))
// user
// login
router.post('/login',controller.login)

// register
router.post('/register',controller.register)

// logout
router.post('/logout',auth, controller.logout)


// refresh
router.get('/refresh', controller.refresh)


// blog
router.post('/create',auth,blogController.create)
router.get('/blog/:id',auth,blogController.getById)
router.get('/allblogs',auth,blogController.getAll)
router.put('/update',auth,blogController.update)
router.delete('/delete/:id',auth,blogController.delete)

// crud
// read
// update
// read all blogs
// delete
// read blog

// comment
// create comment
router.post('/comment/create',auth,controllerComment.create)
router.get('/blogComments/:id',auth,controllerComment.getBlogComments)
// read
module.exports = router