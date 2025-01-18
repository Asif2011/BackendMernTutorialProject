class CommentDto
{
    constructor(comment){
        this._id = comment._id
        this.createdAt = comment.createdAt
        this.username = comment.author.username
        this.blog = comment.blog
        this.content = comment.content
    }
}

module.exports = CommentDto