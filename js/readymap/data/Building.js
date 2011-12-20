/*
 * Daniel Gaston
 * 
 * Add Buildings functionality for ReadyMap/WebGL
 * 
 * License: LGPL
*/
ReadyMap.BuildingNode = function(map, data, index, polOrLinOrPoi) {

    osg.Node.call(this);
	var height_weighting = 10;	//vertical exaggeration
    this.map = map;
    this.originLLA = { //origin assigned to the first vertex per stored in JSON file
	
		lat: Math.deg2rad(data[index].vertices[0].lat),
        lon: Math.deg2rad(data[index].vertices[0].lon)
    };
	
	this.heightField = [];
    for (var i = 0; i < data[index].vertices.length; ++i) {
        
		this.heightField.push(parseFloat(data[index].vertices[i].altura) * height_weighting);
    }


	this.build(data,index,height_weighting, polOrLinOrPoi);
	this.getBound();
};


ReadyMap.BuildingNode.prototype = osg.objectInehrit(osg.Node.prototype, {

    insertArray: function(from, to, toIndex) {
        for (var i = 0; i < from.length; i++) {
            to[toIndex + i] = from[i];
        }
    },
	
	rampColor: function(height,height_weighting) {
	
		if (height <= 2 * height_weighting){
			var c =[0,0,0]
		}
		else if(height <= 9 * height_weighting){
			var c =[0,0,1]
		}
		else if(height <= 15 * height_weighting){
			var c =[0,1,0]
		}
		else if(height <= 30 * height_weighting){
			var c =[1,1,0]
		}
		else if(height <= 60 * height_weighting){
			var c =[1,0.46,0]
		}
		else{
			var c = [1,0,0];
		}
		
        
        return c;
    },

    build: function(data,index,height_weighting, polOrLinOrPoi) {
	try{
        var verts = [];
		if(polOrLinOrPoi == '1'){
			var elements = [];
			wrapBuilding(data,index);
		
			var roofOutline = createRoofOutline(data,index);		// Array of indices that the roof consists of
			var roof = createRoofData(data,index,roofOutline);		// same, with attributes, ready for poly2tri triangulation
		}
		if(polOrLinOrPoi == '2'){
			var lines1 = [];
			var lines2 = [];
			wrapBuildingLines(data,index);
		}
		if(polOrLinOrPoi == '3'){
			var points1 = [];
			pointsIndices(data, index);
		}
		var normals = [];
        var colors = [];
		
		function pointsIndices(data, index){
			for(var i=0; i < data[index].vertices.length; i++){
				points1[i]=i;
			}
		}
		
		
		function wrapBuildingLines(data,index){	 //number of repeated edges equal to number of prism base -1 (cube = 3)
				var longitud = data[index].vertices.length;
				
						var parIgual = false;
						var imparAdelantado = true;
						lines1[0] = 0; 
						lines2[0] = 0;
						lines1[1] = 1; 
						lines2[1] = 2;
						for(var i=2; i < longitud -1 ; i++){//both lines share element o and 1
						
							if(i % 2 !== 0){
								if(!imparAdelantado){
									lines1[i]= i;
									lines2[i]= i + 1;
									imparAdelantado = !imparAdelantado;
								}
								else{
									lines1[i]= i - 1;
									lines2[i]= i + 2;
									imparAdelantado = !imparAdelantado;
								
								}
							}
							
							else{
								if(!parIgual){
									lines1[i]= i + 1;
									lines2[i]= i + 1;
									parIgual = !parIgual;
								}
								else{
									lines1[i]= i;
									lines2[i]= i;
									parIgual = !parIgual;
								
								}
							
							}
							
						}
						
				lines1[longitud -1] = i-1;
				
				//depends on the prism base relying upon it is odd or even
				if(longitud % 2 == 0) {//prisma con base par
				lines1[longitud] = 0;
				lines2[longitud-1] = 1;		
				}
				else{
				lines1[longitud] = 1;
				lines2[longitud-1] = 0;
				}
		}
		
		
		/*
		
		//USED for GL_TRIANGLE_STRIP rendering
		function wrapBuilding(data,index){
				for(var i=0; i < data[index].vertices.length ; i++){
				elements[i] = i;
				}
				elements[data[index].vertices.length] = 0;		//para terminar de unir la envoltura del edificio
				elements[data[index].vertices.length + 1] = 1;
		}
		*/
		function wrapBuilding(data,index){
				var normal_out = true;
				for(var i=0; i < data[index].vertices.length -2; i++){
				
					if(normal_out){
						elements.push(i);
						elements.push(i+1);
						elements.push(i+2);
						normal_out = !normal_out;
					}
					else{	//we define such differenciation in order to create the triangles in different order so that internally, the normal is determined
							//and when using cull faces, all faces point out.
						elements.push(i+1);
						elements.push(i);
						elements.push(i+2);
						normal_out = !normal_out;
					}
				}
				
				
				elements.push(data[index].vertices.length - 2);	//1st trinagle of last face
				elements.push(data[index].vertices.length - 1);
				elements.push(0);
				
				elements.push(0);								//2nd trinagle of last face
				elements.push(data[index].vertices.length - 1);
				elements.push(1);				
		}
		function createRoofOutline(data,index){
				var miContorno = new Array();
				var indiceArray = 0;
				for(var i=0; i < data[index].vertices.length ; i=i+2){ //even vertices conform the roof
					miContorno[indiceArray] = i;
					indiceArray++;
				}
				return miContorno;
		}
		
		function createRoofData(data,index,contornoTecho){
			
			//console.log('building: ' + index);
			var misDatosTecho = new Array();
			var misDatosTriangulacion = new Array();
			for (var i=0; i< contornoTecho.length; i++){//we prepare the date
				misDatosTecho[i] = new ReadyMap.poly2tri_Point(parseFloat(data[index].vertices[contornoTecho[i]].lon), parseFloat(data[index].vertices[contornoTecho[i]].lat)); 
			
			}

			var pointsAndEdges = new ReadyMap.poly2tri_SweepContext(misDatosTecho);
        
			// triangulate
			var triangles = ReadyMap.poly2tri_sweep_Triangulate(pointsAndEdges);//guardamos el array con los puntos, no indices
				
			

			var tempChange
			var tempx;
			var tempy;
			
			//finding the indices
				for(var i=0 ; i < triangles.length; i++){
				//we change the order of the points that consist a trinagle, in order to make the normal point out.
			
					for(var j=0; j < 3; j++){
						tempChange = triangles[i].points_[2];
						triangles[i].points_[2] = triangles[i].points_[0];
						triangles[i].points_[0] = tempChange;
					}
					for(var j=0; j < 3; j++){
					
					
					
						tempx = triangles[i].points_[j].x;
						tempy = triangles[i].points_[j].y;
						for (var k=0 ; k < data[index].vertices.length; k++){
							if((tempx == data[index].vertices[k].lon) && (tempy == data[index].vertices[k].lat )){
								misDatosTriangulacion.push(k);
								break;
							}
							
						}
					
					}
				
				}
		
		
			return misDatosTriangulacion;// array with triangles indices
		}
		

        // anchor point in world coords
        var centerWorld = this.map.lla2world([this.originLLA.lon, this.originLLA.lat, 0]);

        // local-to-world transform matrix
        var local2world = this.map.threeD ?
            this.map.profile.ellipsoid.local2worldFromECEF(centerWorld) :
            osg.Matrix.makeTranslate(this.centerWorld[0], this.centerWorld[1], this.centerWorld[2]);

        // world-to-local transform matrix:
        var world2local = [];
        osg.Matrix.inverse(local2world, world2local);
		
		var v = 0, c = 0, vi = 0;

        for (var i = 0; i < this.heightField.length; i++) {
			
                var height = this.heightField[i];
                var lla = [Math.deg2rad(data[index].vertices[vi].lon), Math.deg2rad(data[index].vertices[vi].lat), height];
                var world = this.map.lla2world(lla);
                var vert = osg.Matrix.transformVec3(world2local, world, []);																	
                this.insertArray(vert, verts, v);

                // todo: fix for elevation
                var normal = this.map.geocentric ? osg.Vec3.normalize(vert, []) : [0, 0, 1]; //PENDING
                this.insertArray(normal, normals, v);
                v += 3;

				
				var color = this.rampColor(height,height_weighting);									
                color[3] = 1; 

                this.insertArray(color, colors, c);
                c += 4;
				
                vi++;
            
        }
		
		
        this.geometry = new osg.Geometry();
        this.geometry.getAttributes().Vertex = new osg.BufferArray(gl.ARRAY_BUFFER, verts, 3);
        this.geometry.getAttributes().Normal = new osg.BufferArray(gl.ARRAY_BUFFER, normals, 3);
        this.geometry.getAttributes().Color = new osg.BufferArray(gl.ARRAY_BUFFER, colors, 4);
        
		
		if(polOrLinOrPoi == '1'){
			//Planes Representation
			var tris = new osg.DrawElements(gl.TRIANGLES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, elements, 1));
			this.geometry.getPrimitives().push(tris);
			
			
			var tris2 = new osg.DrawElements(gl.TRIANGLES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, roof, 1));
			this.geometry.getPrimitives().push(tris2);
		}
		
		if(polOrLinOrPoi == '2'){
			//Edges Representation
			var lin1 = new osg.DrawElements(gl.LINE_STRIP, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, lines1, 1));
			this.geometry.getPrimitives().push(lin1);
			
			var lin2 = new osg.DrawElements(gl.LINE_STRIP, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, lines2, 1));
			this.geometry.getPrimitives().push(lin2);
		}
		if(polOrLinOrPoi == '3'){
			//Edges Representation
			var point1 = new osg.DrawElements(gl.POINTS, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, points1, 1));
			this.geometry.getPrimitives().push(point1);
			
		}
		
		
        // put it under the localization transform:
        var xform = new osg.MatrixTransform();
        xform.setMatrix(local2world);
        xform.addChild(this.geometry);
        this.addChild(xform);

		this.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('FRONT'));
		
	
    }catch(err){
			console.log('Error in building' + index);
		}
	},

    traverse: function(visitor) {
        var n = this.children.length;
        for (var i = 0; i < n; i++) {
            this.children[i].accept(visitor);
        }
    }

});

ReadyMap.BuildingNode.prototype.objectType = osg.objectType.generate("BuildingNode");

osg.CullVisitor.prototype[ReadyMap.BuildingNode.prototype.objectType] = function(node) {
    if (node.stateset)
        this.pushStateSet(node.stateset);

    this.traverse(node);

    if (node.stateset)
        this.popStateSet();
};



