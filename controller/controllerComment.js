const Joi = require('joi')
const Comment  = require('../models/comments')
const CommentDto = require('../dto/comment')

mongodbIdregex = /^[0-9a-fA-F]{24}$/

const controllerComment = {
    create : async (req, res, next)=>{
        // creat joi object
        const commentSchema = Joi.object({
            content:Joi.string().required(),
            blog:Joi.string().regex(mongodbIdregex).required(),
            author:Joi.string().regex(mongodbIdregex).required()
        }
        )
        try {
            const {error} = commentSchema.validate(req.body)
            if (error){
                return next(error)
            }
        } catch (error) {
            return next(error)
        }

        try {
            const {content,blog,author} = req.body
            const newComment = new Comment({content,blog,author})
            const comm = await newComment.save()
            const commId = comm._id
            const commentdb = await Comment.findOne({_id:commId}).populate({path:'author',model:'User'})
            const commentDto = new CommentDto(commentdb)
            return res.status(200).json({msg:'OK', comment:commentDto})
            
        } catch (error) {
            return next(error)
        }

    },

    getBlogComments: async(req,res,next)=>{
        
        const idSchema = Joi.object({
            id:Joi.string().regex(mongodbIdregex).required()
        })

        const {error} = idSchema.validate(req.params)
        if (error){
            next(error)
        }
        
        try {
            const blogId = req.params.id
            const blogComments = await Comment.find({blog:blogId})
            let commentList = []
            for (let comment of blogComments){
                commentList.push( new CommentDto(comment))
            }
            return res.status(200).json({msg:'fetched',comments:commentList})

        } catch (error) {
            return next(error)
        }
    }

}

module.exports = controllerComment