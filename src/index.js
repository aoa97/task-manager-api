require('./db/mongoose') // Connect to DB
const express = require('express')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT


app.use(express.json()) // Parse incoming request to JSON so we can access it in request handlers
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
    console.log("Server is up on port", port)
})
