const JWTService = require('../services/JWTService')
const Users = require('../models/users')
const UserDTO = require('../dto/user')


auth = async (req, res, next) => {

    // get the tokens from request
    const { accessToken, refreshToken } = req.cookies
    // check for exist or not
    if (!accessToken || !refreshToken) {
        error = {
            status: 401,
            message: 'unauthorized access denied'
        }
        return next(error)
    }
    
    let payload

    try {
        // _id = JWTService.verifyAccessToken(accessToken)._id
        // _id = JWTService.verifyRefreshToken(refreshToken)._id
        payload = JWTService.verifyAccessToken(accessToken)
        const user_id = payload._id
        const user = await Users.findOne({ _id:user_id})
        const currentUserDTO = new UserDTO(user)
        req.user = currentUserDTO
        next()

    }
    catch (error) {
        return next(error)
    }

}

module.exports = auth