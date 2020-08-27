// written by Andrés Villa Torres + Florian Bruggisser + Luke Franzke
// tracking IR Technology by Florian Bruggisser and Luke Franzke
// Interaction Design Group ZHdK

// references
// reference https://github.com/bohnacker/p5js-screenPosition
// https://github.com/processing/p5.js/issues/1553 -> solving the 2d Projection of 3d points
// https://www.keene.edu/campus/maps/tool/ -> drawing earth maps and converting them into latitude longitude



let earthImg 
let sky 
let moonImg 
let theta = 0.001 
let r = 400 
let easycam 
let toggle = false 
let moonX=800,moonY=0,moonZ=0 
let x = [] 
let y = [] 
let z = [] 
let x2 = [] 
let y2 = [] 
let z2 = [] 
let mAngle=0 
let socket = io() 
let posX =0 
let posY = 0 
let tPS, tPE // testPointStart , testPointEnd
let canvas 
let testTrackDevices = []
let threeDview = false
let myFont
let tableControl
let bckColor = [0,0,0]
let zurich
let cdmx
let rMX =  0/* -161 */
let rMY =  0/* -107 */
let rMZ =  0
let easycamIntialized=false
let touchX =0, touchY = 0
let projectPosition = 0
let media

let americaMap
let australiaMap
let euAsiaMap
let africaMap
let screenPointsAmerica = []
let screenPointsEuAsia = []
let screenPointsAfrica = []
let screenPointsAustralia = []
let pointsAmerica = []
let pointsEuAsia = []
let pointsAfrica = []
let pointsAustralia = []


/*  full screen */
let elem = document.documentElement
function openFullscreen() {
	// alert('indeed');
  if (elem.requestFullscreen) {
    elem.requestFullscreen()
  } else if (elem.mozRequestFullScreen) { /* Firefox */
    elem.mozRequestFullScreen()
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
    elem.webkitRequestFullscreen()
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
    elem.msRequestFullscreen()
  }
}


/* Close fullscreen */
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.mozCancelFullScreen) { /* Firefox */
    document.mozCancelFullScreen()
  } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
    document.webkitExitFullscreen()
  } else if (document.msExitFullscreen) { /* IE/Edge */
    document.msExitFullscreen()
  }
} 


function init(){
	let items = document.querySelectorAll(".project")

	for (let i = 0; i < items.length; i++) {
				items[i].style.background = "rgb(0,0,0)"
	}
	cssScrollSnapPolyfill()
	carousel()
}
let touchCount = 0
let ongoingTouches = []
let isTouch = false
function handleTouch(evt){
	isTouch=true
	touchCount++
	let touches = evt.changedTouches;
	// console.log("touch started at : " + evt.touches[0].clientX + " , " + evt.touches[0].clientY)

	touchX = evt.touches[0].clientX
	touchY = evt.touches[0].clientY
	
}

function handleEnd(evt) {
	isTouch=false
	// console.log("touch ended at : " + evt.changedTouches[0].pageX + " , " + evt.changedTouches[0].pageY )
	touchX = evt.changedTouches[0].pageX
	touchY = evt.changedTouches[0].pageY
}

function handleMove(evt) {
	 // console.log("touch moved at : " + evt.changedTouches[0].pageX + " , " + evt.changedTouches[0].pageY )
	touchX = evt.changedTouches[0].pageX
	touchY = evt.changedTouches[0].pageY
}






function ongoingTouchIndexById(idToFind) {
  for (var i = 0; i < ongoingTouches.length; i++) {
    var id = ongoingTouches[i].identifier;
    
    if (id == idToFind) {
      return i;
    }
  }
  return -1;    // not found
}

function resize(){
	init()
}

function getRandomColor(){
    var rgb1 = Math.floor((Math.random() * 255) + 200)
    var rgb2 = Math.floor((Math.random() * 255) + 200)
    var rgb3 = Math.floor((Math.random() * 255) + 200)
    return "rgb("+rgb1 +","+rgb2 + ","+rgb3 +")"
}



