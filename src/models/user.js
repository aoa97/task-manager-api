const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: "user"
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid")
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes("password")) {
                throw Error('Password shouldn`t contain the word "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error("Age must be a positive number")
            }
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
})

// Virtual property => Rel between two models
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id', // Where the local data is stored (user id)
    foreignField: 'owner', // name of the field in the other model
})

// Methods => instances
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject() // to manipulate user
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token
}

// Statics => models
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) {
        throw new error("Unable to login")
    }
    console.log(user.password)
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new error("Unable to login")
    }
    return user
}

// Mongoose Middleware[pre/post] => Before Save
userSchema.pre('save', async function (next) {
    const user = this // Current user data
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next() // Go to save
})
// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})


const User = mongoose.model('User', userSchema)

module.exports = User