// exportBVH_threejs.js
// Converts MediaPipe poseWorldLandmarks to BVH with proper joint orientation
// Requires Three.js (for quaternion and Euler math)

import * as THREE from 'three';

// Map each joint to its parent for computing local rotations
const jointHierarchy = {
  pelvis: null,
  spine_01: 'pelvis',
  spine_02: 'spine_01',
  spine_03: 'spine_02',
  neck_01: 'spine_03',
  head: 'neck_01',

  clavicle_l: 'spine_03',
  upperarm_l: 'clavicle_l',
  lowerarm_l: 'upperarm_l',
  hand_l: 'lowerarm_l',

  clavicle_r: 'spine_03',
  upperarm_r: 'clavicle_r',
  lowerarm_r: 'upperarm_r',
  hand_r: 'lowerarm_r',

  thigh_l: 'pelvis',
  calf_l: 'thigh_l',
  foot_l: 'calf_l',
  ball_l: 'foot_l',

  thigh_r: 'pelvis',
  calf_r: 'thigh_r',
  foot_r: 'calf_r',
  ball_r: 'foot_r',
};

const jointIndices = {
  // Root pelvis (average of left & right hips)
  pelvis: [23, 24],

  // Spine chain upward
  spine_01: [23, 11],       // From left hip to left shoulder — rough spine base
  spine_02: [11, 0],        // From left shoulder to head base (nose root)
  spine_03: [11, 12],       // Between shoulders — approximating upper spine/shoulder line

  // Neck and head (facing forward)
  neck_01: [11, 0],         // From left shoulder to nose
  head: [0, 3],             // Nose to left eye outer (forward gaze direction)

  // Left Arm
  clavicle_l: [11, 13],     // Shoulder to elbow (approx clavicle)
  upperarm_l: [13, 15],     // Elbow to wrist
  lowerarm_l: [15, 19],     // Wrist to left index
  hand_l: [19, 21],         // Index to thumb tip (simulate palm roll)

  // Right Arm
  clavicle_r: [12, 14],     // Shoulder to elbow
  upperarm_r: [14, 16],     // Elbow to wrist
  lowerarm_r: [16, 20],     // Wrist to right index
  hand_r: [20, 22],         // Index to thumb tip

  // Left Leg
  thigh_l: [23, 25],        // Hip to knee
  calf_l: [25, 27],         // Knee to ankle
  foot_l: [27, 31],         // Ankle to foot index (toes)
  ball_l: [31, 29],         // Foot index to heel

  // Right Leg
  thigh_r: [24, 26],        // Hip to knee
  calf_r: [26, 28],         // Knee to ankle
  foot_r: [28, 32],         // Ankle to foot index (toes)
  ball_r: [32, 30],         // Foot index to heel
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
ROOT pelvis
{
  OFFSET 0.000000 0.000000 0.000000
  CHANNELS 6 Xposition Yposition Zposition Xrotation Yrotation Zrotation

  JOINT spine_01
  {
    OFFSET 0.000000 10.000000 0.000000
    CHANNELS 3 Xrotation Yrotation Zrotation

    JOINT spine_02
    {
      OFFSET 0.000000 10.000000 0.000000
      CHANNELS 3 Xrotation Yrotation Zrotation

      JOINT spine_03
      {
        OFFSET 0.000000 10.000000 0.000000
        CHANNELS 3 Xrotation Yrotation Zrotation

        JOINT neck_01
        {
          OFFSET 0.000000 10.000000 0.000000
          CHANNELS 3 Xrotation Yrotation Zrotation

          JOINT head
          {
            OFFSET 0.000000 10.000000 0.000000
            CHANNELS 3 Xrotation Yrotation Zrotation
            End Site
            {
              OFFSET 0.000000 5.000000 0.000000
            }
          }
        }
      }
    }
  }

  JOINT clavicle_l
  {
    OFFSET 5.000000 9.000000 0.000000
    CHANNELS 3 Xrotation Yrotation Zrotation

    JOINT upperarm_l
    {
      OFFSET 10.000000 0.000000 0.000000
      CHANNELS 3 Xrotation Yrotation Zrotation

      JOINT lowerarm_l
      {
        OFFSET 15.000000 0.000000 0.000000
        CHANNELS 3 Xrotation Yrotation Zrotation

        JOINT hand_l
        {
          OFFSET 15.000000 0.000000 0.000000
          CHANNELS 3 Xrotation Yrotation Zrotation
          End Site
          {
            OFFSET 5.000000 0.000000 0.000000
          }
        }
      }
    }
  }

  JOINT clavicle_r
  {
    OFFSET -5.000000 9.000000 0.000000
    CHANNELS 3 Xrotation Yrotation Zrotation

    JOINT upperarm_r
    {
      OFFSET -10.000000 0.000000 0.000000
      CHANNELS 3 Xrotation Yrotation Zrotation

      JOINT lowerarm_r
      {
        OFFSET -15.000000 0.000000 0.000000
        CHANNELS 3 Xrotation Yrotation Zrotation

        JOINT hand_r
        {
          OFFSET -15.000000 0.000000 0.000000
          CHANNELS 3 Xrotation Yrotation Zrotation
          End Site
          {
            OFFSET -5.000000 0.000000 0.000000
          }
        }
      }
    }
  }

  JOINT thigh_l
  {
    OFFSET 5.000000 -10.000000 0.000000
    CHANNELS 3 Xrotation Yrotation Zrotation

    JOINT calf_l
    {
      OFFSET 0.000000 -30.000000 0.000000
      CHANNELS 3 Xrotation Yrotation Zrotation

      JOINT foot_l
      {
        OFFSET 0.000000 -20.000000 5.000000
        CHANNELS 3 Xrotation Yrotation Zrotation

        JOINT ball_l
        {
          OFFSET 5.000000 0.000000 0.000000
          CHANNELS 3 Xrotation Yrotation Zrotation
          End Site
          {
            OFFSET 5.000000 0.000000 0.000000
          }
        }
      }
    }
  }

  JOINT thigh_r
  {
    OFFSET -5.000000 -10.000000 0.000000
    CHANNELS 3 Xrotation Yrotation Zrotation

    JOINT calf_r
    {
      OFFSET 0.000000 -30.000000 0.000000
      CHANNELS 3 Xrotation Yrotation Zrotation

      JOINT foot_r
      {
        OFFSET 0.000000 -20.000000 5.000000
        CHANNELS 3 Xrotation Yrotation Zrotation

        JOINT ball_r
        {
          OFFSET -5.000000 0.000000 0.000000
          CHANNELS 3 Xrotation Yrotation Zrotation
          End Site
          {
            OFFSET -5.000000 0.000000 0.000000
          }
        }
      }
    }
  }
}`;
  let motion = `MOTION\nFrames: ${frames.length}\nFrame Time: 0.0333333\n`;

  for (const frame of frames) {
    const flatPose = [];

    // Hip center (23 + 24) / 2
    const hips = {
      x: (frame[23].x + frame[24].x) / 2 * 100,
      y: (frame[23].y + frame[24].y) / 2 * 100,
      z: (frame[23].z + frame[24].z) / 2 * 100
    };
    flatPose.push(hips.x, hips.y, hips.z);

    for (const joint of jointNames) {
      const [fromIdx, toIdx] = jointIndices[joint];
      const from = frame[fromIdx] || { x: 0, y: 0, z: 0 };
      const to = frame[toIdx] || { x: 0, y: 0, z: 0 };

      const rotation = computeEuler(from, to); // XYZ
      flatPose.push(...rotation);
    }

    motion += toLine(flatPose) + '\n';
  }

  const fullBVH = header + '\n' + motion;
  const blob = new Blob([fullBVH], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'corrected_manny.bvh';
  a.click();
  URL.revokeObjectURL(a.href);
}