function preload() {
  	earthImg = loadImage('../imgs/earth.jpg') 
	sky = loadImage('../imgs/sky.jpg') 
	moonImg = loadImage('../imgs/moon.jpg')
	americaMap = loadTable('assets/maps/america.csv', '', '')
	australiaMap = loadTable('assets/maps/australia.csv', '', '')
	euAsiaMap = loadTable('assets/maps/euro-asia.csv','','')
	africaMap = loadTable('assets/maps/africa.csv','','')

	// for (let r = 0; r < americaMap.getRowCount(); r++)
 //    for (let c = 0; c < americaMap.getColumnCount(); c++) {
 //      	console.log(americaMap.getString(r, c))
 //    	}
	// }
	socket.on('connected',function(data){
		// console.log('new client connected id:' + data.id) 
	}) 
	
	myFont = loadFont('assets/Futura-Lig.otf')
	openFullscreen()
	init()

}


function logScroll(e) {
	// uncomment to log position of the scroll in console
	projectPosition = e.target.scrollTop/windowHeight


	for (i = 0; i < media.length; ++i) {
		if(projectPosition == i){
			media[i].play()
		}else
  		{
  			media[i].pause()
  		}
  		
	}
	// console.log(projectPosition)
  // console.log(`Scroll position: ${e.target.scrollTop}`)
}
function setup() {
	canvas = createCanvas(windowWidth/2, windowHeight, WEBGL) 
	noStroke()
	textFont(myFont)
	
	if(!easycamIntialized){
		easycam = new Dw.EasyCam(this._renderer, {distance:1500, center:[0,0,0]}) 
		easycam.setDistanceMin(100)
		easycam.setDistanceMax(r*60)
		easycamIntialized=true
	}
	// Attaching  Touch Listeners to body and P5 JS Canvas 
	document.body.addEventListener('touchstart',handleTouch,false)
	document.getElementById('defaultCanvas0').addEventListener('touchstart',handleTouch,false)
	document.getElementById('defaultCanvas0').addEventListener('touchend',handleEnd,false)
	document.getElementById('defaultCanvas0').addEventListener('touchmove',handleMove,false)

	media = document.querySelectorAll('video')
	// console.log(media.length)
	let projects = document.getElementsByClassName('project')

	Array.prototype.forEach.call(projects, function(el,index) {
		// console.log(el , index)
		
		
		el.addEventListener('click', function(){
			// console.log('click took place at project space nr. ' + index )
		})

	});
	document.getElementsByClassName('container')[0].onscroll=logScroll


	let fov = PI/3 
	let near = 200 
	let far = 80000 

	addScreenPositionFunction(this)

	setMap(americaMap,pointsAmerica,screenPointsAmerica)
	setMap(africaMap,pointsAfrica,screenPointsAfrica)
	setMap(australiaMap,pointsAustralia,screenPointsAustralia)
	setMap(euAsiaMap,pointsEuAsia,screenPointsEuAsia)
	// console.log(this._renderer)

	// CREATING A RANDOM ARRAY OF POINTS AROUND THE GLOBE
	for(let i = 0 ; i <400; i++){
		let lat = radians(random(-90,90)) 
		let lon = radians(random(-180,180)) 
		//cartesian coordinates
		x.push(r * Math.cos(lat) * Math.cos(lon)) 
		y.push(r * Math.cos(lat) * Math.sin(lon)) 
		z.push(r * Math.sin(lat)) 
		
		x2.push((r+250) * Math.cos(lat) * Math.cos(lon)) 
		y2.push((r+250) * Math.cos(lat) * Math.sin(lon)) 
		z2.push((r+250) * Math.sin(lat)) 
		
	}
	tPS = createVector()
	tPE = createVector()

	// SETTING RANDOM LOCATION FOR INTERACTIVE 3D POINT(S) EXAMPLE
	let lat = radians(47.3769)
	let lon = radians(8.5417)

	let latZ = radians(47.3769)
	let lonZ = radians(8.5417)

	let latMX = radians(19.4969)
	let lonMX = radians(-99.7233)

	// 	x = R * cos(lat) * cos(lon)
	// y = R * cos(lat) * sin(lon)
	// z = R *sin(lat)

	zurich = createVector(0,0,0)
	zurich.x = r * Math.cos(latZ) * Math.cos(lonZ )
	zurich.y =  r * Math.cos(latZ) * Math.sin(lonZ )
	zurich.z = r * Math.sin(latZ)

	cdmx = createVector(0,0,0)
	cdmx.x = r * Math.cos(latMX) * Math.cos(lonMX )
	cdmx.y =  r * Math.cos(latMX) * Math.sin(lonMX )
	cdmx.z = r * Math.sin(latMX)

	tPS.x = r * Math.cos(lat) * Math.cos(lon)
	tPS.y = r * Math.cos(lat) * Math.sin(lon)
	tPS.z = r * Math.sin(lat)

	tPE.x = (r+50) * Math.cos(lat) * Math.cos(lon)	
	tPE.y = (r+50) * Math.cos(lat) * Math.sin(lon)
	tPE.z = (r+50) * Math.sin(lat)

	let testPoint = screenPosition(-tPS.x, tPS.y, tPS.z)
	listenMessages()

	// tableControl = new CenterControl(320,475)
	
}

