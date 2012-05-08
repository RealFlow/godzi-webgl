
/*
 * Daniel Gaston
 * 
 * Add Buildings functionality for ReadyMap/WebGL
 * 
 * License: LGPL
*/
ReadyMap.BuildingNode = function(map, data, polOrLinOrPoi, buil_start, buil_end,color_choice) {

    osg.Node.call(this);
	var height_weighting = 1;	//vertical exaggeration
    this.map = map;
	
    this.originLLA = { 

		lat: Math.deg2rad(data[buil_start].vertices[0].lat),
        lon: Math.deg2rad(data[buil_start].vertices[0].lon)
    };
	this.heightField = [];

	this.build(data,height_weighting, polOrLinOrPoi, buil_start, buil_end,color_choice);
};


ReadyMap.BuildingNode.prototype = osg.objectInehrit(osg.Node.prototype, {

    insertArray: function(from, to, toIndex) {
        for (var i = 0; i < from.length; i++) {
            to[toIndex + i] = from[i];
        }
    },
	
	rampColor: function(height,height_weighting) {
	
		if (height <= 2 * height_weighting){
			var c =[0,0,0,1]
		}
		else if(height <= 9 * height_weighting){
			var c =[0,0,1,1]
		}
		else if(height <= 15 * height_weighting){
			var c =[0,1,0,1]
		}
		else if(height <= 30 * height_weighting){
			var c =[1,1,0,1]
		}
		else if(height <= 60 * height_weighting){
			var c =[1,0.46,0,1]
		}
		else{
			var c = [1,0,0,1];
		}
		    
        return c;
    },
	
	rampColor2: function(index,height,height_weighting,hoja,hojas) {
	
	
		var length = hojas.length;
		var dif = Math.floor(length/3); //35
		var indice;
		var c = [0,0,0,1];
		
		if (height <= 2 * height_weighting){	
			return c;
		}	
		for(var i = 0; i < length; i++ ){
			if(hoja == hojas[i]){
				indice = i;
			}
		}		
		if(indice <= dif){
			c = [((indice+1)/dif),0,0,1];
			return c;
			
		}
		if((indice <= 2*dif) && (indice > dif)){
			c = [1,((indice-dif) /dif),0,1];
			return c;
		}
		else{
			c = [1,1,((indice-(2*dif))/(dif+1)),1];
			return c;
		}      
    },

    build: function(data,height_weighting, polOrLinOrPoi, buil_start, buil_end,color_choice) {
	
        var verts = [];
		
			if(polOrLinOrPoi == '1'){
				var elements = [];
				var last_index = 0;
				
				
				var roof = [];//Stores roof´s triangle elements
				for(var index = buil_start; index < buil_end; index++){
				
					var roofOutline = [];
					var misDatosTecho = [];
					
					var lon = wrapBuilding(data,index, elements, last_index); //draws buildings side faces
					createRoofOutline(data,index,last_index, roofOutline);
				
					// Array of indices that a roof consists of
					createRoofData(data,index,misDatosTecho,roof, last_index,roofOutline);
					last_index = last_index + lon;
					
				}
			}	
		if(polOrLinOrPoi == '2'){
			var lines1 = [];
			var lines2 = [];
			wrapBuildingLines(data, buil_start, buil_end);
		}
		if(polOrLinOrPoi == '3'){
			var points1 = [];
			pointsIndices(data, buil_start, buil_end);
		}
		var normals = [];
        var colors = [];
		
		
		function pointsIndices(data, buil_start, buil_end){
			var last_index=0;
			
			for(var index = buil_start; index < buil_end; index++){
				for(var i=0; i < data[index].vertices.length; i++){
					
					if(data[index].vertices[i].lon == -0.323081){
						console.log('puerto de valencia en index: '+index);
					}
					points1.push(last_index);
					last_index++;
					
				}			
			}
			
		}
		
		function wrapBuildingLines(data, buil_start, buil_end){	 //number of repeated edges equal to number of prism base -1 (cube = 3)
			var last_index=0;
			
			for(var index = buil_start; index < buil_end; index++){
				var longitud = data[index].vertices.length;
				
					if(longitud % 2 != 0){
					console.log('edificio ' + index + ' tiene longitud impar');
					}
						var parIgual = false;
						var imparAdelantado = true;
						lines1.push(last_index + 0);
						lines2.push(last_index + 0);
						lines1.push(last_index + 1); 
						lines2.push(last_index + 2);
						lines1.push(last_index + 1); 
						lines2.push(last_index + 2);
						for(var i=2; i < longitud -1 ; i++){//both lines share element 0 and 1
						
							if(i % 2 !== 0){
								if(!imparAdelantado){
									lines1.push(i + last_index);
									lines1.push(i + last_index);
									lines2.push(i + last_index + 1);
									lines2.push(i + last_index + 1);
									imparAdelantado = !imparAdelantado;
								}
								else{
									lines1.push(i + last_index - 1);
									lines1.push(i + last_index - 1);
									lines2.push(i + last_index + 2);
									lines2.push(i + last_index + 2);
									imparAdelantado = !imparAdelantado;							
								}
							}						
							else{
								if(!parIgual){
									lines1.push(i + last_index + 1);
									lines1.push(i + last_index + 1);
									lines2.push(i + last_index + 1);
									lines2.push(i + last_index + 1);
									parIgual = !parIgual;
								}
								else{
									lines1.push(i + last_index);
									lines1.push(i + last_index);
									lines2.push(i + last_index);
									lines2.push(i + last_index);
									parIgual = !parIgual;							
								}
							
							}
							
						}
				
				//depends on the prism base relying upon it is odd or even
				if((longitud/2) % 2 == 0) {//even number prism base
				lines1.push(last_index + i-1);
				lines1.push(last_index + i-1);
				lines2.push(last_index + 1);
				lines1.push(last_index + 0);
				
				}
				else{
				lines1.push(last_index + i);
				lines1.push(last_index + i);
				lines2.push(last_index + 0);
				lines1.push(last_index + 1);
				
				}
				last_index = last_index + longitud;
			}
		}

		function wrapBuilding(data,index, elements, last_index){
							
				var normal_out = true;
				for(var i=0; i < data[index].vertices.length -2; i++){
				
					if(normal_out){
						elements.push(last_index + i);
						elements.push(last_index + i+1);
						elements.push(last_index + i+2);
						normal_out = !normal_out;
						
					}
					else{	//we define such differentiation in order to create the triangles in different order so that internally, the cull face is determined, pointing out
						elements.push(last_index + i+1);
						elements.push(last_index + i);
						elements.push(last_index + i+2);
						normal_out = !normal_out;
						
					}
				}
							
				elements.push(last_index + data[index].vertices.length - 2);	//1st trinagle of last face
				elements.push(last_index + data[index].vertices.length - 1);
				elements.push(last_index);
				
				elements.push(last_index);										//2nd trinagle of last face
				elements.push(last_index + data[index].vertices.length - 1);
				elements.push(last_index + 1);
				
				return data[index].vertices.length;				
		}
		function createRoofOutline(data,index,last_index, roofOutline){
							
				for(var i=0; i < data[index].vertices.length ; i=i+2){ //even vertices conform the roof
			
					roofOutline.push(last_index + i);
					temp = new ReadyMap.poly2tri_Point(parseFloat(data[index].vertices[i].lon), parseFloat(data[index].vertices[i].lat))
					misDatosTecho.push(temp);
				}				
		}
		
		function createRoofData(data,index,misDatosTecho,roof, last_index,roofOutline){
			
			var misDatosTriangulacion = new Array();
			
			//prepare sweep Context
			var pointsAndEdges = new ReadyMap.poly2tri_SweepContext(misDatosTecho);
        
			// triangulate
			try{
			var triangles = ReadyMap.poly2tri_sweep_Triangulate(pointsAndEdges);//guardamos el array con los puntos, no indices
				
			
			}catch(err){
				console.log('Roof failure creation, building: '+index);
				}
		
			if(triangles){
			var tempChange
			var tempx;
			var tempy;
			
			//finding indices
				for(var i=0 ; i < triangles.length; i++){
				//we change the order of the points that consist a triangle, in order to make the normal point out.
				
					tempChange = triangles[i].points_[2];
						triangles[i].points_[2] = triangles[i].points_[0];
						triangles[i].points_[0] = tempChange;
					
					var check = 0;
					
					for(var j=0; j < 3; j++){
	
						tempx = triangles[i].points_[j].x;
						tempy = triangles[i].points_[j].y;
						for (var k=0 ; k < data[index].vertices.length; k+=2){//k+=2 due to points with same coordinates. The first one is always the one whic carries roof height info
							if((tempx == data[index].vertices[k].lon) && (tempy == data[index].vertices[k].lat )){
								roof.push(last_index + k);// array with triangles indices
								check++;
								break;
							}					
						}
					}
					if (check != 3){
						window.alert('Triangle point retrieving Error. Building: ' + index);
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
		
		var hojas = [];
		var hoja_flag;
		var hoja;
	
		hojas.push(data[0].hoja)
	
		for(var index2=1; index2 < data.length; index2++){
		hoja_flag = false;		
		hoja = data[index2].hoja
		
			for (var i=0; i < hojas.length; i++ ){
				if(hoja == hojas[i]){
					hoja_flag = true;
				}
			}
			
			if(!hoja_flag){
			hojas.push(hoja);
			}		
		}
		
		console.log('Cadaster Sheets : ' + hojas);
		
		for(var index =buil_start ; index < buil_end; index++){
				for(var i=0; i < data[index].vertices.length; i++){
			
				this.heightField.push(parseFloat(data[index].vertices[i].altura) * height_weighting);
        		
                var height = this.heightField[vi];
				var lla = [Math.deg2rad(data[index].vertices[i].lon), Math.deg2rad(data[index].vertices[i].lat), height];
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
				if(color_choice == '1'){
				var color = this.rampColor2(index, height, height_weighting,data[index].hoja, hojas);				
				}
                this.insertArray(color, colors, c);
                c += 4;
				
                vi++;
				n_v++;
	
		}
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
			var lin1 = new osg.DrawElements(gl.LINES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, lines1, 1));
			this.geometry.getPrimitives().push(lin1);
			
			var lin2 = new osg.DrawElements(gl.LINES, new osg.BufferArray(gl.ELEMENT_ARRAY_BUFFER, lines2, 1));
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

		this.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('FRONT')); //culling mode changed to FRONT

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


/* Poly2tri adaptation to ReadyMap by Daniel Gaston
 * Poly2Tri Copyright (c) 2009-2010, Poly2Tri Contributors
 * http://code.google.com/p/poly2tri/
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * * Neither the name of Poly2Tri nor the names of its contributors may be
 *   used to endorse or promote products derived from this software without specific
 *   prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


//Namespace('ReadyMap.poly2tri');


// ------------------------------------------------------------------------Point

ReadyMap.poly2tri_Point = function() {
    this.x = null;
    this.y = null;
    
    if (arguments.length == 0) {
        this.x = 0.0;
        this.y = 0.0;
    } else if (arguments.length == 2) {
        this.x = arguments[0];
        this.y = arguments[1];
    } else {
        alert('Invalid ReadyMap.poly2tri_Point constructor call!');
    }


    // The edges this point constitutes an upper ending point
    this.edge_list = [];


};


/**
 * Set this Point instance to the origo. <code>(0; 0)</code>
 */
ReadyMap.poly2tri_Point.prototype.set_zero = function() {
    this.x = 0.0;
    this.y = 0.0;
};


/**
 * Set the coordinates of this instance.
 * @param   x   number.
 * @param   y   number;
 */
ReadyMap.poly2tri_Point.prototype.set = function(x, y) {
    this.x = x;
    this.y = y;
}


/**
 * Negate this Point instance. (component-wise)
 */
ReadyMap.poly2tri_Point.prototype.negate = function() {
    this.x = -this.x;
    this.y = -this.y;
}


/**
 * Add another Point object to this instance. (component-wise)
 * @param   n   Point object.
 */
ReadyMap.poly2tri_Point.prototype.add = function(n) {
    this.x += n.x;
    this.y += n.y;
}


/**
 * Subtract this Point instance with another point given. (component-wise)
 * @param   n   Point object.
 */
ReadyMap.poly2tri_Point.prototype.sub = function(n) {
    this.x -= n.x;
    this.y -= n.y;
}


/**
 * Multiply this Point instance by a scalar. (component-wise)
 * @param   s   scalar.
 */
ReadyMap.poly2tri_Point.prototype.mul = function(s) {
    this.x *= s;
    this.y *= s;
}


/**
 * Return the distance of this Point instance from the origo.
 */
ReadyMap.poly2tri_Point.prototype.length = function() {
    return Math.sqrt(this.x*this.x + this.y*this.y);
}


/**
 * Normalize this Point instance (as a vector).
 * @return The original distance of this instance from the origo.
 */
ReadyMap.poly2tri_Point.prototype.normalize = function() {
    var len = this.length();
    this.x /= len;
    this.y /= len;
    return len;
}


/**
 * Test this Point object with another for equality.
 * @param   p   Point object.
 * @return <code>True</code> if <code>this == p</code>, <code>false</code> otherwise.
 */
ReadyMap.poly2tri_Point.prototype.equals = function(p) {
    return ReadyMap.poly2tri_equals(this, p);
}


/**
 * Negate a point component-wise and return the result as a new Point object.
 * @param   p   Point object.
 * @return the resulting Point object.
 */
ReadyMap.poly2tri_negate = function(p) {
    return new ReadyMap.poly2tri_Point(-p.x, -p.y);
}


/**
 * Compare two points component-wise.
 * @param   a   Point object.
 * @param   b   Point object.
 * @return <code>-1</code> if <code>a &lt; b</code>, <code>1</code> if
 *         <code>a &gt; b</code>, <code>0</code> otherwise.
 */
ReadyMap.poly2tri_cmp = function(a, b) {
    if (a.y == b.y) {
        return a.x - b.x;
    } else {
        return a.y - b.y;
    }
}


/**
 * Add two points component-wise and return the result as a new Point object.
 * @param   a   Point object.
 * @param   b   Point object.
 * @return the resulting Point object.
 */
ReadyMap.poly2tri_add = function(a, b) {
    return new ReadyMap.poly2tri_Point(a.x+b.x, a.y+b.y);
}


/**
 * Subtract two points component-wise and return the result as a new Point object.
 * @param   a   Point object.
 * @param   b   Point object.
 * @return the resulting Point object.
 */
ReadyMap.poly2tri_sub = function(a, b) {
    return new ReadyMap.poly2tri_Point(a.x-b.x, a.y-b.y);
}


/**
 * Multiply a point by a scalar and return the result as a new Point object.
 * @param   s   the scalar (a number).
 * @param   p   Point object.
 * @return the resulting Point object.
 */
ReadyMap.poly2tri_mul = function(s, p) {
    return new ReadyMap.poly2tri_Point(s*p.x, s*p.y);
}


/**
 * Test two Point objects for equality.
 * @param   a   Point object.
 * @param   b   Point object.
 * @return <code>True</code> if <code>a == b</code>, <code>false</code> otherwise.
 */
ReadyMap.poly2tri_equals = function(a, b) {
    return a.x == b.x && a.y == b.y;
}


/**
 * Peform the dot product on two vectors.
 * @param   a   Point object.
 * @param   b   Point object.
 * @return The dot product (as a number).
 */
ReadyMap.poly2tri_dot = function(a, b) {
    return a.x*b.x + a.y*b.y;
}


/**
 * Perform the cross product on either two points (this produces a scalar)
 * or a point and a scalar (this produces a point).
 * This function requires two parameters, either may be a Point object or a
 * number.
 * @return a Point object or a number, depending on the parameters.
 */
ReadyMap.poly2tri_cross = function() {
    var a0_p = false;
    var a1_p = false;
    if (arguments.length == 2) {
        if (typeof(arguments[0]) == 'number') {
            a0_p = true;
        }
        if (typeof(arguments[1] == 'number')) {
            a1_p = true;
        }


        if (a0_p) {
            if (a1_p) return arguments[0].x*arguments[1].y - arguments[0].y*arguments[1].x;
            else return new ReadyMap.poly2tri_Point(arguments[1]*arguments[0].y, -arguments[1]*arguments[0].x);
        } else {
            if (a1_p) return new ReadyMap.poly2tri_Point(-arguments[0]*arguments[1].y, arguments[0]*arguments[1].x);
            else return arguments[0]*arguments[1];
        }
    } else {
        alert('Invalid ReadyMap.poly2tri_cross call!');
        return undefined;
    }
}




// -------------------------------------------------------------------------Edge
ReadyMap.poly2tri_Edge = function() {
    this.p = null;
    this.q = null;
    
    if (arguments.length == 2) {
        if (arguments[0].y > arguments[1].y) {
            this.q = arguments[0];
            this.p = arguments[1];
        } else if (arguments[0].y == arguments[1].y) {
            if (arguments[0].x > arguments[1].x) {
                this.q = arguments[0];
                this.p = arguments[1];
            } else if (arguments[0].x == arguments[1].x) {
                alert('Invalid ReadyMap.poly2tri_edge constructor call: repeated points!');
            } else {
                this.p = arguments[0];
                this.q = arguments[1];
            }
        } else {
            this.p = arguments[0];
            this.q = arguments[1];
        }
    } else {
        alert('Invalid ReadyMap.poly2tri_Edge constructor call!');
    }


    this.q.edge_list.push(this);
}


// ---------------------------------------------------------------------Triangle
/**
 * Triangle class.<br>
 * Triangle-based data structures are known to have better performance than
 * quad-edge structures.
 * See: J. Shewchuk, "Triangle: Engineering a 2D Quality Mesh Generator and
 * Delaunay Triangulator", "Triangulations in CGAL"
 * 
 * @param   p1  Point object.
 * @param   p2  Point object.
 * @param   p3  Point object.
 */
ReadyMap.poly2tri_Triangle = function(p1, p2, p3) {
    // Triangle points
    this.points_ = [ null, null, null ];
    // Neighbor list
    this.neighbors_ = [ null, null, null ];
    // Has this triangle been marked as an interior triangle?
    this.interior_ = false;
    // Flags to determine if an edge is a Constrained edge
    this.constrained_edge = [ false, false, false ];
    // Flags to determine if an edge is a Delauney edge
    this.delaunay_edge = [ false, false, false ];


    if (arguments.length == 3) {
        this.points_[0] = p1;
        this.points_[1] = p2;
        this.points_[2] = p3;
    }
}


ReadyMap.poly2tri_Triangle.prototype.GetPoint = function(index) {
    return this.points_[index];
}


ReadyMap.poly2tri_Triangle.prototype.GetNeighbor = function(index) {
    return this.neighbors_[index];
}


/**
 * Test if this Triangle contains the Point objects given as parameters as its
 * vertices.
 * @return <code>True</code> if the Point objects are of the Triangle's vertices,
 *         <code>false</code> otherwise.
 */
ReadyMap.poly2tri_Triangle.prototype.ContainsP = function() {
    var back = true;
    for (var aidx=0; aidx < arguments.length; ++aidx) {
        back = back && (arguments[aidx].equals(this.points_[0]) ||
                        arguments[aidx].equals(this.points_[1]) ||
                        arguments[aidx].equals(this.points_[2])
        );
    }
    return back;
}


/**
 * Test if this Triangle contains the Edge objects given as parameters as its
 * bounding edges.
 * @return <code>True</code> if the Edge objects are of the Triangle's bounding
 *         edges, <code>false</code> otherwise.
 */
ReadyMap.poly2tri_Triangle.prototype.ContainsE = function() {
    var back = true;
    for (var aidx=0; aidx < arguments.length; ++aidx) {
        back = back && this.ContainsP(arguments[aidx].p, arguments[aidx].q);
    }
    return back;
}


ReadyMap.poly2tri_Triangle.prototype.IsInterior = function() {
    if (arguments.length == 0) {
        return this.interior_;
    } else {
        this.interior_ = arguments[0];
        return this.interior_;
    }
}


/**
 * Update neighbor pointers.<br>
 * This method takes either 3 parameters (<code>p1</code>, <code>p2</code> and
 * <code>t</code>) or 1 parameter (<code>t</code>).
 * @param   p1  Point object.
 * @param   p2  Point object.
 * @param   t   Triangle object.
 */
ReadyMap.poly2tri_Triangle.prototype.MarkNeighbor = function() {
    var t;
    if (arguments.length == 3) {
        var p1 = arguments[0];
        var p2 = arguments[1];
        t = arguments[2];


        if ((p1.equals(this.points_[2]) && p2.equals(this.points_[1])) || (p1.equals(this.points_[1]) && p2.equals(this.points_[2]))) this.neighbors_[0] = t;
        else if ((p1.equals(this.points_[0]) && p2.equals(this.points_[2])) || (p1.equals(this.points_[2]) && p2.equals(this.points_[0]))) this.neighbors_[1] = t;
        else if ((p1.equals(this.points_[0]) && p2.equals(this.points_[1])) || (p1.equals(this.points_[1]) && p2.equals(this.points_[0]))) this.neighbors_[2] = t;
        else alert('Invalid ReadyMap.poly2tri_Triangle.MarkNeighbor call (1)!');
    } else if (arguments.length == 1) {
        // exhaustive search to update neighbor pointers
        t = arguments[0];
        if (t.ContainsP(this.points_[1], this.points_[2])) {
            this.neighbors_[0] = t;
            t.MarkNeighbor(this.points_[1], this.points_[2], this);
        } else if (t.ContainsP(this.points_[0], this.points_[2])) {
            this.neighbors_[1] = t;
            t.MarkNeighbor(this.points_[0], this.points_[2], this);
        } else if (t.ContainsP(this.points_[0], this.points_[1])) {
            this.neighbors_[2] = t;
            t.MarkNeighbor(this.points_[0], this.points_[1], this);
        }
    } else {
        alert('Invalid ReadyMap.poly2tri_Triangle.MarkNeighbor call! (2)');
    }
}


ReadyMap.poly2tri_Triangle.prototype.ClearNeigbors = function() {
    this.neighbors_[0] = null;
    this.neighbors_[1] = null;
    this.neighbors_[2] = null;
}


ReadyMap.poly2tri_Triangle.prototype.ClearDelunayEdges = function() {
    this.delaunay_edge[0] = false;
    this.delaunay_edge[1] = false;
    this.delaunay_edge[2] = false;
}


/**
 * Return the point clockwise to the given point.
 */
ReadyMap.poly2tri_Triangle.prototype.PointCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.points_[2];
    } else if (p.equals(this.points_[1])) {
        return this.points_[0];
    } else if (p.equals(this.points_[2])) {
        return this.points_[1];
    } else {
        return null;
    }
}


/**
 * Return the point counter-clockwise to the given point.
 */
ReadyMap.poly2tri_Triangle.prototype.PointCCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.points_[1];
    } else if (p.equals(this.points_[1])) {
        return this.points_[2];
    } else if (p.equals(this.points_[2])) {
        return this.points_[0];
    } else {
        return null;
    }
}


/**
 * Return the neighbor clockwise to given point.
 */
ReadyMap.poly2tri_Triangle.prototype.NeighborCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.neighbors_[1];
    } else if (p.equals(this.points_[1])) {
        return this.neighbors_[2];
    } else {
        return this.neighbors_[0];
    }
}


