const express = require("express")
const path = require("path")
const http = require("http")
const socketio = require("socket.io")
const Filter = require("bad-words")
const {generateMessage, generateLocationMessage} = require("./utils/messages")
const {addUser, getUser, removeUser, getUsersInRoom} = require("./utils/users")
const { Console } = require("console")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT||3000
const publicDirPath = path.join(__dirname, "../public")

app.use(express.static(publicDirPath))

// let count = 0

io.on("connection", (socket) => {
  
    // socket.broadcast.emit("messageSent", generateMessage("A new user has joined")) // // Emits to everyone but the user from the socket

    socket.on("join", (options, callback) => {

        const {error, user } = addUser({id: socket.id, ...options})    // socket has inbuilt id

        if(error){
            return callback(error)
        }

        socket.emit("welcome") //emits event to specific connection

        socket.broadcast.to(user.room).emit("message", generateMessage(user.username, `${user.username} has joined`)) // Emits to everyone in a specific room but the user from the socket
    
        socket.join(user.room)

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on("sendMessage", (msg, callback) => {
        const filter = new Filter()
        const user = getUser(socket.id)

        if(filter.isProfane(msg)){
            return callback('Profanity is not allowed')
        }

        if(user){
            io.to(user.room).emit("messageSent", generateMessage(user.username,msg)) //emits event to all connections     
        }

        callback()
    })

    socket.on("sendLocation", (coords, callback) => {
        const user = getUser(socket.id)   

        if(user){
            io.to(user.room).emit("locationSent", generateLocationMessage(user.username, coords))
        }
        callback()
    })

    socket.on("disconnect", () =>{
        const user = getUser(socket.id)
        if(user){
            io.to(user.room).emit("message", generateMessage(user.username, `${user.username} has left`))
            io.to(user.room).emit("roomData", {
                room : user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })
})

server.listen(port, ()=>{                           //ensure you're listening on server not app
    console.log("Listening on port ", port)
})