function draw() {
  	background(bckColor) 
	let user = createVector(mouseX,mouseY)
	show3D()
	show2d() 
	showMore2DPoints()

	showMap(pointsAmerica, screenPointsAmerica ,color(0,255,255))
	showMap(pointsAfrica, screenPointsAfrica ,color(0,255,100))
	showMap(pointsEuAsia, screenPointsEuAsia ,color(200,255,100))
	showMap(pointsAustralia, screenPointsAustralia ,color(255,50,100))
	easycam.setCenter([0,0,0],0.0)


}

// function touchMoved() {
//   return false;
// }

function show3D(){
	if(threeDview){
		ambientLight(60, 60, 60) 
 		let v1 = easycam.getPosition(500) 
	 	pointLight(255,255, 255, v1[0], v1[1]+300, v1[2]) 
	 	pointLight(255, 255, 255, v1[0], v1[1]+300, v1[2]) 
	  	texture(earthImg) 
	  	noStroke()
	  	// rotating earth in order to match coordinate system location
	  	push()
	  	rotateX(radians(rMX)) 
	  	rotateY(radians(rMY))
	  	rotateZ(radians(rMZ))
	  	sphere(r,64,64)
	  	pop()
		noLights() 
	 	ambientLight(255, 255, 255) 
	  	texture(sky) 
	  	noStroke() 
		sphere(r*5,6,6) 
		for(let i = 0; i <50; i++){
			drawLine(x[i],y[i],z[i],x2[i],y2[i],z2[i],0,0,255) 
		}
		drawLine(tPS.x,tPS.y,tPS.z,tPE.x,tPE.y,tPE.z,0,255,0)
	}
}
function keyTyped(){
	if( key ==='a' || key ==='A'){
		threeDview=!threeDview

	}
	if(key ==='f' || key ==='F'){
		openFullscreen()
	}
	if(key === 'y'){
		rMX+=10
	}
	if(key === 'h'){
		rMX-=10
	}
	if(key === 'g'){
		rMY+=10
	}
	if(key === 'j'){
		rMY-=10
	}
	if(key === 'i'){
		rMZ+=10
	}
	if(key === 'k'){
		rMZ-=10
	}
	rMZ
	console.log(rMX, rMY, rMZ)
}

function windowResized() {
  	resizeCanvas(windowWidth/2, windowHeight,true)
  	if(easycamIntialized){
  		easycam.setViewport([0,0,windowWidth/2, windowHeight])
	}
  	resize()
}

// LISTEN FOR NEW TRACKED DEVICES AND UPDATES
function listenMessages(){

	socket.on('addDevice', function(data){
		let thisDevice = new TrackedDevice()
		thisDevice.uniqueId = data.id
		thisDevice.x = data.x * windowWidth
		thisDevice.y = data.y * windowHeight
		thisDevice.rotation = data.rot
		testTrackDevices.push(thisDevice)
	}) 
	socket.on('updateDevice', function(data){
		let id = data.id 
		testTrackDevices.forEach( element => {
			if(element.uniqueId === id){
				element.x = data.x * windowWidth
				element.y = data.y * windowHeight
				element.rotation = data.rot
			}
		})
	})
	socket.on('removeDevice', function(data){
		let id = data.id 
		testTrackDevices.forEach( function(element,index) {
			if(element.uniqueId == id ){
				testTrackDevices.splice(index,1)
			}
		})
	}) 
}

