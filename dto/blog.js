class BlogDto{
    constructor(blog){
        this.author = blog.auther,
        this.title = blog.title,
        this.id = blog._id,
        this.photo= blog.photo
        this.content=blog.content
    }
}

module.exports = BlogDto