const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

app.use(express.static("client"))

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html")
})

let players = []

io.on("connection", (socket) => {
	events(socket)
})

server.listen(1234, () => {
  console.log("listening on *:3000")
})

function events(socket) {
  console.log(`+ user (${socket.id})`)
  
  data(socket)

  socket.on("updatePlayers", (user) => {
    let updatedPlayers = []
    players.forEach(function(object) {
      if (object.id != socket.id) {
        updatedPlayers.push(object)
      }
    })
    updatedPlayers.push(user)
    players = updatedPlayers
    io.emit("players", players)
  })

  socket.on("disconnect", () => {
    let otherPlayers = []
    players.forEach(function(object) {
      if (object.id != socket.id) {
        otherPlayers.push(object)
      }
    })
    players = otherPlayers
    console.log(`- user (${socket.id})`)
  })
}

function data(socket) {
  let user = {
    id: socket.id,
    username: "Developer",
    x: Math.floor((Math.random() * 10) + 1),
    y: Math.floor((Math.random() * 10) + 1),
    radius: 25,
    color: "#ffc18c",
    skin: null,
    hands: {
        radius: 8,
        color: "#8c6a4d",
        distance: 6,
        state: 0
    },
    mouse: {
        x: null,
        y: null,
        angle: null
    },
    inventory: [],
    direction: []
  }
  let map = {
    rows: 25,
    columns: 25,
    tilesize: 300,
    tilecolor: "#50a900",
    data: []
  }
  socket.emit("user", user)
  socket.emit("map", map)
  players.push(user)
  io.emit("players", players)
  socket.emit("start")
}