function show2d() {
	let testPoint = screenPosition(-tPS.x, tPS.y, tPS.z)
	let testPoint2 = screenPosition(-tPE.x, tPE.y, tPE.z)
	
	let user = createVector(mouseX - windowWidth/4,mouseY - windowHeight/2)
	// in case the touch display or device is available use the touchX instead
	if(isTouch ){
		user = createVector (touchX - windowWidth/4 , touchY - windowHeight/2 )
	}

	// console.log(user.x , user.y)
	let testPoint2Ref = createVector(testPoint2.x,testPoint2.y)
	easycam.beginHUD()
	if(isTouch){
		fill(0,0,255,100)
		circle(touchX,touchY,50)
	}
	// tableControl.update()
	// tableControl.autoPos(random(-5,5),random(-5,5))
	// tableControl.show()
	// if(tableControl.locked){
	// 	bckColor = [100,int(map(tableControl.control,0,360,0,255)),100]
	// }else{
	// 	bckColor = [0,0,0]
	// }
	fill(255,0,0)
	noStroke()
	if(user.dist(testPoint)<55){
		circle(testPoint.x + windowWidth/4, testPoint.y + windowHeight/2, 10)
	}else{	
		circle(testPoint.x + windowWidth/4, testPoint.y + windowHeight/2, 1)
	}
	if(user.dist(testPoint2)<55){
		circle(testPoint2.x + windowWidth/4, testPoint2.y + windowHeight/2, 10)
	}else{	
		circle(testPoint2.x + windowWidth/4, testPoint2.y + windowHeight/2, 1)
	}
	stroke(255,0,0)
	strokeWeight(1)
	line(testPoint.x + windowWidth/4, testPoint.y +windowHeight/2,testPoint2.x + windowWidth/4, testPoint2.y + windowHeight/2 )
	if(testTrackDevices.length>0){
		testTrackDevices.forEach( element => {
			element.calculateRange()
			// uncomment this if the tableControl object is available
			// tableControl.interact(element.smoothPosition.x,element.smoothPosition.y,element.smoothRotation,element.uniqueId)
		})
		testTrackDevices.forEach(element =>{
			if(element.inRange){
				element.show()				
			}
		})
	}
	easycam.endHUD() 
}

// function calculateMaps

function setMap(map, mapPoints, screenMapPoints){

	let mapLong = map.getColumn(0)
	let mapLat = map.getColumn(1)
	for(let i = 0; i < mapLong.length; i ++){

		let latAt = radians(mapLat[i])
		let longAt = radians(mapLong[i])
		let point = createVector(0,0,0)
		point.x = r * Math.cos(latAt) * Math.cos(longAt )
		point.y = r * Math.cos(latAt) * Math.sin(longAt )
		point.z = r * Math.sin(latAt)
		mapPoints.push(point)
		// * note for some reason, the x-projection needs to be negative (-) otherwise the maps are mirrored
		// * it applies to all other points too
		let screenPoint = screenPosition(-point.x,point.y,point.z)
		let screen2DVector = createVector(screenPoint.x,screenPoint.y)
		screenMapPoints.push(screen2DVector)
	}

}
function showMap(mapPoints, screenMapPoints, farbe){
	// let screenMapPoints = []

	let step = 1
	for( let i = 0 ; i < screenMapPoints.length -step ; i = i +step){
		let screenPoint = screenPosition(-mapPoints[i].x,mapPoints[i].y,mapPoints[i].z)
		let screen2DVector = createVector(screenPoint.x,screenPoint.y)
		screenMapPoints[i] = screen2DVector
	}
	
	strokeWeight(1)
	easycam.beginHUD()
		beginShape()
		stroke(farbe)
		noFill()
		for( let i = 0; i < screenMapPoints.length -step ; i = i +step ){
			vertex(screenMapPoints[i].x + windowWidth/4, screenMapPoints[i].y + windowHeight/2)
		}
		endShape(CLOSE)
	easycam.endHUD()
}
function showMore2DPoints(){
	let testPoints = []
	let tZurich = screenPosition(-zurich.x,zurich.y,zurich.z)
	let tCDMX = screenPosition(-cdmx.x,cdmx.y,cdmx.z)

	for(let i = 0 ; i <400; i++){
		testPoints[i] = screenPosition(-x[i], y[i], z[i])
	}
	let user = createVector(mouseX - windowWidth/4,mouseY - windowHeight/2)
	// in case the touch display or device is available use the touchX instead
	if(isTouch ){
		user = createVector (touchX - windowWidth/4 , touchY - windowHeight/2 )
	}
	easycam.beginHUD()
		fill(255,255,100)
		noStroke()
		for(let i = 0; i < 50;i++){
			if(user.dist(testPoints[i])<25){
				circle(testPoints[i].x + windowWidth/4, testPoints[i].y + windowHeight/2, 10)
				let lat = Math.asin(z[i] / r )
				let lon = Math.atan2(y[i], x[i])
				lat = lat * 180 / Math.PI
				lon = lon * 180 / Math.PI
				textSize(12)
				let latLon = 'lat : ' + lat.toFixed(3) + ' , lon : '+ lon.toFixed(3);
				text( latLon ,testPoints[i].x + windowWidth/4 + 10, testPoints[i].y + windowHeight/2 + 5 )
			}else{
				circle(testPoints[i].x + windowWidth/4, testPoints[i].y + windowHeight/2, 3)
			}
		}
	fill(255,100,100)
	if(user.dist(tZurich)<25){
		let lat = Math.asin(zurich.z / r)
		let lon = Math.atan2(zurich.y,zurich.x)
		lat = lat * 180 / PI
		lon = lon * 180 / PI
		textSize(16)
		let latLon = 'ZURICH, LAT : ' + lat.toFixed(3) + ' , LON : '+ lon.toFixed(3);
		if(mouseX>windowWidth/4){
			text( latLon ,tZurich.x + windowWidth/4 - 240, tZurich.y + windowHeight/2 + 5 )
		}else{
			text( latLon ,tZurich.x + windowWidth/4 + 20, tZurich.y + windowHeight/2 + 5 )
		}
		circle(tZurich.x + windowWidth/4,tZurich.y + windowHeight/2,25)
	}else{
		circle(tZurich.x + windowWidth/4,tZurich.y + windowHeight/2,15)
	}	
	fill(0,0,255)
	circle(tCDMX.x + windowWidth/4,tCDMX.y + windowHeight/2,5)
	easycam.endHUD()
}
function mouseClicked() {
	toggle = !toggle 
	if(toggle){
		// openFullscreen()
		// do something
	}else{
		// closeFullscreen()		
		// do the opposite
	}
}
function drawLine(x1, y1, z1, x2, y2, z2, r,g,b){
	fill(r,g,b) 
	stroke(r,g,b) 
	strokeWeight(3) 
  	beginShape() 
  	vertex(x1,y1,z1) 
  	vertex(x2,y2,z2) 
  	endShape() 
	noStroke() 
}



