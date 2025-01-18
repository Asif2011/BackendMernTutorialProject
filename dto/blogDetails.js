class BlogDetailsDto{
    constructor(blog){
        this.author =  blog.author
        this.title = blog.title
        this.content = blog.content
        this.createdAt = blog.createdAt
        this._id = blog._id
        this.authorName = blog.author.name
        this.photo = blog.photo
        this.authorUsername = blog.author.username

    }
}

module.exports = BlogDetailsDto