/**
 * Return the neighbor counter-clockwise to given point.
 */
ReadyMap.poly2tri_Triangle.prototype.NeighborCCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.neighbors_[2];
    } else if (p.equals(this.points_[1])) {
        return this.neighbors_[0];
    } else {
        return this.neighbors_[1];
    }
}


ReadyMap.poly2tri_Triangle.prototype.GetConstrainedEdgeCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.constrained_edge[1];
    } else if (p.equals(this.points_[1])) {
        return this.constrained_edge[2];
    } else {
        return this.constrained_edge[0];
    }
}


ReadyMap.poly2tri_Triangle.prototype.GetConstrainedEdgeCCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.constrained_edge[2];
    } else if (p.equals(this.points_[1])) {
        return this.constrained_edge[0];
    } else {
        return this.constrained_edge[1];
    }
}


ReadyMap.poly2tri_Triangle.prototype.SetConstrainedEdgeCW = function(p, ce) {
    if (p.equals(this.points_[0])) {
        this.constrained_edge[1] = ce;
    } else if (p.equals(this.points_[1])) {
        this.constrained_edge[2] = ce;
    } else {
        this.constrained_edge[0] = ce;
    }
}


ReadyMap.poly2tri_Triangle.prototype.SetConstrainedEdgeCCW = function(p, ce) {
    if (p.equals(this.points_[0])) {
        this.constrained_edge[2] = ce;
    } else if (p.equals(this.points_[1])) {
        this.constrained_edge[0] = ce;
    } else {
        this.constrained_edge[1] = ce;
    }
}


