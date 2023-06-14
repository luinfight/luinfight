let socket = io()
let canvas = $("#game")
let ctx = canvas.getContext("2d")

let w = window.innerWidth
let h = window.innerHeight

canvas.width = w
canvas.height = h

let players = []
let user = {}
let map = {}
let camera = {}

let previousTime = Date.now()
let deltaTime = null

let game = {
    createMap: function() {
        for (let i = 0; i < map.rows; i++) {
            let row = [] 
            for (let j = 0; j < map.columns; j++) {
                row.push(0)
            }
            map.data.push(row)
        }
    },
    drawMap: function() {
        for (let i = 0; i < map.data.length; i++) {
            for (let j = 0; j < map.data[i].length; j++) {
                if (game.onscreen(i * map.tilesize, j * map.tilesize, map.tilesize, map.tilesize) == true) {
            		draw.rectangle(i * map.tilesize, j * map.tilesize, map.tilesize, map.tilesize, map.tilecolor, "black", 2)
                }
            }
        }
    },
    moveUser: function() {
        if (user.direction.includes("w") || user.direction.includes("arrowup")) {
            if (user.y - user.radius <= 0) {
                user.y = user.y
            }
            else {
                user.y -= 1 * deltaTime
            }
        }
        if (user.direction.includes("s") || user.direction.includes("arrowdown")) {
            if (user.y + user.radius >= map.rows * map.tilesize) {
                user.y = user.y
            }
            else {
                user.y += 1 * deltaTime
            }
        }
        if (user.direction.includes("a") || user.direction.includes("arrowleft")) {
            if (user.x - user.radius <= 0) {
                user.x = user.x
            }
            else {
                user.x -= 1 * deltaTime
            }
        }
        if (user.direction.includes("d") || user.direction.includes("arrowright")) {
            if (user.x + user.radius >= map.columns * map.tilesize) {
                user.x = user.x
            }
            else {
                user.x += 1 * deltaTime
            }
        }
        updatePlayers()
        setTimeout(() => {game.moveUser()})
    },
    drawPlayers: function() {
        players.forEach(function(object) {
            draw.write(object.username, object.x - object.radius * 1.5, object.y - 40, "black")
            ctx.save()
            ctx.translate(object.x, object.y)
            ctx.rotate(object.mouse.angle + Math.PI / 2)
            ctx.translate(- (object.x), - (object.y))
            draw.circle(object.x, object.y, object.radius, object.color)//Body
            if (object.hands.state == 0) {
        		draw.circle(object.x + object.radius - object.hands.distance, object.y - object.radius + 5, object.hands.radius, object.hands.color)//Left
        		draw.circle(object.x - object.radius + object.hands.distance, object.y - object.radius + 5, object.hands.radius, object.hands.color)//Right
            }
        	if (object.hands.state == 1) {
        		draw.circle(object.x + object.radius - object.hands.distance, object.y - object.radius - 3, object.hands.radius, object.hands.color)//Left
        		draw.circle(object.x - object.radius + object.hands.distance, object.y - object.radius + 5, object.hands.radius, object.hands.color)//Right
        	}
        	if (object.hands.state == 2) {
        		draw.circle(object.x + object.radius - object.hands.distance, object.y - object.radius + 5, object.hands.radius, object.hands.color)//Left
        		draw.circle(object.x - object.radius + object.hands.distance, object.y - object.radius - 3, object.hands.radius, object.hands.color)//Right
        	}
        	if (object.hands.state == 3) {
        		draw.circle(object.x + object.radius - object.hands.distance, object.y - object.radius - 3, object.hands.radius, object.hands.color)//Left
        		draw.circle(object.x - object.radius + object.hands.distance, object.y - object.radius - 3, object.hands.radius, object.hands.color)//Right
        	}
            ctx.restore()
        })
    },
    drawUI: function () {
        draw.write(`${Math.floor((user.x - 24) / 10)}, ${Math.floor((user.y - 24) / 10)}`, 50, 50, "black")
    },
    onscreen: function(x, y, width, height) {
        let playerX = []
        let playerY = []
        playerX = user.x 
        playerY = user.y
        if (x + width + playerX > 0 && y + playerY + height > 0 && x + width - playerX < canvas.width && y + height - playerY < canvas.height) {
            return true
        }
        else {
            return false
        }
    },
    updateCamera: function(status) {
        if (status === "start") {
        	players.forEach(function(object) {
            	if (object.id === user.id) {
                	camera.x = object.x - w / 2
                	camera.y = object.y - h / 2
                	ctx.translate(-camera.x, -camera.y)
            	}
        	})
        }
        if (status === "stop") {
            ctx.translate(camera.x, camera.y)
        }
    },
    delta: function() {
        let currentTime = Date.now()
        deltaTime = (currentTime - previousTime) / 15 // divide by 1000 to convert to seconds
        previousTime = currentTime
    },
    loop: function() {
        game.createMap()
        game.moveUser()
        function drawAll() {
            ctx.clearRect(0, 0, w, h)
            game.updateCamera("start")
            game.delta()
            game.drawMap()
            game.drawPlayers()
            game.updateCamera("stop")
            requestAnimationFrame(drawAll)
        }
        drawAll()
    }
}