//  ****** Classes ******

// *** CLASS FOR THE TRACKED DEVICE *** //
class TrackedDevice{
	constructor(){
		this.uniqueId = -1
		this.identifier = -1
		this.x = 0.0
		this.y = 0.0
		this.rotation =0.0
		this.intensity = 0.0
		this.dead = false
		this.smoothPosition  = createVector(0.0,0.0)
		this.smoothRotation = 0.0
		this.inRange = false
		this.angle = 0
		this.sizeL = 180
		this.thisLabel = new Label()
		this.oldPos = createVector(0,0)
		
	}
	update(){
		let currPos = createVector ( this.x,this.y )
		let delta = currPos.dist(this.oldPos)
		//let alpha = map(delta,0,windowWidth/2,0.99,0.001)
		let alpha = 0.1
		//if(delta > mouseX ){alpha = 0.01}else{alpha = 0.99}
		this.smoothRotation = this.easeFloat2((360 - this.rotation), this.smoothRotation, 0.85)
		// this.smoothRotation = 360 - this.smoothRotation
		//this.smoothPosition.x = this.easeFloat(this.x, this.smoothPosition.x, 0.95)
    		//this.smoothPosition.y = this.easeFloat(this.y, this.smoothPosition.y, 0.95)
		this.smoothPosition.x = this.easeFloat2(this.x, this.smoothPosition.x, alpha)
    		this.smoothPosition.y = this.easeFloat2(this.y, this.smoothPosition.y, alpha)
    		//this.smoothPosition.x = this.x
		//this.smoothPosition.y = this.y
		this.angle = Math.atan2(this.smoothPosition.y - windowHeight/2, this.smoothPosition.x - windowWidth/4) * 180 / Math.PI
		this.oldPos.x = this.smoothPosition.x
		this.oldPos.y = this.smoothPosition.y
	}
	show(){
		let radius = 45
		let lSize = map(this.smoothRotation,0,360,10,75)
		let rotX = (0 + radius) * Math.cos(radians(this.smoothRotation))
		let rotY = (0+ radius) * Math.sin(radians(this.smoothRotation))

		fill(255,255,100, 25+map(this.smoothRotation,0,360,0,150))
		noStroke()
		ellipse(this.smoothPosition.x,this.smoothPosition.y,radius*2 + lSize,radius*2 + lSize)
		fill(255,255,100)
		stroke(0)
		strokeWeight(10)
		circle(this.smoothPosition.x ,this.smoothPosition.y , radius*2)
		stroke(0)
		strokeWeight(10)
		line(this.smoothPosition.x , this.smoothPosition.y  , this.smoothPosition.x + rotX, this.smoothPosition.y + rotY)

		// DISPLAY DEGREES OF ROTATION
		push()
			translate(this.smoothPosition.x+rotX, this.smoothPosition.y+rotY)
			rotate(radians(this.smoothRotation))
			fill(255,255,100)
			textSize(30)
			// text(Math.round(this.smoothRotation,3) + " , " + Math.round(this.smoothPosition.x) + " , " + Math.round(this.smoothPosition.y), 30,10)
			text(Math.round(this.smoothRotation,3), 30,10)
		pop()

		// DISPLAY LABEL
		this.thisLabel.update(this.smoothPosition.x,this.smoothPosition.y,this.sizeL, this.smoothRotation + 120)		
		noStroke()
	}
	calculateRange(){
		this.update()
		
		// CONDITION DEVICE OUT OF DRAWING RANGE
		if(this.smoothPosition.x > windowWidth/2 || this.smoothPosition.x < 0 || this.smoothPosition.y>windowHeight || this.smoothPosition.y<0){
			// uncomment this to draw a line between the center of the drawing area and the center of the tracked device
			// strokeWeight(2)
			// stroke(0,255,0)
			// line(windowWidth/4,windowHeight/2, this.smoothPosition.x,this.smoothPosition.y)	
			push()
			translate(windowWidth/4,height/2)
			rotate(radians(this.angle))
			let sizeT = 30
			let thisTriangle = new Triangle(windowWidth/4 - sizeT,-sizeT,sizeT)
			thisTriangle.show()
			pop()

			this.inRange = false
		}else{
			this.inRange = true
		}
	}
	easeFloat (target, value, alpha = 0.1) {
    	const d = target - value
    	return value + (d * alpha)
  	}
	easeFloat2 (target, value, alpha ){
	value = value * alpha + target *(1-alpha)
	return value
	}
  	easeFloatCircular (target, value, maxValue, alpha = 0.1) {
    	let delta = target - value
    	const altDelta = maxValue - Math.abs(delta)

    	if (Math.abs(altDelta) < Math.abs(delta)) {
      		delta = altDelta * (delta < 0 ? 1 : -1)
    	}
		return value + (delta * alpha)
	}
	radians (degrees) {
		let radians = degrees * (Math.PI / 180)
		return radians
	}
}
// CLASS TO DRAW THE TRIANGLE
class Triangle{
	constructor(x, y, size){
		this.x = x
		this.y = y
		this.size = size
	}
	update(){

	}
	show(){
		noStroke()
		fill(255,255,100)
		beginShape()
		vertex(this.x,this.y)
		vertex(this.x,this.y+this.size*2)
		vertex(this.x+this.size, this.y+this.size)
		endShape(CLOSE)
		textSize(16)
		text('OBJECT OUT OF RANGE', this.x-200,this.y+this.size+4)
	}
}

