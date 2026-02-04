import { BinaryHeap } from './BinaryHeap';
import { Utils } from './Utils.js';

class AStar {
  static init (graph) {
    for (let x = 0; x < graph.length; x++) {
      //for(var x in graph) {
      const node = graph[x];
      node.f = 0;
      node.g = 0;
      node.h = 0;
      node.cost = 1.0;
      node.visited = false;
      node.closed = false;
      node.parent = null;
    }
  }

  static cleanUp (graph) {
    for (let x = 0; x < graph.length; x++) {
      const node = graph[x];
      delete node.f;
      delete node.g;
      delete node.h;
      delete node.cost;
      delete node.visited;
      delete node.closed;
      delete node.parent;
    }
  }

  static heap () {
    return new BinaryHeap(function (node) {
      return node.f;
    });
  }

  static search (graph, start, end, vertices) {
    this.init(graph);
    //heuristic = heuristic || astar.manhattan;


    const openHeap = this.heap();

    openHeap.push(start);

    while (openHeap.size() > 0) {

      // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
      const currentNode = openHeap.pop();

      // End case -- result has been found, return the traced path.
      if (currentNode === end) {
        let curr = currentNode;
        const ret = [];
        while (curr.parent) {
          ret.push(curr);
          curr = curr.parent;
        }
        this.cleanUp(ret);
        return ret.reverse();
      }

      // Normal case -- move currentNode from open to closed, process each of its neighbours.
      currentNode.closed = true;

      // Find all neighbours for the current node. Optionally find diagonal neighbours as well (false by default).
      const neighbours = this.neighbours(graph, currentNode);

      for (let i = 0, il = neighbours.length; i < il; i++) {
        const neighbour = neighbours[i];

        if (neighbour.closed) {
          // Not a valid node to process, skip to next neighbour.
          continue;
        }

        // The g score is the shortest distance from start to current node.
        // We need to check if the path we have arrived at this neighbour is the shortest one we have seen yet.
        const gScore = currentNode.g + neighbour.cost;
        const beenVisited = neighbour.visited;

        if (!beenVisited || gScore < neighbour.g) {

          // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
          neighbour.visited = true;
          neighbour.parent = currentNode;
          if (!neighbour.centroid || !end.centroid) throw new Error('Unexpected state');
          neighbour.h = neighbour.h || this.heuristic(neighbour, end.centroid, currentNode.centroid, vertices);
          neighbour.g = gScore;
          neighbour.f = neighbour.g + neighbour.h;

          if (!beenVisited) {
            // Pushing to heap will put it in proper place based on the 'f' value.
            openHeap.push(neighbour);
          } else {
            // Already seen the node, but since it has been rescored we need to reorder it in the heap
            openHeap.rescoreElement(neighbour);
          }
        }
      }
    }

    // No result was found - empty array signifies failure to find path.
    return [];
  }

  static heuristic (neighbor, endPos, currentPos, vertices) {
    const neighbourVector = neighbor.centroid.clone().sub(endPos.clone());
    const currentVector = currentPos.clone().sub(endPos.clone());
    const v = neighbor.vertexIds.map(vid => vertices[vid].clone());

    const edges = v.map((edge, index, arr) => [edge, arr[(index + 1) % arr.length]]);
    const line = currentPos.clone().normalize().cross(endPos.clone().normalize());
    const intersects = edges.map(([a, b]) => {
      const c = a.clone().normalize().cross(b.clone().normalize());
      const cIntersect = c.clone().cross(line.clone());
      const intersect = cIntersect.distanceTo(a) < cIntersect.clone().negate().distanceTo(a) ? cIntersect.clone() : cIntersect.clone().negate();
      const aa = a.clone().normalize();
      const bb = b.clone().normalize();
      return new THREE.Quaternion().setFromUnitVectors(aa, intersect).multiply(new THREE.Quaternion().setFromUnitVectors(intersect, bb)).angleTo(new THREE.Quaternion().setFromUnitVectors(aa, bb)) < Math.PI / 100;
    });
    const hasIntersect = intersects.some(x => x);

    return Math.sqrt(Utils.distanceToSquared(neighbor.centroid, endPos)) + (!hasIntersect ? 1000 : 0);
    //return Utils.distanceToSquared(pos1, pos2);
  }

  static neighbours (graph, node) {
    const ret = [];

    for (let e = 0; e < node.neighbours.length; e++) {
      ret.push(graph[node.neighbours[e]]);
    }

    return ret;
  }
}

export { AStar };