let draw = {
    rectangle: function(x, y, width, height, fillcolor, strokecolor, linewidth) {
        ctx.beginPath()
        ctx.rect(x, y, width, height)
        if (fillcolor) {
            ctx.fillStyle = fillcolor
            ctx.fill()
        }
        if (strokecolor) {
            ctx.lineWidth = linewidth
            ctx.strokeStyle = strokecolor
            ctx.stroke()
        }
        ctx.closePath()
    },
    circle: function(x, y, radius, fillcolor, strokecolor, linewidth) {
    	ctx.beginPath()
    	ctx.arc(x, y, radius, 0, 2 * Math.PI)
    	if (fillcolor) {
        	ctx.fillStyle = fillcolor
        	ctx.fill()
    	}
    	if (strokecolor) {
        	ctx.lineWidth = linewidth
        	ctx.strokeStyle = strokecolor
        	ctx.stroke()
    	}
    	ctx.closePath()
	},
    write: function(text, x, y, color) {
    	ctx.fillStyle = color
  		ctx.font = "30px Arial"
 		ctx.fillText(text, x, y)
	}
}
function updatePlayers() {
    socket.emit("updatePlayers", user)
}

function events() {
    socket.on("user", (object) => {
        user = object
    })
    socket.on("map", (object) => {
        map = object
    })
    socket.on("players", (object) => {
        players = object
    })
    socket.on("start", () => {
        game.loop()
    })
}
events()

function $(css) {
    return document.querySelector(css)
}

window.addEventListener("keydown", (event) => {
    user.direction.push(event.key.toLowerCase())
    updatePlayers()
})

window.addEventListener("keyup", (event) => {
    let array = user.direction
    let newarray = array.filter(arra => arra != event.key.toLowerCase())
    user.direction = newarray
    updatePlayers()
})

window.addEventListener("wheel", (event) => {
    event.preventDefault()
}, {passive: false})

window.addEventListener("touchmove", (event) => {
    event.preventDefault()
}, {passive: false})

window.addEventListener("mousemove", (event) => {
    user.mouse.x = event.clientX
    user.mouse.y = event.clientY
    let dx = user.mouse.x - w / 2
    let dy = user.mouse.y - h / 2
    user.mouse.angle = Math.atan2(dy, dx)
    updatePlayers()
})

window.addEventListener("mousedown", () => {
    user.hands.state = Math.floor((Math.random() * 3) + 1)
    updatePlayers()
})

window.addEventListener("mouseup", () => {
    user.hands.state = 0
    updatePlayers()
})