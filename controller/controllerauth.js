const Joi = require('joi')
const User = require('../models/users')
const bcrypt = require('bcryptjs')
const UserDto = require('../dto/user')
const JWTService = require('../services/JWTService')
const RefreshToken = require("../models/tokens")

// passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/ //pattern for simple password
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[A-Za-z\d@.#$!%*?&]{8,15}$/

const authcontroller = {
    register: async (req, res, next) => {
        // 1. validate user input
        // make joi object having schema to validate the input data in body of request
        const register_schema = Joi.object({
            name: Joi.string().max(30).min(3).required(),
            username: Joi.string().max(25).min(2).required(),
            email: Joi.string().email().required(),
            password: Joi.string().pattern(passwordPattern).required(),
            confirmPassword: Joi.ref("password")
        }
        )
        // 2. if error in validation then return error via middleware
        const { error } = register_schema.validate(req.body)
        if (error) {
            return next(error)
        }

        // 3. if email or username is already exist then return error
        const { username, name, email, password } = req.body

        try {
            const emailExist = await User.exists({ email })
            const usernameExist = await User.exists({ username })
            if (emailExist) {
                let error = {
                    status: 409, // status code for conflict
                    message: "Email alrready exists"
                }

                return next(error)
            }

            if (usernameExist) {
                let error = {
                    status: 409, // status code for conflict
                    message: "sername already exists"
                }
                return next(error)
            }

        } catch (error) {
            return next(error)
        }

        // 4. if password hash
        const hashedPassword = await bcrypt.hash(password, 10)

        // suppose password is abc123 -> to hash using function and import bcryptjs 


        // 5. store username and password in db
        let accessToken
        let refreshToken
        let user
        try {
            // make a user object
            const userToRegister = new User({
                name,
                username,
                email,
                'password': hashedPassword
            });

            // now save into database
            user = await userToRegister.save();

            // tokens generation
            accessToken = JWTService.signAccessToken({ _id: user._id }, '10s') // best practice is to use min. core values in payload
            refreshToken = JWTService.signRefreshToken({ _id: user._id, }, '60m')

            // store refresh token
            JWTService.storeRefreshToken(refreshToken, user._id)
        }
        catch (error) {
            return next(error)
        }


        // send tokens in cookies towards client
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24 * 7, //milliseconds for 7 days
            httpOnly: true, // set true to secure from XSS attacks
            sameSite: 'None',
            secure: true

        })

        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
            sameSite: 'None',
            secure: true
        })

        // 6. send response
        const userDto = new UserDto(user)
        return res.status(201).json({ user: userDto, auth: true })

    },


    login: async (req, res, next) => {
        // 1. validation user input
        // 2.if validation error then retrun error
        // 3. match username and password
        // 4. return response of data or error

        const userLoginSchema = Joi.object({
            username: Joi.string().min(2).max(30).required(),
            password: Joi.string().pattern(passwordPattern),
        })

        const { error } = userLoginSchema.validate(req.body)

        if (error) {
            return next(error)
        }

        const { username, password } = req.body
        let user;
        let accessToken
        let refreshToken
        try {
            // match username
            user = await User.findOne({ username })

            if (!user) {
                const error = {
                    status: 401,
                    message: 'invalid username'
                }
                return next(error)
            }

            // match password
            const match = bcrypt.compare(password, user.password)
            if (!match) {
                const error = {
                    status: 401,
                    message: 'invalid password'
                }
                return next(error)
            }

            // token generate
            accessToken = JWTService.signAccessToken({ _id: user._id }, '10s')
            refreshToken = JWTService.signRefreshToken({ _id: user._id }, '60m')

            // refresh token update in database
            const RefreshToken = require('../models/tokens')
            await RefreshToken.updateOne(
                { userId: user._id },
                { token: refreshToken },
                { upsert: true } // option to tell database that if value not found then save or update
            )
            console.log(`refresh token [${refreshToken} is updated.]`)

        }
        catch (error) {
            return next(error)
        }

        // send token in cookies response object


        res.cookie('accessToken', accessToken,
            {
                maxAge: 1000 * 60 * 60 * 24 * 7, //milliseconds for 7 days
                httpOnly: true,
                sameSite: 'None',
                secure: true
            }
        )

        res.cookie('refreshToken', refreshToken,
            {
                maxAge: 1000 * 60 * 60 * 24 * 7, //milliseconds for 7 days
                httpOnly: true,
                sameSite: 'None',
                secure: true
            }
        )
        const userDto = new UserDto(user)
        return res.status(200).json({ user: userDto, auth: true })
    },

    logout: async (req, res, next) => {
        // delet refresh token
        const { refreshToken } = req.cookies
        console.log(`token is ${refreshToken} to delete`)

        try {
            await RefreshToken.deleteOne({ token: refreshToken })
            console.log('refresh token deleted')
        } catch (error) {
            console.error(`Error deleting refresh token: ${error}`)
            // You can also add additional error handling logic here
            return next(error)
        }

        // clear cookies
        res.clearCookie('accessToken')
        res.clearCookie('refreshToken')

        // send response
        return res.status(200).json({ user: null, auth: false })
    },


    refresh: async (req, res, next) => {
        let _id, user, cookieRefreshToken
        try {

            cookieRefreshToken = req.cookies.refreshToken
            _id = JWTService.verifyRefreshToken(token = cookieRefreshToken)._id
            console.log(`refreshs on server called`)
        } catch (error) {
            error = {
                status: 401,
                message: `error: ${error} so unauthorized`
            }
            console.log(`401 error token is not valid`)
            return next(error)
        }


        try {
            const match = await RefreshToken.findOne({ userId: _id, token: cookieRefreshToken },)
            if (!match) {
                error = {
                    status: 401,
                    message: 'unauthorized'
                }
                console.log(`refresh token not matched`)
                return next(error)
            }
            console.log(`refresh token matched`)
        } catch (error) {
            console.log(`401 error not in DB`)
            return next(error)
        }
        let accessToken
        let refreshToken

        try {
            accessToken = JWTService.signAccessToken({ _id: _id }, '10s')
            refreshToken = JWTService.signRefreshToken({ _id: _id }, '60m')

            await RefreshToken.updateOne(
                { userId: _id },
                { token: refreshToken },
                { upsert: true } // option to tell database that if value not found then save or update
            )
            console.log(`refresh token [${refreshToken}] updated`)
        } catch (error) {
            console.log(`401 error while updatin refresh token`)
            return next(error)
        }


        // add to cookies
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
            sameSite: 'None',
            secure:true
        })

        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
            sameSite: 'None',
            secure:true
        })

        let userDto
        try {
            user = await User.findOne({ _id: _id },)
            userDto = new UserDto(user)
        } catch (error) {
            return next(error)
        }

        return res.status(200).json({ user: userDto, auth: true })

    }


}


module.exports = authcontroller