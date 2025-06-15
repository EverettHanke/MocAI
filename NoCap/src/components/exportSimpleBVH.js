// exportBVH_blazepose.js
// Exports a minimal working BVH file from BlazePose landmarks
import * as THREE from 'three';

// Define simplified BlazePose skeleton
const jointHierarchy = {
  root: null,

  spine: 'root',
  chest: 'spine',
  head: 'chest',

  upperarm_l: 'chest',
  lowerarm_l: 'upperarm_l',
  hand_l: 'lowerarm_l',

  upperarm_r: 'chest',
  lowerarm_r: 'upperarm_r',
  hand_r: 'lowerarm_r',

  thigh_l: 'root',
  calf_l: 'thigh_l',
  foot_l: 'calf_l',

  thigh_r: 'root',
  calf_r: 'thigh_r',
  foot_r: 'calf_r'
};

const jointIndices = {
  root: [23, 24],
  spine: [23, 11],
  chest: [11, 0],
  head: [0, 1],

  upperarm_l: [11, 13],
  lowerarm_l: [13, 15],
  hand_l: [15, 19],

  upperarm_r: [12, 14],
  lowerarm_r: [14, 16],
  hand_r: [16, 20],

  thigh_l: [23, 25],
  calf_l: [25, 27],
  foot_l: [27, 31],

  thigh_r: [24, 26],
  calf_r: [26, 28],
  foot_r: [28, 30]
};

function computeEuler(from, to, order = 'XYZ') {
  const dir = new THREE.Vector3(to.x - from.x, to.y - from.y, to.z - from.z).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
  const euler = new THREE.Euler().setFromQuaternion(quat, order);
  return [euler.x, euler.y, euler.z].map(THREE.MathUtils.radToDeg);
}

function toLine(arr, digits = 6) {
  return arr.map(x => x.toFixed(digits)).join(' ');
}

export function exportBVH(frames) {
  if (!frames?.length) return;

  const jointNames = Object.keys(jointHierarchy);

  const header = `HIERARCHY
ROOT root
{
  OFFSET 0.00 0.00 0.00
  CHANNELS 6 Xposition Yposition Zposition Xrotation Yrotation Zrotation

  JOINT spine
  {
    OFFSET 0.00 10.00 0.00
    CHANNELS 3 Xrotation Yrotation Zrotation

    JOINT chest
    {
      OFFSET 0.00 10.00 0.00
      CHANNELS 3 Xrotation Yrotation Zrotation

      JOINT head
      {
        OFFSET 0.00 10.00 0.00
        CHANNELS 3 Xrotation Yrotation Zrotation
        End Site
        {
          OFFSET 0.00 5.00 0.00
        }
      }

      JOINT upperarm_l
      {
        OFFSET 5.00 0.00 0.00
        CHANNELS 3 Xrotation Yrotation Zrotation

        JOINT lowerarm_l
        {
          OFFSET 10.00 0.00 0.00
          CHANNELS 3 Xrotation Yrotation Zrotation

          JOINT hand_l
          {
            OFFSET 10.00 0.00 0.00
            CHANNELS 3 Xrotation Yrotation Zrotation
            End Site
            {
              OFFSET 5.00 0.00 0.00
            }
          }
        }
      }

      JOINT upperarm_r
      {
        OFFSET -5.00 0.00 0.00
        CHANNELS 3 Xrotation Yrotation Zrotation

        JOINT lowerarm_r
        {
          OFFSET -10.00 0.00 0.00
          CHANNELS 3 Xrotation Yrotation Zrotation

          JOINT hand_r
          {
            OFFSET -10.00 0.00 0.00
            CHANNELS 3 Xrotation Yrotation Zrotation
            End Site
            {
              OFFSET -5.00 0.00 0.00
            }
          }
        }
      }
    }
  }

  JOINT thigh_l
  {
    OFFSET 5.00 -10.00 0.00
    CHANNELS 3 Xrotation Yrotation Zrotation

    JOINT calf_l
    {
      OFFSET 0.00 -30.00 0.00
      CHANNELS 3 Xrotation Yrotation Zrotation

      JOINT foot_l
      {
        OFFSET 0.00 -20.00 10.00
        CHANNELS 3 Xrotation Yrotation Zrotation
        End Site
        {
          OFFSET 0.00 -5.00 5.00
        }
      }
    }
  }

  JOINT thigh_r
  {
    OFFSET -5.00 -10.00 0.00
    CHANNELS 3 Xrotation Yrotation Zrotation

    JOINT calf_r
    {
      OFFSET 0.00 -30.00 0.00
      CHANNELS 3 Xrotation Yrotation Zrotation

      JOINT foot_r
      {
        OFFSET 0.00 -20.00 10.00
        CHANNELS 3 Xrotation Yrotation Zrotation
        End Site
        {
          OFFSET 0.00 -5.00 5.00
        }
      }
    }
  }
}`;

  let motion = `MOTION\nFrames: ${frames.length}\nFrame Time: 0.0333333\n`;

  for (const frame of frames) {
    const flatPose = [];

    // Root position (hip center average)
    const hips = {
      x: ((frame[23]?.x || 0) + (frame[24]?.x || 0)) / 2 * 100,
      y: ((frame[23]?.y || 0) + (frame[24]?.y || 0)) / 2 * 100,
      z: ((frame[23]?.z || 0) + (frame[24]?.z || 0)) / 2 * 100
    };
    flatPose.push(hips.x, hips.y, hips.z);

    // Root rotation and all others
    for (const joint of jointNames) {
      const pair = jointIndices[joint];
      const from = frame[pair?.[0]] || { x: 0, y: 0, z: 0 };
      const to = frame[pair?.[1]] || { x: 0, y: 1, z: 0 };
      const rot = computeEuler(from, to);
      flatPose.push(...rot);
    }

    motion += toLine(flatPose) + '\n';
  }

  const fullBVH = header + '\n' + motion;
  const blob = new Blob([fullBVH], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'blazepose_simple.bvh';
  a.click();
  URL.revokeObjectURL(a.href);
}
