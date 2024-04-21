import { Utils } from './Utils';

class Channel {
  constructor () {
    this.portals = [];
  }

  push (p1, p2) {
    if (p2 === undefined) p2 = p1;
    this.portals.push({
      left: p1,
      right: p2
    });
  }

  stringPull () {
    const portals = this.portals;
    const pts = [];
    // Init scan state
    let portalApex, portalLeft, portalRight;
    let apexIndex = 0,
      leftIndex = 0,
      rightIndex = 0;

    portalApex = portals[0].left;
    portalLeft = portals[0].left;
    portalRight = portals[0].right;

    // Add start point.
    pts.push(portalApex);

    for (let i = 1; i < portals.length; i++) {
      const left = portals[i].left;
      const right = portals[i].right;

      // Update right vertex.
      if (Utils.triarea2(portalApex, portalRight, right) <= 0.0) {
        if (Utils.vequal(portalApex, portalRight) || Utils.triarea2(portalApex, portalLeft, right) > 0.0) {
          // Tighten the funnel.
          portalRight = right;
          rightIndex = i;
        } else {
          // Right over left, insert left to path and restart scan from portal left point.
          pts.push(portalLeft);
          // Make current left the new apex.
          portalApex = portalLeft;
          apexIndex = leftIndex;
          // Reset portal
          portalLeft = portalApex;
          portalRight = portalApex;
          leftIndex = apexIndex;
          rightIndex = apexIndex;
          // Restart scan
          i = apexIndex;
          continue;
        }
      }

      // Update left vertex.
      if (Utils.triarea2(portalApex, portalLeft, left) >= 0.0) {
        if (Utils.vequal(portalApex, portalLeft) || Utils.triarea2(portalApex, portalRight, left) < 0.0) {
          // Tighten the funnel.
          portalLeft = left;
          leftIndex = i;
        } else {
          // Left over right, insert right to path and restart scan from portal right point.
          pts.push(portalRight);
          // Make current right the new apex.
          portalApex = portalRight;
          apexIndex = rightIndex;
          // Reset portal
          portalLeft = portalApex;
          portalRight = portalApex;
          leftIndex = apexIndex;
          rightIndex = apexIndex;
          // Restart scan
          i = apexIndex;
          continue;
        }
      }

      pts.push([left, right]);
    }

    if ((pts.length === 0) || (!Utils.vequal(pts[pts.length - 1], portals[portals.length - 1].left))) {
      // Append last point to path.
      pts.push(portals[portals.length - 1].left);
    }

    // convert array of left right to left right prev next
    let prevPoint = pts[0];
    let nextPoint = pts[pts.length - 1];
    for (let i = 0; i < pts.length; i++) {
      const item = pts[i];
      if (item instanceof Array) {
        item.push(prevPoint);
      } else {
        prevPoint = item;
      }
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const item = pts[i];
      if (item instanceof Array) {
        item.push(nextPoint);
      } else {
        nextPoint = item;
      }
    }

    // solve skew line equations
    for (let i = 0; i < pts.length; i++) {
      const item = pts[i];
      if (item instanceof Array) {
        const [left, right, prev, next] = item;
        const p1 = left;
        const p2 = prev;
        const d1 = right.clone().sub(left.clone());
        const d2 = next.clone().sub(prev.clone());
        const n = new THREE.Vector3().crossVectors(d1, d2);
        const n2 = new THREE.Vector3().crossVectors(d2.clone(), n.clone());
        const top = (p2.clone().sub(p1.clone())).dot(n2);
        const bottom = d1.dot(n2);
        if (bottom === 0) {
          pts.splice(i, 1, null);
        } else {
          const c1 = p1.clone().add(d1.clone().multiplyScalar(top / bottom));
          pts.splice(i, 1, c1);
        }
      }
    }

    this.path = pts.filter(x => !!x).reduce((acc, v) => Utils.vequal(acc[acc.length - 1], v) ? acc : [...acc, v], [pts[0]]);
    return pts;
  }
}

export { Channel };