ReadyMap.poly2tri_Triangle.prototype.GetDelaunayEdgeCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.delaunay_edge[1];
    } else if (p.equals(this.points_[1])) {
        return this.delaunay_edge[2];
    } else {
        return this.delaunay_edge[0];
    }
}


ReadyMap.poly2tri_Triangle.prototype.GetDelaunayEdgeCCW = function(p) {
    if (p.equals(this.points_[0])) {
        return this.delaunay_edge[2];
    } else if (p.equals(this.points_[1])) {
        return this.delaunay_edge[0];
    } else {
        return this.delaunay_edge[1];
    }
}


ReadyMap.poly2tri_Triangle.prototype.SetDelaunayEdgeCW = function(p, e) {
    if (p.equals(this.points_[0])) {
        this.delaunay_edge[1] = e;
    } else if (p.equals(this.points_[1])) {
        this.delaunay_edge[2] = e;
    } else {
        this.delaunay_edge[0] = e;
    }
}


ReadyMap.poly2tri_Triangle.prototype.SetDelaunayEdgeCCW = function(p, e) {
    if (p.equals(this.points_[0])) {
        this.delaunay_edge[2] = e;
    } else if (p.equals(this.points_[1])) {
        this.delaunay_edge[0] = e;
    } else {
        this.delaunay_edge[1] = e;
    }
}


/**
 * The neighbor across to given point.
 */
ReadyMap.poly2tri_Triangle.prototype.NeighborAcross = function(p) {
    if (p.equals(this.points_[0])) {
        return this.neighbors_[0];
    } else if (p.equals(this.points_[1])) {
        return this.neighbors_[1];
    } else {
        return this.neighbors_[2];
    }
}


ReadyMap.poly2tri_Triangle.prototype.OppositePoint = function(t, p) {
    var cw = t.PointCW(p);
    return this.PointCW(cw);
}


/**
 * Legalize triangle by rotating clockwise.<br>
 * This method takes either 1 parameter (then the triangle is rotated around
 * points(0)) or 2 parameters (then the triangle is rotated around the first
 * parameter).
 */
ReadyMap.poly2tri_Triangle.prototype.Legalize = function() {
    if (arguments.length == 1) {
        this.Legalize(this.points_[0], arguments[0]);
    } else if (arguments.length == 2) {
        var opoint = arguments[0];
        var npoint = arguments[1];


        if (opoint.equals(this.points_[0])) {
            this.points_[1] = this.points_[0];
            this.points_[0] = this.points_[2];
            this.points_[2] = npoint;
        } else if (opoint.equals(this.points_[1])) {
            this.points_[2] = this.points_[1];
            this.points_[1] = this.points_[0];
            this.points_[0] = npoint;
        } else if (opoint.equals(this.points_[2])) {
            this.points_[0] = this.points_[2];
            this.points_[2] = this.points_[1];
            this.points_[1] = npoint;
        } else {
            alert('Invalid ReadyMap.poly2tri_Triangle.Legalize call!');
        }
    } else {
        alert('Invalid ReadyMap.poly2tri_Triangle.Legalize call!');
    }
}


ReadyMap.poly2tri_Triangle.prototype.Index = function(p) {
    if (p.equals(this.points_[0])) return 0;
    else if (p.equals(this.points_[1])) return 1;
    else if (p.equals(this.points_[2])) return 2;
    else return -1;
}


ReadyMap.poly2tri_Triangle.prototype.EdgeIndex = function(p1, p2) {
    if (p1.equals(this.points_[0])) {
        if (p2.equals(this.points_[1])) {
            return 2;
        } else if (p2.equals(this.points_[2])) {
            return 1;
        }
    } else if (p1.equals(this.points_[1])) {
        if (p2.equals(this.points_[2])) {
            return 0;
        } else if (p2.equals(this.points_[0])) {
            return 2;
        }
    } else if (p1.equals(this.points_[2])) {
        if (p2.equals(this.points_[0])) {
            return 1;
        } else if (p2.equals(this.points_[1])) {
            return 0;
        }
    }
    return -1;
}