// CLASS TO DRAW THE LABEL
class Label{
	constructor(x,y,size, rotation){
		this.x =0
		this.y = 0
		this.size = 0
		this.rotation = 0
		this.count = 0
		this.oldRotation = 0
		this.oldY = 0
		this.labelOff=false
		this.opacity = 0
	}
	update(x,y,size,rotation){

		this.x = x
		this.y = y
		this.size = size
		this.rotation = Math.round(rotation)

		if(this.rotation!=this.oldRotation){
			this.count=30
			this.labelOff = false

		}else{
			if(this.count>0){
				this.count --
			}else{
				this.labelOff = true
			}
		}
		this.opacity = map(this.count,0,30,0,255)
		if(!this.labelOff){
			this.show()
		}
		
		this.oldRotation = this.rotation

	}

	show(){
		
		let txtContent =[
			"I'M A PROTOTYPE FOR TANGIBLE INTERACTION AND DATA VISUALIZATION",
			"MOVE ME AROUND TO EXPLORE MY AFFORDANCES!",
			"STUDENTS FROM INTERACTION DESIGN USE ME TO EXPLORE THEIR CONCEPTS",
			"DESIGN ... TECHNOLOGY ... THINKING ... CONCEIVING ...  DOING ...  ",
			"PROTOTYPING"
		]
		let peak = 10
		
		
		let offX=120
		let offY=0
		push()
		strokeWeight(5)
		stroke(255,255,100,this.opacity)
		// fill(100,0,0,this.opacity)
		noFill()
		translate(this.x,this.y)
		rotate(radians(this.rotation))
		beginShape()
		vertex(offX,offY)
		vertex(offX+peak, offY-peak)
		vertex(offX+peak,offY-this.size/3)
		vertex(offX+peak+this.size, offY-this.size/3)
		vertex(offX+peak+this.size,offY+this.size/3)
		vertex(offX+peak, offY+this.size/3)
		vertex(offX+peak,offY+peak)
		endShape(CLOSE)
		textSize(16)
		fill(255,255,100,this.opacity)
		textAlign(CENTER,CENTER)
		text(txtContent[int(map(this.rotation,1,360,-1,4))],offX +30 , offY - this.size/4, this.size-25, this.size/2 )
		pop()

	}
}


