const express = require("express")
const bcrypt = require("bcrypt")
const jwt  = require("jsonwebtoken")
const User = require("../schemas/userSchema")
const router = express.Router()


router.post("/signup", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const userExists = await User.findOne({email: req.body.email})
        if(userExists) return res.status(409).json({msg: "User allready exists, log in"})
        await User.create({
            email: req.body.email,
            password: hashedPassword,
            habits: []
        })
        res.status(201).json({msg: "User succefully created"})
    }catch (err){
        console.log(err)
        res.status(500).json({msg: "ERROR in creating user"})
    }
})

router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({email: req.body.email})
        if(user === null) return res.status(404).json({msg: "invalid email"})
        
        if(await bcrypt.compare(req.body.password, user.password)){
            const tokenPayload = {email: user.email}
            const accessToken = generateAccessToken(tokenPayload)
            const refreshToken = jwt.sign(tokenPayload, process.env.REFRESH_TOKEN_SECRET)
            res.status(201).json({accessToken: accessToken, refreshToken: refreshToken})
        }else{
            res.status(401).json({msg: "Wrong Password"})
        }
        
    }catch(err){
        console.log(err)
        res.status(500).json({msg: err.msg}) 
    }
})

router.post("/token", async (req, res) => {
    const refreshToken = req.body.refreshToken
    if(refreshToken === null) return res.status(400).json({msg: "refreshToken not Specified"})
    
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, tokenPayload) => {
        if(err) return res.sendStatus(403)
        const accessToken = generateAccessToken({email: tokenPayload.email})
        res.status(200).json({accessToken: accessToken})
    })
})

function generateAccessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "10m"})
}

module.exports = router