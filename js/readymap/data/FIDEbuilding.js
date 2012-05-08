
/*
 * Daniel Gaston
 * 
 * Add Buildings functionality for ReadyMap/WebGL
 * 
 * License: LGPL
*/
ReadyMap.FIDEBuildingNode = function(map, data, polOrLinOrPoi,color_choice) {

    osg.Node.call(this);
	var height_weighting = 1;	//vertical exaggeration
    this.map = map;
	
    this.originLLA = { 

		lat: Math.deg2rad(data[0][0][1]),
        lon: Math.deg2rad(data[0][0][0])
    };
	this.heightField = [];

	this.build(data,height_weighting, polOrLinOrPoi,color_choice);
};


ReadyMap.FIDEBuildingNode.prototype = osg.objectInehrit(osg.Node.prototype, {

    insertArray: function(from, to, toIndex) {
        for (var i = 0; i < from.length; i++) {
            to[toIndex + i] = from[i];
        }
    },
	
	rampColor: function(height,height_weighting) {
	
		if (height <= 2 * height_weighting){
			var c =[0,0,0,1]
		}
		else if(height <= 3 * height_weighting){
			var c =[0,0,1,1]
		}
		else if(height <= 6 * height_weighting){
			var c =[0,1,0,1]
		}
		else if(height <= 9 * height_weighting){
			var c =[1,1,0,1]
		}
		else if(height <= 12 * height_weighting){
			var c =[1,0.46,0,1]
		}
		else{
			var c = [1,0,0,1];
		}

        return c;
    },
	
	rampColorFIDE_varied: function(color_temp,index) {
		
		intensity = color_temp[index];
		
		if (intensity <= 0.125){ //violet
			var c =[238/255,130/255,238/255,1]
		}
		else if(intensity <= 0.250){ //indigo
			var c =[75/255,0,130/255,1]
		}
		else if(intensity <= 0.375){//deep sky blue
			var c =[0,191/255,1,1]
		}
		else if(intensity <= 0.5){ //olive
			var c =[128/255,128/255,0,1]
		}
		else if(intensity <= 0.625){//green
			var c =[0,1,0,1]
		}
		else if(intensity <= 0.750){//yellow
			var c =[1,1,0,1]
		}
		else if(intensity <= 0.875){//orange
			var c =[1,165/255,0,1]
		}
		else{//red
			var c = [1,0,0,1];
		}
		 
		
        return c;
    },
	rampColorFIDE_greyscale: function(color_temp,index) {
		
		intensity = color_temp[index];
		
		if (intensity <= 0.125){
			var c = [0,0,0,1];
		}
		else if(intensity <= 0.250){ 
			var c = [36/255,36/255,36/255,1];
		}
		else if(intensity <= 0.375){
			var c = [72/255,72/255,72/255,1];
		}
		else if(intensity <= 0.5){ 
			var c = [108/255,108/255,108/255,1];
		}
		else if(intensity <= 0.625){
			var c = [144/255,144/255,144/255,1];
		}
		else if(intensity <= 0.750){
			var c = [180/255,180/255,180/255,1];
		}
		else if(intensity <= 0.875){
			var c = [220/255,220/255,220/255,1];		
		}
		else{//white
			var c = [1,1,1,1];
		}
		 
		
        return c;
    },

    build: function(data,height_weighting, polOrLinOrPoi,color_choice) {
		
		//Random values for faces since Solar incidence servlet is not included
		var color_temp =[];
		for(var i=0; i< data.length; i++){
			color_temp[i] = Math.random();	
		}
		
		/*
		var solarMax = solar[0];
							
		for(var i = 1; i < solar.length; i++){
			if(solar[i] > solarMax){solarMax = solar[i];}
		}
		
		if(solarMax == 0){
		alert('ERROR --> Maximum incidence = 0   (subsequently changed to 1)');
		solarMax = 1;
		}
		*/
		
        var verts = [];
		var facesError = [];
		
		if(polOrLinOrPoi == '1'){
			//var elements = [];
			var last_index = 0;
			var faces = []	
			var basisTransf;
			var faceLength;
			
			for(var index = 0; index < data.length; index++){
				var faceOutline = [];				
				var u_vec3 = [];
								
				faceOutline, basisTransf, u_vec3 = changeBasis(data, index);
				faceLength = faceOutline.length;
				if(basisTransf != 'error'){
					facesError[index] = 0; // 0 = OK ; 1 = Error en la cara
					createFaceData(faceOutline,last_index, faces,index, basisTransf, u_vec3);
					last_index = last_index + faceLength;
				}
				else{
					facesError[index] = 1;
				}
				 		
			}
		}	
		if(polOrLinOrPoi == '2'){
			var lines1 = [];
			buildingLines2(data);
		}
		if(polOrLinOrPoi == '3'){
			var points1 = [];
			pointsIndices(data);
		}
		var normals = [];
        var colors = [];
		
		function pointsIndices(data){
			var last_index=0;
			
			for(var index = 0; index < data.length; index++){
				for(var i=0; i < data[index].length; i++){
									
					points1.push(last_index);
					last_index++;				
				}			
			}
		}
		
		//implemeted for GL_LINE_STRIP //TODO
		function buildingLines(data){	 
			var last_index=0;
			
			for(var index = 0; index < data.length; index++){
				var longitud;
					for (var j = 0; j < data[index].length ; j++){
						longitud = data[index].length;
						if((j==0)){
						lines1.push(last_index + j);
						}
						else if((j!=0) && (j!= longitud -1)){
						lines1.push(last_index + j);					
						}
						else{//last vertex of face
						
						lines1.push(last_index + j);
						lines1.push(last_index + j);//replicated in order to close GL_LINES chain representation
						}

					}
				last_index = last_index + longitud;
			}
		}
		
		function buildingLines2(data){	
			var last_index=0;
			
			for(var index = 0; index < data.length; index++){
				var longitud;
					for (var j = 0; j < data[index].length ; j++){
					//longitud = data[index][j].length;
					longitud = data[index].length;
					
						if(j!= longitud -1){
						lines1.push(last_index + j);
						lines1.push(last_index + j+1);
						
						}
						else{//last vertex of face
						
						lines1.push(last_index + j);
						lines1.push(last_index);//replicated in order to close GL_LINES chain representation
						}
				
				
					}
				last_index = last_index + longitud;
			}
		}
		
		function changeBasis(data, index){		
			//check there is no repeated points
			var lonArray = data[index].length;
			var match;
				for(var i = 0; i < lonArray; i++){
					match = 0;
					for(var j = 0; j< lonArray; j++){
						if(data[index][i][0] == data[index][j][0] &&
						   data[index][i][1] == data[index][j][1] &&
						   data[index][i][2] == data[index][j][2]){
						   
							match++;
							if(match > 1){
								data[index].splice(j,1);
								lonArray--;
								j--;
							}		
						}				
					}
				}
			var tempx;
			var tempy;
			var tempz;
			
			
			var point_A = [data[index][0][0], data[index][0][1],data[index][0][2]];
			var point_B; 
			var point_C;
			var area_triangle = 0;
			var area_temp;
			var dist_p0p1;
			var dist_p0p2;
			var dist_p1p2;
			var semi;
			var i=1;
			
			try{
				while(area_triangle == 0 && i < data[index].length -1) {
					
					point_B = [data[index][i][0], data[index][i][1],data[index][i][2]];
					point_C = [data[index][i+1][0], data[index][i+1][1],data[index][i+1][2]];

					
					//Triangles area based on the longitude of its sides 
					//(http://en.wikipedia.org/wiki/Triangle#Using_coordinates)
					
						//around z axis -> PLANE XY
						dist_p0p1 = Math.sqrt(Math.pow((point_A[0]-point_B[0]),2) + Math.pow((point_A[1]-point_B[1]),2));
						dist_p0p2 = Math.sqrt(Math.pow((point_A[0]-point_C[0]),2) + Math.pow((point_A[1]-point_C[1]),2));
						dist_p1p2 = Math.sqrt(Math.pow((point_B[0]-point_C[0]),2) + Math.pow((point_B[1]-point_C[1]),2));				
						semi = (dist_p0p1 + dist_p0p2 + dist_p1p2) / 2;	
						area_temp = Math.sqrt(semi * (semi - dist_p0p1) * (semi - dist_p0p2) * (semi - dist_p1p2));
						area_temp > area_triangle? area_triangle = area_temp:area_triangle = area_triangle;
						
						//around y axis -> PLANE ZX
						dist_p0p1 = Math.sqrt(Math.pow((point_A[2]-point_B[2]),2) + Math.pow((point_A[0]-point_B[0]),2));
						dist_p0p2 = Math.sqrt(Math.pow((point_A[2]-point_C[2]),2) + Math.pow((point_A[0]-point_C[0]),2));
						dist_p1p2 = Math.sqrt(Math.pow((point_B[2]-point_C[2]),2) + Math.pow((point_B[0]-point_C[0]),2));					
						semi = (dist_p0p1 + dist_p0p2 + dist_p1p2) / 2;	
						area_temp = Math.sqrt(semi * (semi - dist_p0p1) * (semi - dist_p0p2) * (semi - dist_p1p2));
						area_temp > area_triangle? area_triangle = area_temp: area_triangle = area_triangle;
						
						//around x axis -> PLANE YZ
						dist_p0p1 = Math.sqrt(Math.pow((point_A[1]-point_B[1]),2) + Math.pow((point_A[2]-point_B[2]),2));
						dist_p0p2 = Math.sqrt(Math.pow((point_A[1]-point_C[1]),2) + Math.pow((point_A[2]-point_C[2]),2));
						dist_p1p2 = Math.sqrt(Math.pow((point_B[1]-point_C[1]),2) + Math.pow((point_B[2]-point_C[2]),2));					
						semi = (dist_p0p1 + dist_p0p2 + dist_p1p2) / 2;	
						area_temp = Math.sqrt(semi * (semi - dist_p0p1) * (semi - dist_p0p2) * (semi - dist_p1p2));
						area_temp > area_triangle? area_triangle = area_temp: area_triangle = area_triangle;
					i++;
				}
			
				if(area_triangle < 0.000000000005){ //TEST VALUE. Improve
					//window.alert('Collinear points in Normal vector calculation detected');
					throw {	type: 0,
							message: 'Collinear points in Normal vector calculation detected'};
					
				}
			}
			
			catch(e){
				if(e.type == 0){
					faceOutline = data[index];
					basisTransf = 'error';
					u_vec3 = [0,0,0];
					return	faceOutline, basisTransf, u_vec3;				
				}
			}	
					var u_vec1 = [point_B[0] - point_A[0],point_B[1] - point_A[1],point_B[2] - point_A[2]];
					var u_vec2 = [point_C[0] - point_A[0],point_C[1] - point_A[1],point_C[2] - point_A[2]];
					var u_vec3 = [];
					osg.Vec3.normalize(u_vec1,u_vec1);
					osg.Vec3.normalize(u_vec2,u_vec2);
				
					osg.Vec3.cross(u_vec1,u_vec2,u_vec3);
					osg.Vec3.normalize(u_vec3,u_vec3);
					
					var unit_vector_X = Math.abs(u_vec3[0]);
					var unit_vector_Y = Math.abs(u_vec3[1]);
					var unit_vector_Z = Math.abs(u_vec3[2]);
					
					if ((unit_vector_Z >= unit_vector_X) && (unit_vector_Z >= unit_vector_Y)){
						basisTransf = 'z';
						
						for(var j = 0; j < data[index].length; j++ ){
						//points are not modified
							tempx = data[index][j][0];
							tempy = data[index][j][1];
							temp = new ReadyMap.poly2tri_Point(parseFloat(tempx), parseFloat(tempy));
							faceOutline.push(temp);
						}	
					}
					if ((unit_vector_Y > unit_vector_X) && (unit_vector_Y > unit_vector_Z)){
						basisTransf = 'y';
						
						for(var j = 0; j < data[index].length ; j++ ){
						//points are modified, change of coordinates
							tempx = data[index][j][0];
							tempz = data[index][j][2];
							temp = new ReadyMap.poly2tri_Point(parseFloat(tempx), parseFloat(tempz));
							faceOutline.push(temp);
							
						}
					}
					else if ((unit_vector_X > unit_vector_Y) && (unit_vector_X > unit_vector_Z)){
						basisTransf = 'x';
						
						for(var j = 0; j < data[index].length ; j++ ){
							tempy = data[index][j][1];
							tempz = data[index][j][2];
							temp = new ReadyMap.poly2tri_Point(parseFloat(tempy), parseFloat(tempz));
							faceOutline.push(temp);
						}
					}
					
					return faceOutline, basisTransf, u_vec3;
				
			
		}
		
		function createFaceData(faceOutline,last_index, faces, index, basisTransf){
		
			var temp_lon, temp_lat, temp_altura;
			var misDatosTriangulacion = new Array();
			
			//prepare sweep Context
			var pointsAndEdges = new ReadyMap.poly2tri_SweepContext(faceOutline);
        
			// triangulate
			try{
			var triangles = ReadyMap.poly2tri_sweep_Triangulate(pointsAndEdges);//we save array with points, not indices
				
			
			}catch(err){
				//console.log('Roof failure creation, building: '+index);
				}
		
			if(triangles){
				var tempChange
				var tempx;
				var tempy;
				var tempz;
				
				//finding indices
				for(var i=0 ; i < triangles.length; i++){
					var check = 0;
					
					if(basisTransf == 'z'){	
								
						for(var j=0; j < 3; j++){
			
							tempx = triangles[i].points_[j].x;
							tempy = triangles[i].points_[j].y;
							
							tempx = tempx.toFixed(12);
							tempy = tempy.toFixed(12);
															
							for (var k=0 ; k < data[index].length; k++){
							
								temp_lon = parseFloat(data[index][k][0]);
								temp_lat = parseFloat(data[index][k][1]);
								temp_lon = temp_lon.toFixed(12);
								temp_lat = temp_lat.toFixed(12);
								
								if((tempx == temp_lon) && (tempy == temp_lat)){
									faces.push(last_index + k);// array with triangles indices
									check++;
									break;
								}					
							}
						}
					}
					
					
					if(basisTransf == 'y'){	
									
						for(var j=0; j < 3; j++){
			
							tempy = triangles[i].points_[j].x;
							tempz = triangles[i].points_[j].y;
							
							tempy = tempy.toFixed(12);
							tempz = tempz.toFixed(12);
															
							for (var k=0 ; k < data[index].length; k++){
							
								temp_lon = parseFloat(data[index][k][0]);
								temp_altura = parseFloat(data[index][k][2]);
								temp_lon = temp_lon.toFixed(12);
								temp_altura = temp_altura.toFixed(12);
								
								if((tempy == temp_lon) && (tempz == temp_altura)){
									faces.push(last_index + k);// array with triangles indices
									check++;
									break;
								}					
							}
						}
					}
					
					
					else if(basisTransf == 'x'){
					
						for(var j=0; j < 3; j++){
			
							tempx = triangles[i].points_[j].x;
							tempz = triangles[i].points_[j].y;
							
							tempx = tempx.toFixed(12);
							tempz = tempz.toFixed(12);
															
							for (var k=0 ; k < data[index].length; k++){
							
								temp_lat = parseFloat(data[index][k][1]);
								temp_altura = parseFloat(data[index][k][2]);
								temp_lat = temp_lat.toFixed(12);
								temp_altura = temp_altura.toFixed(12);
								
								if((tempx == temp_lat) && (tempz == temp_altura)){
									faces.push(last_index + k);// array with triangles indices
									check++;
									break;
								}					
							}
						}
					}
					
					if (check != 3){
						window.alert('Triangle point retrieving Error. Building: ' + index);
						console.log('Triangle point retrieving Error. Building: ' + index);
					}
				}
			}else{
			//window.alert('Triangle point retrieving Error. Building: ' + index); //redundant. ReadyMap.poly2tri_sweep_Triangulate is already within try-catch 
			}		
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
		
		var v = 0, c = 0, vi = 0,n_v = 0;
		
		for(var index =0 ; index < data.length; index++){
			
		if(polOrLinOrPoi == 1){
			if(facesError[index] != 1){
				for(var i=0; i < data[index].length; i++){
			
					this.heightField.push(parseFloat(data[index][i][2]) * height_weighting);
					
					var height = this.heightField[vi];
					var lla = [Math.deg2rad(data[index][i][0]), Math.deg2rad(data[index][i][1]), height];
					var world = this.map.lla2world(lla);
					var vert = osg.Matrix.transformVec3(world2local, world, []);																	
					this.insertArray(vert, verts, v);

					// todo: fix for elevation
					var normal = this.map.geocentric ? osg.Vec3.normalize(vert, []) : [0, 0, 1]; //PENDING
					this.insertArray(normal, normals, v);
					v += 3;
					
					if(color_choice == '0'){
						var color = this.rampColor(height,height_weighting);
					}			
					else if(color_choice == '1'){
						var color = this.rampColorFIDE_varied(color_temp,index);
					}
					else{
						var color = this.rampColorFIDE_greyscale(color_temp,index);
					}
					
					this.insertArray(color, colors, c);
					
					c += 4;
					
					vi++;
					n_v++;
	
				}
			}
		}
		else{
			for(var i=0; i < data[index].length; i++){
			
					this.heightField.push(parseFloat(data[index][i][2]) * height_weighting);
					var height = this.heightField[vi];
					var lla = [Math.deg2rad(data[index][i][0]), Math.deg2rad(data[index][i][1]), height];
					var world = this.map.lla2world(lla);
					var vert = osg.Matrix.transformVec3(world2local, world, []);																	
					this.insertArray(vert, verts, v);

					// todo: fix for elevation
					var normal = this.map.geocentric ? osg.Vec3.normalize(vert, []) : [0, 0, 1]; //PENDING
					this.insertArray(normal, normals, v);
					v += 3;
					
					if(color_choice == '0'){
						var color = this.rampColor(height,height_weighting);
					}	
					else if(color_choice == '1'){
						var color = this.rampColorFIDE_varied(color_temp,index);
					}
					else{
						var color = this.rampColorFIDE_greyscale(color_temp,index);
					}
					
					this.insertArray(color, colors, c);
					
					c += 4;					
					vi++;
					n_v++;
				}	
		}
		}
		
		console.log('verts length : ' + verts.length);
		console.log('normals length: ' + normals.length);
		console.log('colors length: ' + colors.length);

		
        this.geometry = new osg.Geometry();
        this.geometry.getAttributes().Vertex = new osg.BufferArray(gl.ARRAY_BUFFER, verts, 3);
        this.geometry.getAttributes().Normal = new osg.BufferArray(gl.ARRAY_BUFFER, normals, 3);
        this.geometry.getAttributes().Color = new osg.BufferArray(gl.ARRAY_BUFFER, colors, 4);
        
		
		if(polOrLinOrPoi == '1'){
			//Planes Representation
			var tris = new osg.DrawElements(gl.TRIANGLES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, faces, 1));
			this.geometry.getPrimitives().push(tris);
			
		}
		
		if(polOrLinOrPoi == '2'){
			//Edges Representation
			var lin1 = new osg.DrawElements(gl.LINE_STRIP, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, lines1, 1));
			this.geometry.getPrimitives().push(lin1);
			
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

		this.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE')); 

	},

    traverse: function(visitor) {
        var n = this.children.length;
        for (var i = 0; i < n; i++) {
            this.children[i].accept(visitor);
        }
    }

});

ReadyMap.FIDEBuildingNode.prototype.objectType = osg.objectType.generate("FIDEBuildingNode");

osg.CullVisitor.prototype[ReadyMap.FIDEBuildingNode.prototype.objectType] = function(node) {
    if (node.stateset)
        this.pushStateSet(node.stateset);

    this.traverse(node);

    if (node.stateset)
        this.popStateSet();
};