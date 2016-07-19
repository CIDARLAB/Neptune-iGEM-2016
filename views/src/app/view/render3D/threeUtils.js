function mergeGeometries(geometries){
	var merged = new THREE.Geometry();
	for (var i =0 ;i < geometries.length; i++){
		merged.merge(geometries[i]);
	}
	return merged;
}

module.exports.mergeGeometries = mergeGeometries;