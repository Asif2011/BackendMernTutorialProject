const jwt = require('jsonwebtoken')
const { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET } = require('../config/settings')
const RefreshToken = require('../models/tokens')

class JWTService {
    // sign access token
    static signAccessToken(payload, expiryTime) {
        return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: expiryTime })
    }

    // sign refresh token
    static signRefreshToken(payload, expiryTime) {
        return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: expiryTime })
    }

    // verify access token
    static verifyAccessToken(token) {
        return jwt.verify(token, ACCESS_TOKEN_SECRET)
    }

    // verify refresh token
    static verifyRefreshToken(token) {
        return jwt.verify(token, REFRESH_TOKEN_SECRET)
    }

    // store refresh token
    static async storeRefreshToken(token, userId) {
        const newToken = new RefreshToken(
            {
                token: token,
                userId: userId
            }
        )
        try {
            // store in db
            await newToken.save()

        }
        catch (error) {
            console.log(error)
        }
    }

}

module.exports = JWTService