const Joi = require('joi')
const Blog = require('../models/blogs')
const Comment = require('../models/comments')
const { BACKEND_STORAGE_PATH, api_key, cloud_name, api_secret } = require('../config/settings')
const { response } = require('express')
const BlogDTO = require('../dto/blog')
const path = require('path')
const fs = require('fs')
const BlogDetailsDto = require('../dto/blogDetails')
const { v2: cloudinary } = require('cloudinary');


mongodbIdregex = /^[0-9a-fA-F]{24}$/

const blogSchema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required(),
    photo: Joi.string().required(),
    author: Joi.string().regex(mongodbIdregex).required()
})

// Configuration
cloudinary.config({
    cloud_name: cloud_name,
    api_key: api_key,
    api_secret: api_secret
});


const blogController = {
    async create(req, res, next) {
        try {
            const { error } = blogSchema.validate(req.body)
            if (error) {
                console.log(`error in validate ${error}`)
                return next(error)
                // return res.status(400).json({ message: error.details[0].message })
            }
        } catch (error) {
            console.log(`exception in validate ${error}`)
            return next(error)
        }

        const { title, content, photo, author } = req.body

        // conversion photo string into raw binary data
        // const photo_buffer = Buffer.from(photo.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64')


        // // saving locally

        // const currentTimestamp = new Date().getTime()
        // // const photoPath = path.join(__dirname, '../storage', `images/${author}_${currentTimestamp}.jpg`)
        // const photoPath = `storage/images/new_${author}_${currentTimestamp}.png`
        // try {
        //     fs.writeFileSync(photoPath, photo_buffer)
        // } catch (error) {
        //     console.log(`error in local saving ${error}`)
        //     next(error)
        // }

        // Upload an image
        const uploadResult = await cloudinary.uploader.upload(
                photo
            )
            // .then(
            //     (result) => {console.log(`----> the result is ${result}<---`);}
            // )
            .catch((error) => {
                console.log(error);
            });

        console.log(`....> the uploadresult is ${uploadResult}<...`);
        console.dir(uploadResult);



        // saving in db with server link
        const newBlog = new Blog(
            {
                title,
                content,
                // photo: `${BACKEND_STORAGE_PATH}/${photoPath}`,
                photo: uploadResult.url,
                author
            })

        try {
            await newBlog.save()
        }
        catch (error) {
            console.log(`error in saving to database ${error}`)
            next(error)
        }

        //  return response with blog dto
        const blogDto = new BlogDTO(newBlog)
        return res.json({ blog: blogDto })

    },

    async getById(req, res, next) {
        // validate request id
        const idSchema = Joi.object({ id: Joi.string().regex(mongodbIdregex).required() })
        try {
            const { error } = idSchema.validate({ id: req.params.id })
            if (error) {
                console.log(`error in validate ${error}`)
                return next(error)
            }
        } catch (error) {
            return next(error)
        }

        const id = req.params.id
        const blog = await Blog.findOne({ _id: id }).populate({ path: 'author', model: 'User' })

        // const blogDto = new BlogDTO(blog)
        const blogdDetailsDto = new BlogDetailsDto(blog)
        return res.json({ blog: blogdDetailsDto })
    },


    async getAll(req, res, next) {
        try {
            console.log('blog try block called')
            const allBlogs = await Blog.find({})
            const blogsDto = []
            for (const blog of allBlogs) {
                const blogDto = new BlogDTO(blog)
                blogsDto.push(blogDto)
            }
            return res.json({ blogs: blogsDto, })
        } catch (error) {
            next(error)
        }
    },


    async update(req, res, next) {
        const blogSchema = Joi.object({
            title: Joi.string().required(),
            content: Joi.string().required(),
            photo: Joi.string().required(),
            author: Joi.string().regex(mongodbIdregex).required(),
            blogId: Joi.string().regex(mongodbIdregex).required()
        })

        try {
            const { error } = blogSchema.validate(req.body)
            if (error) {
                return next(error)
            }
        } catch (error) {
            console.log(error)
            return next(error)
        }

        try {

            const { blogId, title, content, photo, author } = req.body

            const blogDetails = await Blog.findOne({ _id: blogId })
            const dbPhotoPath = blogDetails.photo

            if (dbPhotoPath) {
                const deleteFile = (filePath) => {
                    try {
                        console.log(filePath)
                        fs.unlinkSync(filePath)
                        console.log(`file-->${filePath}<-- is deleted`)
                    } catch (error) {
                        console.log(`error in deleting file ${error}`)
                    }
                }
                const fileNameWithExtension = path.basename(dbPhotoPath)
                const filePath = path.join(__dirname, '../storage/images', fileNameWithExtension)
                // file locally delete 
                deleteFile(filePath)

                // conversion photo string into raw binary data
                const newPhotobuffer = Buffer.from(photo.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64')

                const currentTimestamp = new Date().getTime()
                const newPhotoPath = `storage/images/updated_${author}_${currentTimestamp}.png`
                try {
                    await fs.writeFileSync(newPhotoPath, newPhotobuffer)
                    await Blog.updateOne({ _id: blogId }, { title, content, photo: `${BACKEND_STORAGE_PATH}/${newPhotoPath}` })
                    return res.status(200).json({ msg: "blog updated", blogId: blogId, photo: newPhotoPath, photoName: newPhotoPath.split('/')[-1] })

                } catch (error) {
                    console.log(`error in local saving ${error}`)
                    next(error)
                }
            }
            else {
                await Blog.updateOne({ _id: blogId }, { title, content })
            }
            return res.status(200).json({ msg: "blog updated", blogId: blogId, })

        } catch (error) {
            next(error)
        }

    },


    async delete(req, res, next) {

        // validate request params
        // make joi object
        const idSchema = Joi.object({
            id: Joi.string().regex(mongodbIdregex).required()
        })
        try {
            const { error } = idSchema.validate(req.params)
            if (error) {
                return next(error)
            }
            const { id } = req.params
            await Blog.deleteOne({ _id: id })
            await Comment.deleteMany({ blog: id })

        } catch (error) {
            return next(error)
        }
        return res.json({ message: 'blog and its comments deleted' })
    }
}

module.exports = blogController