/**
 * Mark an edge of this triangle as constrained.<br>
 * This method takes either 1 parameter (an edge index or an Edge instance) or
 * 2 parameters (two Point instances defining the edge of the triangle).
 */
ReadyMap.poly2tri_Triangle.prototype.MarkConstrainedEdge = function() {
    if (arguments.length == 1) {
        if (typeof(arguments[0]) == 'number') {
            this.constrained_edge[arguments[0]] = true;
        } else {
            this.MarkConstrainedEdge(arguments[0].p, arguments[0].q);
        }
    } else if (arguments.length == 2) {
        var p = arguments[0];
        var q = arguments[1];
        if ((q.equals(this.points_[0]) && p.equals(this.points_[1])) || (q.equals(this.points_[1]) && p.equals(this.points_[0]))) {
            this.constrained_edge[2] = true;
        } else if ((q.equals(this.points_[0]) && p.equals(this.points_[2])) || (q.equals(this.points_[2]) && p.equals(this.points_[0]))) {
            this.constrained_edge[1] = true;
        } else if ((q.equals(this.points_[1]) && p.equals(this.points_[2])) || (q.equals(this.points_[2]) && p.equals(this.points_[1]))) {
            this.constrained_edge[0] = true;
        }
    } else {
        alert('Invalid ReadyMap.poly2tri_Triangle.MarkConstrainedEdge call!');
    }
}


// ------------------------------------------------------------------------utils
ReadyMap.poly2tri_PI_3div4 = 3 * Math.PI / 4;
ReadyMap.poly2tri_PI_2 = Math.PI / 2;
ReadyMap.poly2tri_EPSILON = 1e-20;


/* 
 * Inital triangle factor, seed triangle will extend 30% of
 * PointSet width to both left and right.
 */
ReadyMap.poly2tri_kAlpha = 0.3;


ReadyMap.poly2tri_Orientation = {
    "CW"        : 1,
    "CCW"       : -1,
    "COLLINEAR" : 0
};


/**
 * Forumla to calculate signed area<br>
 * Positive if CCW<br>
 * Negative if CW<br>
 * 0 if collinear<br>
 * <pre>
 * A[P1,P2,P3]  =  (x1*y2 - y1*x2) + (x2*y3 - y2*x3) + (x3*y1 - y3*x1)
 *              =  (x1-x3)*(y2-y3) - (y1-y3)*(x2-x3)
 * </pre>
 */
ReadyMap.poly2tri_Orient2d = function(pa, pb, pc) {
    var detleft = (pa.x - pc.x) * (pb.y - pc.y);
    var detright = (pa.y - pc.y) * (pb.x - pc.x);
    var val = detleft - detright;
    if (val > -(ReadyMap.poly2tri_EPSILON) && val < (ReadyMap.poly2tri_EPSILON)) {
        return ReadyMap.poly2tri_Orientation.COLLINEAR;
    } else if (val > 0) {
        return ReadyMap.poly2tri_Orientation.CCW;
    } else {
        return ReadyMap.poly2tri_Orientation.CW;
    }
}


ReadyMap.poly2tri_InScanArea = function(pa, pb, pc, pd) {
    var pdx = pd.x;
    var pdy = pd.y;
    var adx = pa.x - pdx;
    var ady = pa.y - pdy;
    var bdx = pb.x - pdx;
    var bdy = pb.y - pdy;


    var adxbdy = adx * bdy;
    var bdxady = bdx * ady;
    var oabd = adxbdy - bdxady;


    if (oabd <= (ReadyMap.poly2tri_EPSILON)) {
        return false;
    }


    var cdx = pc.x - pdx;
    var cdy = pc.y - pdy;


    var cdxady = cdx * ady;
    var adxcdy = adx * cdy;
    var ocad = cdxady - adxcdy;


    if (ocad <= (ReadyMap.poly2tri_EPSILON)) {
        return false;
    }


    return true;
}


// ---------------------------------------------------------------AdvancingFront
ReadyMap.poly2tri_Node = function() {
    this.point = null; // Point
    this.triangle = null; // Triangle


    this.next = null; // Node
    this.prev = null; // Node


    this.value = 0.0; // double


    if (arguments.length == 1) {
        this.point = arguments[0];
        this.value = this.point.x;
    } else if (arguments.length == 2) {
        this.point = arguments[0];
        this.triangle = arguments[1];
        this.value = this.point.x;
    } else {
        alert('Invalid ReadyMap.poly2tri_Node constructor call!');
    }
}


ReadyMap.poly2tri_AdvancingFront = function(head, tail) {
    this.head_ = head; // Node
    this.tail_ = tail; // Node
    this.search_node_ = head; // Node
}


ReadyMap.poly2tri_AdvancingFront.prototype.head = function() {
    return this.head_;
}


ReadyMap.poly2tri_AdvancingFront.prototype.set_head = function(node) {
    this.head_ = node;
}


ReadyMap.poly2tri_AdvancingFront.prototype.tail = function() {
    return this.tail_;
}


ReadyMap.poly2tri_AdvancingFront.prototype.set_tail = function(node) {
    this.tail_ = node;
}


ReadyMap.poly2tri_AdvancingFront.prototype.search = function() {
    return this.search_node_;
}


ReadyMap.poly2tri_AdvancingFront.prototype.set_search = function(node) {
    this.search_node_ = node;
}


ReadyMap.poly2tri_AdvancingFront.prototype.FindSearchNode = function(x) {
    return this.search_node_;
}


ReadyMap.poly2tri_AdvancingFront.prototype.LocateNode = function(x) {
    var node = this.search_node_;


    if (x < node.value) {
        while ((node = node.prev) != null) {
            if (x >= node.value) {
                this.search_node_ = node;
                return node;
            }
        }
    } else {
        while ((node = node.next) != null) {
            if (x < node.value) {
                this.search_node_ = node.prev;
                return node.prev;
            }
        }
    }
    return null;
}


ReadyMap.poly2tri_AdvancingFront.prototype.LocatePoint = function(point) {
    var px = point.x;
    var node = this.FindSearchNode(px);
    var nx = node.point.x;


    if (px == nx) {
        // We might have two nodes with same x value for a short time
        if (point.equals(node.prev.point)) {
            node = node.prev;
        } else if (point.equals(node.next.point)) {
            node = node.next;
        } else if (point.equals(node.point)) {
            // do nothing
        } else {
            alert('Invalid ReadyMap.poly2tri_AdvancingFront.LocatePoint call!');
            return null;
        }
    } else if (px < nx) {
        while ((node = node.prev) != null) {
            if (point.equals(node.point)) break;
        }
    } else {
        while ((node = node.next) != null) {
            if (point.equals(node.point)) break;
        }
    }


    if (node != null) this.search_node_ = node;
    return node;
}


// ------------------------------------------------------------------------Basin
ReadyMap.poly2tri_Basin = function() {
    this.left_node = null; // Node
    this.bottom_node = null; // Node
    this.right_node = null; // Node
    this.width = 0.0; // number
    this.left_highest = false;
}


ReadyMap.poly2tri_Basin.prototype.Clear = function() {
    this.left_node = null;
    this.bottom_node = null;
    this.right_node = null;
    this.width = 0.0;
    this.left_highest = false;
}


// --------------------------------------------------------------------EdgeEvent
ReadyMap.poly2tri_EdgeEvent = function() {
    this.constrained_edge = null; // Edge
    this.right = false;
}


