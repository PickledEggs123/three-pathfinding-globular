import { BufferAttribute, BufferGeometry } from 'three';

class Utils {

  static roundNumber (value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  static sample (list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  static distanceToSquared (a, b) {

    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;

    return dx * dx + dy * dy + dz * dz;

  }

  //+ Jonas Raoni Soares Silva
  //@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
  static isPointInPoly (poly, pt) {
      const dotArray = [];
      for (let i = 0; i < poly.length; i++) {
          const a = poly[i];
          const b = poly[(i + 1) % poly.length];
          const cross = new THREE.Vector3().crossVectors(a, b);
          const dot = cross.clone().dot(pt.clone());
          dotArray.push(dot);
      }
      return dotArray.every(dot => dot >= 0) || dotArray.every(dot => dot <= 0);
  }

  static isVectorInPolygon (vector, polygon, vertices) {

    // reference point will be the centroid of the polygon
    // We need to rotate the vector as well as all the points which the polygon uses

    var lowestPoint = 100000;
    var highestPoint = -100000;

    var polygonVertices = [];

    polygon.vertexIds.forEach((vId) => {
      lowestPoint = Math.min(vertices[vId].length(), lowestPoint);
      highestPoint = Math.max(vertices[vId].length(), highestPoint);
      polygonVertices.push(vertices[vId]);
    });

    if (vector.length() < highestPoint + 0.5 && vector.length() > lowestPoint - 0.5 &&
      this.isPointInPoly(polygonVertices, vector)) {
      return true;
    }
    return false;
  }

  static triarea2 (a, b, c) {
    /*
     * Determinant
     * |  x  y  z |
     * | ax ay az |
     * | bx by bz |
     */
    // make two vectors for determinant
    var ax = b.x - a.x;
    var ay = b.y - a.y;
    var az = b.z - a.z;
    var bx = c.x - a.x;
    var by = c.y - a.y;
    var bz = c.z - a.z;

    // make basis matrix for sphere
    var aVec = new THREE.Vector3().set(ax, ay, az).normalize();
    var bVec = new THREE.Vector3().set(bx, by, bz).normalize();
    var basisY = aVec.clone().normalize();
    var basisZ = a.clone().normalize();
    var basisX = new THREE.Vector3().crossVectors(basisY, basisZ);
    var basis = new THREE.Matrix4().makeBasis(basisX, basisY, basisZ).invert();

    // apply basis matrix
    aVec = aVec.applyMatrix4(basis);
    bVec = bVec.applyMatrix4(basis);
    ax = aVec.x;
    ay = aVec.y;
    az = aVec.z;
    bx = bVec.x;
    by = bVec.y;
    bz = bVec.z;

    let det = ay * bz + az * bx + ax * by - ax * bz - ay * bx - az * by;
    if (isNaN(det)) {
      return 0;
    }
    if (aVec.dot(bVec) < 0) {
      det += Math.sign(det);
    }
    return det;
  }

  static vequal (a, b) {
    return this.distanceToSquared(a, b) < 0.00001;
  }

  /**
   * Modified version of BufferGeometryUtils.mergeVertices, ignoring vertex
   * attributes other than position.
   *
   * @param {THREE.BufferGeometry} geometry
   * @param {number} tolerance
   * @return {THREE.BufferGeometry>}
   */
  static mergeVertices (geometry, tolerance = 1e-4) {

    tolerance = Math.max( tolerance, Number.EPSILON );

    // Generate an index buffer if the geometry doesn't have one, or optimize it
    // if it's already available.
    var hashToIndex = {};
    var indices = geometry.getIndex();
    var positions = geometry.getAttribute( 'position' );
    var vertexCount = indices ? indices.count : positions.count;

    // Next value for triangle indices.
    var nextIndex = 0;

    var newIndices = [];
    var newPositions = [];

    // Convert the error tolerance to an amount of decimal places to truncate to.
    var decimalShift = Math.log10( 1 / tolerance );
    var shiftMultiplier = Math.pow( 10, decimalShift );

    for ( var i = 0; i < vertexCount; i ++ ) {

      var index = indices ? indices.getX( i ) : i;

      // Generate a hash for the vertex attributes at the current index 'i'.
      var hash = '';

      // Double tilde truncates the decimal value.
      hash += `${ ~ ~ ( positions.getX( index ) * shiftMultiplier ) },`;
      hash += `${ ~ ~ ( positions.getY( index ) * shiftMultiplier ) },`;
      hash += `${ ~ ~ ( positions.getZ( index ) * shiftMultiplier ) },`;

      // Add another reference to the vertex if it's already
      // used by another index.
      if ( hash in hashToIndex ) {

        newIndices.push( hashToIndex[ hash ] );

      } else {

        newPositions.push( positions.getX( index ) );
        newPositions.push( positions.getY( index ) );
        newPositions.push( positions.getZ( index ) );

        hashToIndex[ hash ] = nextIndex;
        newIndices.push( nextIndex );
        nextIndex ++;

      }

    }

    // Construct merged BufferGeometry.

    const positionAttribute = new BufferAttribute(
      new Float32Array( newPositions ),
      positions.itemSize,
      positions.normalized
    );

    const result = new BufferGeometry();
    result.setAttribute( 'position', positionAttribute );
    result.setIndex( newIndices );

    return result;

  }
}

export { Utils };
