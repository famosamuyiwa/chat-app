const socket = io()

const form = document.querySelector("form")
const msg = document.querySelector("#msg")
const msgs = document.getElementById("messages")
const formSubmitBtn = document.getElementById("submit-btn")
const locationBtn = document.getElementById("send-location")


//Templates
const msgTemplate = document.getElementById("message-template").innerHTML
const locationMsgTemplate = document.getElementById("location-msg-template").innerHTML
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix : true})

const autoscroll = () => {
    //latest message element
    const newMessage= msgs.lastElementChild

    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin
    const visibleHeight = msgs.offsetHeight
    const containerHeight = msgs.scrollHeight
    const scrollOffset = msgs.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        msgs.scrollTop = msgs.scrollHeight
    }
}

socket.on("countUpdated", (count) => {
    console.log("The count has been updated, Count: ", count)
})

socket.on("welcome", () => {
    html = Mustache.render(msgTemplate, {
        message:"Welcome!"
        })
    msgs.insertAdjacentHTML('beforeend',html)
})

socket.on("message", (message) => {
    const html = Mustache.render(msgTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    msgs.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on("messageSent", (message) => {
    const html = Mustache.render(msgTemplate, {
        message : message.text,
        createdAt: moment(message.createdAt).format("h:mm a"),
        username: "@"+message.username
    })
    msgs.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on("locationSent", (coords) => {
    const message = `https://google.com/maps?q=${coords.coord.latitude},${coords.coord.longitude}`
    const html = Mustache.render(locationMsgTemplate, {
        message,
        username: "@"+coords.username,
        createdAt : moment(coords.createdAt).format("h:mm a")
    })
    msgs.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

form.addEventListener("submit", (e) => {
    e.preventDefault()
    formSubmitBtn.setAttribute("disabled", "disabled")

    socket.emit('sendMessage', msg.value,  (error) => {
        formSubmitBtn.removeAttribute("disabled")
        msg.value = ""
        msg.focus()
        if(error){
            return console.log(error)
        }
        console.log("Message delivered!")
    })
})

locationBtn.addEventListener("click", (e) => {
    e.preventDefault()

    locationBtn.setAttribute("disabled", "disabled")


    if(!navigator.geolocation){         //navigator is inbuilt for mozilla
        return alert("Geolocation is not supported by your browser")
    }

    navigator.geolocation.getCurrentPosition(({coords} = {}) => {
        socket.emit('sendLocation', {
            latitude: coords.latitude,
            longitude: coords.longitude
        }, () => {
            locationBtn.removeAttribute("disabled")
            console.log("Location Shared")
        })
    })
})

socket.emit("join", ({
    username,
    room
}), (error) => {
    if(error){
        return console.log(error)
    }
    console.log("a new user has joined")
})

socket.on("roomData", ({room, users}) => {
    const html = Mustache.render(sidebarTemplate,{
        room: room.toUpperCase(),
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})