// -----------------------------------------------------------------SweepContext
ReadyMap.poly2tri_SweepContext = function(polyline) {
    this.triangles_ = [];
    this.map_ = [];
    this.points_ = polyline;
    this.edge_list = [];
	this.offsetX = 0;
	this.offsetY = 0;
	
	
	
	
	var xmax = this.points_[0].x;
    var xmin = this.points_[0].x;
    var ymax = this.points_[0].y;
    var ymin = this.points_[0].y;
	


    // Calculate bounds
    for (var i in this.points_) {

        var p = this.points_[i];
        if (p.x > xmax) xmax = p.x;
        if (p.x < xmin) xmin = p.x;
        if (p.y > ymax) ymax = p.y;
        if (p.y < ymin) ymin = p.y;
    }
	//puesto que estamos en coordenadas geograficas, el perimetro con valores negativos tiene q ser pasado a un espacio con coordenadas positivas
	//para hacerlo bien se deberia tener en cuenta las deformaciones geograficas, pero por simplificar NO SE HAN TENIDO EN CUENTA
	
	
	//Desplazamos coordenadas a un espacio de coordenadas positivas
	//ojo pq en Oeste los min y maximos no tienen sentido logico -> xmax = -0.3775 ; xmin = - 0.3655
	var aux; //cambio de min a max para que al hacer el modulo mas tarde, la resta Max - min de la linea 13259 tenga sentido
	if(xmax <0 || xmin <0){
		if(xmax < xmin){this.offsetX = Math.abs(xmax);}
		else{this.offsetX = Math.abs(xmin);}
		aux = xmin;
		xmin = xmax;
		xmax = aux;
		
	}
	
	if(ymax <0 || ymin <0){
		if(ymax < ymin){this.offsetY =Math.abs(ymax);			
		}
		else{this.offsetY = Math.abs(ymin);
		}
		aux = ymin;
		ymin = ymax;
		ymax = aux;
	}
	
	//sumamos los offsets para situar todos los vertices del techo en un espacio postivo
	for (var i in this.points_) {
	
	
		
		this.points_[i].x = (parseFloat(this.points_[i].x) + this.offsetX);
		this.points_[i].y = (parseFloat(this.points_[i].y) + this.offsetY);
	}
	
	//calculamos los limites de nuevo para actualizar valores tras aplicar el offset
	var xmax = this.points_[0].x;
    var xmin = this.points_[0].x;
    var ymax = this.points_[0].y;
    var ymin = this.points_[0].y;
	for (var i in this.points_) {

        var p = this.points_[i];
        if (p.x > xmax) xmax = p.x;
        if (p.x < xmin) xmin = p.x;
        if (p.y > ymax) ymax = p.y;
        if (p.y < ymin) ymin = p.y;
    }
	
	// Advancing front
    this.front_ = null; // AdvancingFront
    // head point used with advancing front
    this.head_ = null; // Point
    // tail point used with advancing front
    this.tail_ = null; // Point
	
	
	//necesitamos pasar los minimos tambien al nuevo espacio
	xmax = Math.abs(xmax);
	xmin = Math.abs(xmin);
	ymax = Math.abs(ymax);
	ymin = Math.abs(ymin);
	
	
	//al hacer el valor absoluto de los valores anteriores, no tiene sentido hacer xmax - xmin pq seria negativo
	
	 
	//Inital triangle factor, seed triangle will extend 30% of
	//PointSet width to both left and right.
	//poly2tri_kAlpha = 0.3 
 
	
	var dx = ReadyMap.poly2tri_kAlpha * (xmax - xmin);
    var dy = ReadyMap.poly2tri_kAlpha * (ymax - ymin);
	
/* 
 * Inital triangle factor, seed triangle will extend 30% of
 * PointSet width to both left and right.
 */
    this.head_ = new ReadyMap.poly2tri_Point(xmax + dx, ymin - dy);
    this.tail_ = new ReadyMap.poly2tri_Point(xmin - dy, ymin - dy);
	
	//A PARTIR DE ESTE PUNTO DEBERIAMOS ESTAR YA TRABAJANDO EN UN ESPACIO POSITIVO
	
	
	
	
	
	
	
/*
    // Advancing front
    this.front_ = null; // AdvancingFront
    // head point used with advancing front
    this.head_ = null; // Point
    // tail point used with advancing front
    this.tail_ = null; // Point
*/

    this.af_head_ = null; // Node
    this.af_middle_ = null; // Node
    this.af_tail_ = null; // Node


    this.basin = new ReadyMap.poly2tri_Basin();
    this.edge_event = new ReadyMap.poly2tri_EdgeEvent();


    this.InitEdges(this.points_);
	
	return this;
}


ReadyMap.poly2tri_SweepContext.prototype.AddHole = function(polyline) {
    this.InitEdges(polyline);
    for (var i in polyline) {
        this.points_.push(polyline[i]);
    }
}


ReadyMap.poly2tri_SweepContext.prototype.front = function() {
    return this.front_;
}


ReadyMap.poly2tri_SweepContext.prototype.point_count = function() {
    return this.points_.length;
}


ReadyMap.poly2tri_SweepContext.prototype.head = function() {
    return this.head_;
}


ReadyMap.poly2tri_SweepContext.prototype.set_head = function(p1) {
    this.head_ = p1;
}


ReadyMap.poly2tri_SweepContext.prototype.tail = function() {
    return this.tail_;
}


ReadyMap.poly2tri_SweepContext.prototype.set_tail = function(p1) {
    this.tail_ = p1;
}


ReadyMap.poly2tri_SweepContext.prototype.GetTriangles = function() {
    return this.triangles_;
}


ReadyMap.poly2tri_SweepContext.prototype.GetMap = function() {
    return this.map_;
}


ReadyMap.poly2tri_SweepContext.prototype.InitTriangulation = function() {
    /*var xmax = this.points_[0].x;
    var xmin = this.points_[0].x;
    var ymax = this.points_[0].y;
    var ymin = this.points_[0].y;
	var offsetX = 0;
	var offsetY = 0;


    // Calculate bounds
    for (var i in this.points_) {

        var p = this.points_[i];
        if (p.x > xmax) xmax = p.x;
        if (p.x < xmin) xmin = p.x;
        if (p.y > ymax) ymax = p.y;
        if (p.y < ymin) ymin = p.y;
    }
	//puesto que estamos en coordenadas geograficas, el perimetro con valores negativos tiene q ser pasado a un espacio con coordenadas positivas
	//para hacerlo bien se deberia tener en cuenta las deformaciones geograficas, pero por simplificar NO SE HAN TENIDO EN CUENTA
	
	
	//Desplazamos coordenadas a un espacio de coordenadas positivas
	//ojo pq en Oeste los min y maximos no tienen sentido logico -> xmax = -0.3775 ; xmin = - 0.3655
	if(xmax <0 || xmin <0){
		if(xmax > xmin){offsetX = Math.abs(xmax);}
		else{offsetX = Math.abs(xmin);}
	}
	
	if(ymax <0 || ymin <0){
		if(ymax > ymin){offsetY =Math.abs(ymax);}
		else{offsetY = Math.abs(ymin);}
	}
	
	//sumamos los offsets para situar todos los vertices del techo en un espacio postivo
	for (var i in this.points_) {
	
	var p = this.points_[i];
		
		this.points_[i].x = (parseFloat(p.x) + offsetX);
		this.points_[i].y = (parseFloat(p.y) + offsetY);
	}
	
	var dx = ReadyMap.poly2tri_kAlpha * (xmax - xmin);
    var dy = ReadyMap.poly2tri_kAlpha * (ymax - ymin);
    this.head_ = new ReadyMap.poly2tri_Point(xmax + dx, ymin - dy);
    this.tail_ = new ReadyMap.poly2tri_Point(xmin - dy, ymin - dy);
	*/
	
	
	
	
	
	
	
	
	
	

    


    // Sort points along y-axis
    this.points_.sort(ReadyMap.poly2tri_cmp);
}


ReadyMap.poly2tri_SweepContext.prototype.InitEdges = function(polyline) {
    for (var i=0; i < polyline.length; ++i) {
        this.edge_list.push(new ReadyMap.poly2tri_Edge(polyline[i], polyline[(i+1) % polyline.length]));
    }
}


ReadyMap.poly2tri_SweepContext.prototype.GetPoint = function(index) {
    return this.points_[index];
}


ReadyMap.poly2tri_SweepContext.prototype.AddToMap = function(triangle) {
    this.map_.push(triangle);
}


ReadyMap.poly2tri_SweepContext.prototype.LocateNode = function(point) {
    return this.front_.LocateNode(point.x);
}


ReadyMap.poly2tri_SweepContext.prototype.CreateAdvancingFront = function() {
    var head;
    var middle;
    var tail;
    // Initial triangle
    var triangle = new ReadyMap.poly2tri_Triangle(this.points_[0], this.tail_, this.head_);


    this.map_.push(triangle);


    head = new ReadyMap.poly2tri_Node(triangle.GetPoint(1), triangle);
    middle = new ReadyMap.poly2tri_Node(triangle.GetPoint(0), triangle);
    tail = new ReadyMap.poly2tri_Node(triangle.GetPoint(2));


    this.front_ = new ReadyMap.poly2tri_AdvancingFront(head, tail);


    head.next = middle;
    middle.next = tail;
    middle.prev = head;
    tail.prev = middle;
}


ReadyMap.poly2tri_SweepContext.prototype.RemoveNode = function(node) {
    // do nothing
}


ReadyMap.poly2tri_SweepContext.prototype.MapTriangleToNodes = function(t) {
    for (var i=0; i<3; ++i) {
        if (t.GetNeighbor(i) == null) {
            var n = this.front_.LocatePoint(t.PointCW(t.GetPoint(i)));
            if (n != null) {
                n.triangle = t;
            }
        }
    }
}


ReadyMap.poly2tri_SweepContext.prototype.RemoveFromMap = function(triangle) {
    for (var i in this.map_) {
        if (this.map_[i] == triangle) {
            delete this.map_[i];
            break;
        }
    }
}


ReadyMap.poly2tri_SweepContext.prototype.MeshClean = function(triangle) {
    if (triangle != null && !triangle.IsInterior()) {
        triangle.IsInterior(true);
        this.triangles_.push(triangle);
        for (var i=0; i<3; ++i) {
            if (!triangle.constrained_edge[i]) {
                this.MeshClean(triangle.GetNeighbor(i));
            }
        }
    }
}


// ------------------------------------------------------------------------Sweep
//Namespace('ReadyMap.poly2tri_sweep');


/**
 * Triangulate simple polygon with holes.
 * @param   tcx SweepContext object.
 */
ReadyMap.poly2tri_sweep_Triangulate = function(tcx) {
    tcx.InitTriangulation();
    tcx.CreateAdvancingFront();
    // Sweep points; build mesh
    ReadyMap.poly2tri_sweep_SweepPoints(tcx);
    // Clean up
    ReadyMap.poly2tri_sweep_FinalizationPolygon(tcx);
	
	//le restamos el offset que metimos en un inicio para volver a los puntos originales
	for (var i in tcx.points_) {
		tcx.points_[i].x = (tcx.points_[i].x - tcx.offsetX);
		tcx.points_[i].y = (tcx.points_[i].y - tcx.offsetY);
	}
	
	//devolvemos el array de puntos que conforman los triangulos
	return tcx.triangles_;
}