// CLASS FOR CREATING A CONTROL ON THE MIDDLE OF THE DRAWING RANGE
class CenterControl{
	constructor(x,y){
		this.x = x
		this.y = y
		this.smoothX = 0
		this.smoothY = 0
		this.objX = 0
		this.objY = 0
		this.control = 0
		this.size = 60
		this.min = 50
		this.max = 100
		this.add = 1
		this.locked = false
		this.objectID 
	}
	update(){	
		if(this.size> this.max  || this.size < this.min){
			this.add = this.add * -1;
		}
		this.size = this.size + this.add
	}
	autoPos(x,y){

		if(!this.locked){
			if(this.x<0 || this.x > windowWidth/2){
				if(this.x<0){
					this.x = 1
				}
				if(this.x> windowWidth/2){
					this.x = windowWidth/2 - 1
				}
				
			}else{
				this.x = this.x + x
			}
			if(this.y<0 || this.y > windowHeight){
				if(this.y<0){
					this.y = 1
				}
				if(this.y>windowHeight){
					this.y = windowHeight - 1
				}
			}else{
				this.y = this.y + y
			}
			this.smoothX = this.easeFloat(this.x, this.smoothX, 0.1)
			this.smoothY = this.easeFloat(this.y, this.smoothY, 0.1)
		}
	}
	interact(objX,objY,controlValue, id){

		this.objX = objX
		this.objY = objY

		let p1 = createVector(this.smoothX,this.smoothY)
		let p2 = createVector(this.objX, this.objY)
		if(p1.dist(p2)< 90 && !this.locked){
			this.objectID = id
			this.locked = true
			this.control = controlValue
			// console.log('object in range id : ' + this.objectID)
			this.size = 120
			this.min = 120
			this.max = 150
			this.add = 0.5
		}else{

			if(this.objectID === id && p1.dist(p2)> 105 && this.locked){
				this.locked = false	
				// console.log('object ' + id +' not in range')
				this.size = 60
				this.min = 50
				this.max = 100
				this.add = 1
				this.control = 0		
			}

		}

		if(this.objectID === id && this.locked && p1.dist(p2)<105){
				this.control = controlValue
		}

	}
	show(){
		noFill()
		stroke(255,255,100,100)
		strokeWeight(8)
		circle(this.smoothX,this.smoothY,this.size,this.size)
		// circle(this.smoothX, this.smoothY,50)
	}
	easeFloat (target, value, alpha = 0.1) {
    	const d = target - value
    	return value + (d * alpha)
  	}
}


// image carousel
function carousel(){
const delay = 8000; //ms

const slides = document.querySelector(".slides");
const slidesCount = slides.childElementCount;
const maxLeft = (slidesCount - 1) * 100 * -1;

let current = 0;

function changeSlide(next = true) {
  if (next) {
    current += current > maxLeft ? -100 : current * -1;
  } else {
    current = current < 0 ? current + 100 : maxLeft;
  }

  slides.style.left = current + "%";
  // alert('slide changed')
}

let autoChange = setInterval(changeSlide, delay);
const restart = function() {
  clearInterval(autoChange);
  autoChange = setInterval(changeSlide, delay);
};

// Controls
document.querySelector(".next-slide").addEventListener("click", function() {
  changeSlide();
  restart();
});

document.querySelector(".prev-slide").addEventListener("click", function() {
  changeSlide(false);
  restart();
});
}

