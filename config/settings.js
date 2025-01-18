const dotenv = require('dotenv').config()

PORT = process.env.PORT

mongo_db_string = process.env.mongo_db_conn_string

ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET

REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET

BACKEND_STORAGE_PATH = process.env.BACKEND_STORAGE_PATH

cloud_name=process.env.cloud_name

api_key=process.env.api_key

api_secret=process.env.api_secret

CLOUDINARY_URL=process.env.CLOUDINARY_URL


module.exports = {PORT,mongo_db_string,
        ACCESS_TOKEN_SECRET,
        REFRESH_TOKEN_SECRET,
        BACKEND_STORAGE_PATH,
        cloud_name,
        api_key,
        api_secret,
        CLOUDINARY_URL
    }