ReadyMap.poly2tri_sweep_SweepPoints = function(tcx) {
    for (var i=1; i < tcx.point_count(); ++i) {
        var point = tcx.GetPoint(i);
        var node = ReadyMap.poly2tri_sweep_PointEvent(tcx, point);
        for (var j=0; j < point.edge_list.length; ++j) {
            ReadyMap.poly2tri_sweep_EdgeEvent(tcx, point.edge_list[j], node);
        }
    }
}


ReadyMap.poly2tri_sweep_FinalizationPolygon = function(tcx) {
    // Get an Internal triangle to start with
    var t = tcx.front().head().next.triangle;
    var p = tcx.front().head().next.point;
    while (!t.GetConstrainedEdgeCW(p)) {
        t = t.NeighborCCW(p);
    }


    // Collect interior triangles constrained by edges
    tcx.MeshClean(t);
}


/**
 * Find closes node to the left of the new point and
 * create a new triangle. If needed new holes and basins
 * will be filled to.
 */
ReadyMap.poly2tri_sweep_PointEvent = function(tcx, point) {
    var node = tcx.LocateNode(point);
    var new_node = ReadyMap.poly2tri_sweep_NewFrontTriangle(tcx, point, node);


    // Only need to check +epsilon since point never have smaller
    // x value than node due to how we fetch nodes from the front
    if (point.x <= node.point.x + (ReadyMap.poly2tri_EPSILON)) {
        ReadyMap.poly2tri_sweep_Fill(tcx, node);
    }


    //tcx.AddNode(new_node);


    ReadyMap.poly2tri_sweep_FillAdvancingFront(tcx, new_node);
    return new_node;
}


ReadyMap.poly2tri_sweep_EdgeEvent = function() {
    var tcx;
    if (arguments.length == 3) {
        tcx = arguments[0];
        var edge = arguments[1];
        var node = arguments[2];


        tcx.edge_event.constrained_edge = edge;
        tcx.edge_event.right = (edge.p.x > edge.q.x);


        if (ReadyMap.poly2tri_sweep_IsEdgeSideOfTriangle(node.triangle, edge.p, edge.q)) {
            return;
        }


        // For now we will do all needed filling
        // TODO: integrate with flip process might give some better performance
        //       but for now this avoid the issue with cases that needs both flips and fills
        ReadyMap.poly2tri_sweep_FillEdgeEvent(tcx, edge, node);
        ReadyMap.poly2tri_sweep_EdgeEvent(tcx, edge.p, edge.q, node.triangle, edge.q);
    } else if (arguments.length == 5) {
        tcx = arguments[0];
        var ep = arguments[1];
        var eq = arguments[2];
        var triangle = arguments[3];
        var point = arguments[4];


        if (ReadyMap.poly2tri_sweep_IsEdgeSideOfTriangle(triangle, ep, eq)) {
            return;
        }


        var p1 = triangle.PointCCW(point);
        var o1 = ReadyMap.poly2tri_Orient2d(eq, p1, ep);
        if (o1 == ReadyMap.poly2tri_Orientation.COLLINEAR) {
            alert('ReadyMap.poly2tri_sweep_EdgeEvent: Collinear not supported!');
            return;
        }


        var p2 = triangle.PointCW(point);
        var o2 = ReadyMap.poly2tri_Orient2d(eq, p2, ep);
        if (o2 == ReadyMap.poly2tri_Orientation.COLLINEAR) {
            alert('ReadyMap.poly2tri_sweep_EdgeEvent: Collinear not supported!');
            return;
        }


        if (o1 == o2) {
            // Need to decide if we are rotating CW or CCW to get to a triangle
            // that will cross edge
            if (o1 == ReadyMap.poly2tri_Orientation.CW) {
                triangle = triangle.NeighborCCW(point);
            } else {
                triangle = triangle.NeighborCW(point);
            }
            ReadyMap.poly2tri_sweep_EdgeEvent(tcx, ep, eq, triangle, point);
        } else {
            // This triangle crosses constraint so lets flippin start!
            ReadyMap.poly2tri_sweep_FlipEdgeEvent(tcx, ep, eq, triangle, point);
        }
    } else {
        alert('Invalid ReadyMap.poly2tri_sweep_EdgeEvent call!');
    }
}


ReadyMap.poly2tri_sweep_IsEdgeSideOfTriangle = function(triangle, ep, eq) {
    var index = triangle.EdgeIndex(ep, eq);
    if (index != -1) {
        triangle.MarkConstrainedEdge(index);
        var t = triangle.GetNeighbor(index);
        if (t != null) {
            t.MarkConstrainedEdge(ep, eq);
        }
        return true;
    }
    return false;    
}


ReadyMap.poly2tri_sweep_NewFrontTriangle = function(tcx, point, node) {
    var triangle = new ReadyMap.poly2tri_Triangle(point, node.point, node.next.point);


    triangle.MarkNeighbor(node.triangle);
    tcx.AddToMap(triangle);


    var new_node = new ReadyMap.poly2tri_Node(point);
    new_node.next = node.next;
    new_node.prev = node;
    node.next.prev = new_node;
    node.next = new_node;


    if (!ReadyMap.poly2tri_sweep_Legalize(tcx, triangle)) {
        tcx.MapTriangleToNodes(triangle);
    }


    return new_node;
}


/**
 * Adds a triangle to the advancing front to fill a hole.
 * @param tcx
 * @param node - middle node, that is the bottom of the hole
 */
ReadyMap.poly2tri_sweep_Fill = function(tcx, node) {
    var triangle = new ReadyMap.poly2tri_Triangle(node.prev.point, node.point, node.next.point);


    // TODO: should copy the constrained_edge value from neighbor triangles
    //       for now constrained_edge values are copied during the legalize
    triangle.MarkNeighbor(node.prev.triangle);
    triangle.MarkNeighbor(node.triangle);


    tcx.AddToMap(triangle);


    // Update the advancing front
    node.prev.next = node.next;
    node.next.prev = node.prev;




    // If it was legalized the triangle has already been mapped
    if (!ReadyMap.poly2tri_sweep_Legalize(tcx, triangle)) {
        tcx.MapTriangleToNodes(triangle);
    }


    //tcx.RemoveNode(node);
}


/**
 * Fills holes in the Advancing Front
 */
ReadyMap.poly2tri_sweep_FillAdvancingFront = function(tcx, n) {
    // Fill right holes
    var node = n.next;
    var angle;


    while (node.next != null) {
        angle = ReadyMap.poly2tri_sweep_HoleAngle(node);
        if (angle > ReadyMap.poly2tri_PI_2 || angle < -(ReadyMap.poly2tri_PI_2)) break;
        ReadyMap.poly2tri_sweep_Fill(tcx, node);
        node = node.next;
    }


    // Fill left holes
    node = n.prev;


    while (node.prev != null) {
        angle = ReadyMap.poly2tri_sweep_HoleAngle(node);
        if (angle > ReadyMap.poly2tri_PI_2 || angle < -(ReadyMap.poly2tri_PI_2)) break;
        ReadyMap.poly2tri_sweep_Fill(tcx, node);
        node = node.prev;
    }


    // Fill right basins
    if (n.next != null && n.next.next != null) {
        angle = ReadyMap.poly2tri_sweep_BasinAngle(n);
        if (angle < ReadyMap.poly2tri_PI_3div4) {
            ReadyMap.poly2tri_sweep_FillBasin(tcx, n);
        }
    }
}


ReadyMap.poly2tri_sweep_BasinAngle = function(node) {
    var ax = node.point.x - node.next.next.point.x;
    var ay = node.point.y - node.next.next.point.y;
    return Math.atan2(ay, ax);
}


/**
 *
 * @param node - middle node
 * @return the angle between 3 front nodes
 */
ReadyMap.poly2tri_sweep_HoleAngle = function(node) {
  /* Complex plane
   * ab = cosA +i*sinA
   * ab = (ax + ay*i)(bx + by*i) = (ax*bx + ay*by) + i(ax*by-ay*bx)
   * atan2(y,x) computes the principal value of the argument function
   * applied to the complex number x+iy
   * Where x = ax*bx + ay*by
   *       y = ax*by - ay*bx
   */
  var ax = node.next.point.x - node.point.x;
  var ay = node.next.point.y - node.point.y;
  var bx = node.prev.point.x - node.point.x;
  var by = node.prev.point.y - node.point.y;
  return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
}


/**
 * Returns true if triangle was legalized
 */
ReadyMap.poly2tri_sweep_Legalize = function(tcx, t) {
    // To legalize a triangle we start by finding if any of the three edges
    // violate the Delaunay condition
    for (var i=0; i < 3; ++i) {
        if (t.delaunay_edge[i]) continue;


        var ot = t.GetNeighbor(i);
        if (ot != null) {
            var p = t.GetPoint(i);
            var op = ot.OppositePoint(t, p);
            var oi = ot.Index(op);


            // If this is a Constrained Edge or a Delaunay Edge(only during recursive legalization)
            // then we should not try to legalize
            if (ot.constrained_edge[oi] || ot.delaunay_edge[oi]) {
                t.constrained_edge[i] = ot.constrained_edge[oi];
                continue;
            }


            var inside = ReadyMap.poly2tri_sweep_Incircle(p, t.PointCCW(p), t.PointCW(p), op);
            if (inside) {
                // Lets mark this shared edge as Delaunay
                t.delaunay_edge[i] = true;
                ot.delaunay_edge[oi] = true;


                // Lets rotate shared edge one vertex CW to legalize it
                ReadyMap.poly2tri_sweep_RotateTrianglePair(t, p, ot, op);


                // We now got one valid Delaunay Edge shared by two triangles
                // This gives us 4 new edges to check for Delaunay


                // Make sure that triangle to node mapping is done only one time for a specific triangle
                var not_legalized = !ReadyMap.poly2tri_sweep_Legalize(tcx, t);
                if (not_legalized) {
                    tcx.MapTriangleToNodes(t);
                }


                not_legalized = !ReadyMap.poly2tri_sweep_Legalize(tcx, ot);
                if (not_legalized) tcx.MapTriangleToNodes(ot);


                // Reset the Delaunay edges, since they only are valid Delaunay edges
                // until we add a new triangle or point.
                // XXX: need to think about this. Can these edges be tried after we
                //      return to previous recursive level?
                t.delaunay_edge[i] = false;
                ot.delaunay_edge[oi] = false;


                // If triangle have been legalized no need to check the other edges since
                // the recursive legalization will handles those so we can end here.
                return true;
            }
        }
    }
    return false;
}


/**
 * <b>Requirement</b>:<br>
 * 1. a,b and c form a triangle.<br>
 * 2. a and d is know to be on opposite side of bc<br>
 * <pre>
 *                a
 *                +
 *               / \
 *              /   \
 *            b/     \c
 *            +-------+
 *           /    d    \
 *          /           \
 * </pre>
 * <b>Fact</b>: d has to be in area B to have a chance to be inside the circle formed by
 *  a,b and c<br>
 *  d is outside B if orient2d(a,b,d) or orient2d(c,a,d) is CW<br>
 *  This preknowledge gives us a way to optimize the incircle test
 * @param pa - triangle point, opposite d
 * @param pb - triangle point
 * @param pc - triangle point
 * @param pd - point opposite a
 * @return true if d is inside circle, false if on circle edge
 */
ReadyMap.poly2tri_sweep_Incircle = function(pa, pb, pc, pd) {
    var adx = pa.x - pd.x;
    var ady = pa.y - pd.y;
    var bdx = pb.x - pd.x;
    var bdy = pb.y - pd.y;


    var adxbdy = adx * bdy;
    var bdxady = bdx * ady;
    var oabd = adxbdy - bdxady;


    if (oabd <= 0) return false;


    var cdx = pc.x - pd.x;
    var cdy = pc.y - pd.y;


    var cdxady = cdx * ady;
    var adxcdy = adx * cdy;
    var ocad = cdxady - adxcdy;


    if (ocad <= 0) return false;


    var bdxcdy = bdx * cdy;
    var cdxbdy = cdx * bdy;


    var alift = adx * adx + ady * ady;
    var blift = bdx * bdx + bdy * bdy;
    var clift = cdx * cdx + cdy * cdy;


    var det = alift * (bdxcdy - cdxbdy) + blift * ocad + clift * oabd;
    return det > 0;
}


/**
 * Rotates a triangle pair one vertex CW
 *<pre>
 *       n2                    n2
 *  P +-----+             P +-----+
 *    | t  /|               |\  t |
 *    |   / |               | \   |
 *  n1|  /  |n3           n1|  \  |n3
 *    | /   |    after CW   |   \ |
 *    |/ oT |               | oT \|
 *    +-----+ oP            +-----+
 *       n4                    n4
 * </pre>
 */
ReadyMap.poly2tri_sweep_RotateTrianglePair = function(t, p, ot, op) {
    var n1; var n2; var n3; var n4;
    n1 = t.NeighborCCW(p);
    n2 = t.NeighborCW(p);
    n3 = ot.NeighborCCW(op);
    n4 = ot.NeighborCW(op);


    var ce1; var ce2; var ce3; var ce4;
    ce1 = t.GetConstrainedEdgeCCW(p);
    ce2 = t.GetConstrainedEdgeCW(p);
    ce3 = ot.GetConstrainedEdgeCCW(op);
    ce4 = ot.GetConstrainedEdgeCW(op);


    var de1; var de2; var de3; var de4;
    de1 = t.GetDelaunayEdgeCCW(p);
    de2 = t.GetDelaunayEdgeCW(p);
    de3 = ot.GetDelaunayEdgeCCW(op);
    de4 = ot.GetDelaunayEdgeCW(op);


    t.Legalize(p, op);
    ot.Legalize(op, p);


    // Remap delaunay_edge
    ot.SetDelaunayEdgeCCW(p, de1);
    t.SetDelaunayEdgeCW(p, de2);
    t.SetDelaunayEdgeCCW(op, de3);
    ot.SetDelaunayEdgeCW(op, de4);


    // Remap constrained_edge
    ot.SetConstrainedEdgeCCW(p, ce1);
    t.SetConstrainedEdgeCW(p, ce2);
    t.SetConstrainedEdgeCCW(op, ce3);
    ot.SetConstrainedEdgeCW(op, ce4);


    // Remap neighbors
    // XXX: might optimize the markNeighbor by keeping track of
    //      what side should be assigned to what neighbor after the
    //      rotation. Now mark neighbor does lots of testing to find
    //      the right side.
    t.ClearNeigbors();
    ot.ClearNeigbors();
    if (n1) ot.MarkNeighbor(n1);
    if (n2) t.MarkNeighbor(n2);
    if (n3) t.MarkNeighbor(n3);
    if (n4) ot.MarkNeighbor(n4);
    t.MarkNeighbor(ot);
}


/**
 * Fills a basin that has formed on the Advancing Front to the right
 * of given node.<br>
 * First we decide a left,bottom and right node that forms the
 * boundaries of the basin. Then we do a reqursive fill.
 *
 * @param tcx
 * @param node - starting node, this or next node will be left node
 */
ReadyMap.poly2tri_sweep_FillBasin = function(tcx, node) {
    if (ReadyMap.poly2tri_Orient2d(node.point, node.next.point, node.next.next.point) == ReadyMap.poly2tri_Orientation.CCW) {
        tcx.basin.left_node = node.next.next;
    } else {
        tcx.basin.left_node = node.next;
    }


    // Find the bottom and right node
    tcx.basin.bottom_node = tcx.basin.left_node;
    while (tcx.basin.bottom_node.next != null && tcx.basin.bottom_node.point.y >= tcx.basin.bottom_node.next.point.y) {
        tcx.basin.bottom_node = tcx.basin.bottom_node.next;
    }
    if (tcx.basin.bottom_node == tcx.basin.left_node) {
        // No valid basin
        return;
    }


    tcx.basin.right_node = tcx.basin.bottom_node;
    while (tcx.basin.right_node.next != null && tcx.basin.right_node.point.y < tcx.basin.right_node.next.point.y) {
        tcx.basin.right_node = tcx.basin.right_node.next;
    }
    if (tcx.basin.right_node == tcx.basin.bottom_node) {
        // No valid basins
        return;
    }


    tcx.basin.width = tcx.basin.right_node.point.x - tcx.basin.left_node.point.x;
    tcx.basin.left_highest = tcx.basin.left_node.point.y > tcx.basin.right_node.point.y;


    ReadyMap.poly2tri_sweep_FillBasinReq(tcx, tcx.basin.bottom_node);
}


/**
 * Recursive algorithm to fill a Basin with triangles
 *
 * @param tcx
 * @param node - bottom_node
 */
ReadyMap.poly2tri_sweep_FillBasinReq = function(tcx, node) {
    // if shallow stop filling
    if (ReadyMap.poly2tri_sweep_IsShallow(tcx, node)) {
        return;
    }


    ReadyMap.poly2tri_sweep_Fill(tcx, node);


    var o;
    if (node.prev == tcx.basin.left_node && node.next == tcx.basin.right_node) {
        return;
    } else if (node.prev == tcx.basin.left_node) {
        o = ReadyMap.poly2tri_Orient2d(node.point, node.next.point, node.next.next.point);
        if (o == ReadyMap.poly2tri_Orientation.CW) {
            return;
        }
        node = node.next;
    } else if (node.next == tcx.basin.right_node) {
        o = ReadyMap.poly2tri_Orient2d(node.point, node.prev.point, node.prev.prev.point);
        if (o == ReadyMap.poly2tri_Orientation.CCW) {
            return;
        }
        node = node.prev;
    } else {
        // Continue with the neighbor node with lowest Y value
        if (node.prev.point.y < node.next.point.y) {
            node = node.prev;
        } else {
            node = node.next;
        }
    }


    ReadyMap.poly2tri_sweep_FillBasinReq(tcx, node);
}


ReadyMap.poly2tri_sweep_IsShallow = function(tcx, node) {
    var height;
    if (tcx.basin.left_highest) {
        height = tcx.basin.left_node.point.y - node.point.y;
    } else {
        height = tcx.basin.right_node.point.y - node.point.y;
    }


    // if shallow stop filling
    if (tcx.basin.width > height) {
        return true;
    }
    return false;
}


ReadyMap.poly2tri_sweep_FillEdgeEvent = function(tcx, edge, node) {
    if (tcx.edge_event.right) {
        ReadyMap.poly2tri_sweep_FillRightAboveEdgeEvent(tcx, edge, node);
    } else {
        ReadyMap.poly2tri_sweep_FillLeftAboveEdgeEvent(tcx, edge, node);
    }
}


ReadyMap.poly2tri_sweep_FillRightAboveEdgeEvent = function(tcx, edge, node) {
    while (node.next.point.x < edge.p.x) {
        // Check if next node is below the edge
        if (ReadyMap.poly2tri_Orient2d(edge.q, node.next.point, edge.p) == ReadyMap.poly2tri_Orientation.CCW) {
            ReadyMap.poly2tri_sweep_FillRightBelowEdgeEvent(tcx, edge, node);
        } else {
            node = node.next;
        }
    }
}


ReadyMap.poly2tri_sweep_FillRightBelowEdgeEvent = function(tcx, edge, node) {
    if (node.point.x < edge.p.x) {
        if (ReadyMap.poly2tri_Orient2d(node.point, node.next.point, node.next.next.point) == ReadyMap.poly2tri_Orientation.CCW) {
            // Concave
            ReadyMap.poly2tri_sweep_FillRightConcaveEdgeEvent(tcx, edge, node);
        } else{
            // Convex
            ReadyMap.poly2tri_sweep_FillRightConvexEdgeEvent(tcx, edge, node);
            // Retry this one
            ReadyMap.poly2tri_sweep_FillRightBelowEdgeEvent(tcx, edge, node);
        }
    }
}


ReadyMap.poly2tri_sweep_FillRightConcaveEdgeEvent = function(tcx, edge, node) {
    ReadyMap.poly2tri_sweep_Fill(tcx, node.next);
    if (node.next.point != edge.p) {
        // Next above or below edge?
        if (ReadyMap.poly2tri_Orient2d(edge.q, node.next.point, edge.p) == ReadyMap.poly2tri_Orientation.CCW) {
            // Below
            if (ReadyMap.poly2tri_Orient2d(node.point, node.next.point, node.next.next.point) == ReadyMap.poly2tri_Orientation.CCW) {
                // Next is concave
                ReadyMap.poly2tri_sweep_FillRightConcaveEdgeEvent(tcx, edge, node);
            } else {
            // Next is convex
            }
        }
    }
}


ReadyMap.poly2tri_sweep_FillRightConvexEdgeEvent = function(tcx, edge, node) {
    // Next concave or convex?
    if (ReadyMap.poly2tri_Orient2d(node.next.point, node.next.next.point, node.next.next.next.point) == ReadyMap.poly2tri_Orientation.CCW) {
        // Concave
        ReadyMap.poly2tri_sweep_FillRightConcaveEdgeEvent(tcx, edge, node.next);
    } else {
        // Convex
        // Next above or below edge?
        if (ReadyMap.poly2tri_Orient2d(edge.q, node.next.next.point, edge.p) == ReadyMap.poly2tri_Orientation.CCW) {
            // Below
            ReadyMap.poly2tri_sweep_FillRightConvexEdgeEvent(tcx, edge, node.next);
        } else {
            // Above
        }
    }
}


ReadyMap.poly2tri_sweep_FillLeftAboveEdgeEvent = function(tcx, edge, node) {
    while (node.prev.point.x > edge.p.x) {
        // Check if next node is below the edge
        if (ReadyMap.poly2tri_Orient2d(edge.q, node.prev.point, edge.p) == ReadyMap.poly2tri_Orientation.CW) {
            ReadyMap.poly2tri_sweep_FillLeftBelowEdgeEvent(tcx, edge, node);
        } else {
            node = node.prev;
        }
    }
}


ReadyMap.poly2tri_sweep_FillLeftBelowEdgeEvent = function(tcx, edge, node) {
    if (node.point.x > edge.p.x) {
        if (ReadyMap.poly2tri_Orient2d(node.point, node.prev.point, node.prev.prev.point) == ReadyMap.poly2tri_Orientation.CW) {
            // Concave
            ReadyMap.poly2tri_sweep_FillLeftConcaveEdgeEvent(tcx, edge, node);
        } else {
            // Convex
            ReadyMap.poly2tri_sweep_FillLeftConvexEdgeEvent(tcx, edge, node);
            // Retry this one
            ReadyMap.poly2tri_sweep_FillLeftBelowEdgeEvent(tcx, edge, node);
        }
    }
}


ReadyMap.poly2tri_sweep_FillLeftConvexEdgeEvent = function(tcx, edge, node) {
    // Next concave or convex?
    if (ReadyMap.poly2tri_Orient2d(node.prev.point, node.prev.prev.point, node.prev.prev.prev.point) == ReadyMap.poly2tri_Orientation.CW) {
        // Concave
        ReadyMap.poly2tri_sweep_FillLeftConcaveEdgeEvent(tcx, edge, node.prev);
    } else {
        // Convex
        // Next above or below edge?
        if (ReadyMap.poly2tri_Orient2d(edge.q, node.prev.prev.point, edge.p) == ReadyMap.poly2tri_Orientation.CW) {
            // Below
            ReadyMap.poly2tri_sweep_FillLeftConvexEdgeEvent(tcx, edge, node.prev);
        } else {
            // Above
        }
    }
}


ReadyMap.poly2tri_sweep_FillLeftConcaveEdgeEvent = function(tcx, edge, node) {
    ReadyMap.poly2tri_sweep_Fill(tcx, node.prev);
    if (node.prev.point != edge.p) {
        // Next above or below edge?
        if (ReadyMap.poly2tri_Orient2d(edge.q, node.prev.point, edge.p) == ReadyMap.poly2tri_Orientation.CW) {
            // Below
            if (ReadyMap.poly2tri_Orient2d(node.point, node.prev.point, node.prev.prev.point) == ReadyMap.poly2tri_Orientation.CW) {
                // Next is concave
                ReadyMap.poly2tri_sweep_FillLeftConcaveEdgeEvent(tcx, edge, node);
            } else {
                // Next is convex
            }
        }
    }
}


ReadyMap.poly2tri_sweep_FlipEdgeEvent = function(tcx, ep, eq, t, p) {
    var ot = t.NeighborAcross(p);
    if (ot == null) {
        // If we want to integrate the fillEdgeEvent do it here
        // With current implementation we should never get here
        alert('[BUG:FIXME] FLIP failed due to missing triangle!');
        return;
    }
    var op = ot.OppositePoint(t, p);


    if (ReadyMap.poly2tri_InScanArea(p, t.PointCCW(p), t.PointCW(p), op)) {
        // Lets rotate shared edge one vertex CW
        ReadyMap.poly2tri_sweep_RotateTrianglePair(t, p, ot, op);
        tcx.MapTriangleToNodes(t);
        tcx.MapTriangleToNodes(ot);


        if (p == eq && op == ep) {
            if (eq == tcx.edge_event.constrained_edge.q && ep == tcx.edge_event.constrained_edge.p) {
                t.MarkConstrainedEdge(ep, eq);
                ot.MarkConstrainedEdge(ep, eq);
                ReadyMap.poly2tri_sweep_Legalize(tcx, t);
                ReadyMap.poly2tri_sweep_Legalize(tcx, ot);
            } else {
                // XXX: I think one of the triangles should be legalized here?
            }
        } else {
            var o = ReadyMap.poly2tri_Orient2d(eq, op, ep);
            t = ReadyMap.poly2tri_sweep_NextFlipTriangle(tcx, o, t, ot, p, op);
            ReadyMap.poly2tri_sweep_FlipEdgeEvent(tcx, ep, eq, t, p);
        }
    } else {
        var newP = ReadyMap.poly2tri_sweep_NextFlipPoint(ep, eq, ot, op);
        ReadyMap.poly2tri_sweep_FlipScanEdgeEvent(tcx, ep, eq, t, ot, newP);
        ReadyMap.poly2tri_sweep_EdgeEvent(tcx, ep, eq, t, p);
    }
}


ReadyMap.poly2tri_sweep_NextFlipTriangle = function(tcx, o, t, ot, p, op) {
    var edge_index;
    if (o == ReadyMap.poly2tri_Orientation.CCW) {
        // ot is not crossing edge after flip
        edge_index = ot.EdgeIndex(p, op);
        ot.delaunay_edge[edge_index] = true;
        ReadyMap.poly2tri_sweep_Legalize(tcx, ot);
        ot.ClearDelunayEdges();
        return t;
    }


    // t is not crossing edge after flip
    edge_index = t.EdgeIndex(p, op);


    t.delaunay_edge[edge_index] = true;
    ReadyMap.poly2tri_sweep_Legalize(tcx, t);
    t.ClearDelunayEdges();
    return ot;
}


ReadyMap.poly2tri_sweep_NextFlipPoint = function(ep, eq, ot, op) {
    var o2d = ReadyMap.poly2tri_Orient2d(eq, op, ep);
    if (o2d == ReadyMap.poly2tri_Orientation.CW) {
        // Right
        return ot.PointCCW(op);
    } else if (o2d == ReadyMap.poly2tri_Orientation.CCW) {
        // Left
        return ot.PointCW(op);
    } else {
        alert("[Unsupported] ReadyMap.poly2tri_sweep_NextFlipPoint: opposing point on constrained edge!");
        return undefined;
    }
}


ReadyMap.poly2tri_sweep_FlipScanEdgeEvent = function(tcx, ep, eq, flip_triangle, t, p) {
    var ot = t.NeighborAcross(p);


    if (ot == null) {
        // If we want to integrate the fillEdgeEvent do it here
        // With current implementation we should never get here
        alert('[BUG:FIXME] FLIP failed due to missing triangle');
        return;
    }
    var op = ot.OppositePoint(t, p);


    if (ReadyMap.poly2tri_InScanArea(eq, flip_triangle.PointCCW(eq), flip_triangle.PointCW(eq), op)) {
        // flip with new edge op.eq
        ReadyMap.poly2tri_sweep_FlipEdgeEvent(tcx, eq, op, ot, op);
        // TODO: Actually I just figured out that it should be possible to
        //       improve this by getting the next ot and op before the the above
        //       flip and continue the flipScanEdgeEvent here
        // set new ot and op here and loop back to inScanArea test
        // also need to set a new flip_triangle first
        // Turns out at first glance that this is somewhat complicated
        // so it will have to wait.
    } else {
        var newP = NextFlipPoint(ep, eq, ot, op);
        ReadyMap.poly2tri_sweep_FlipScanEdgeEvent(tcx, ep, eq, flip_triangle, ot, newP);
    }
}
