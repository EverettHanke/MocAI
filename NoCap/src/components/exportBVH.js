// exportBVH.js
// Converts MediaPipe poseWorldLandmarks to UE5 Mannequin-approximate BVH format

function computeRotation(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

  const x = dx / length;
  const y = dy / length;
  const z = dz / length;

  // Approximate X-Y-Z rotation order
  const Xrot = Math.atan2(y, z) * (180 / Math.PI);
  const Yrot = Math.atan2(z, x) * (180 / Math.PI);
  const Zrot = Math.atan2(x, y) * (180 / Math.PI);

  return [Xrot, Yrot, Zrot];
}

export function exportBVH(frames) {
  if (!frames || frames.length === 0) return;

  const jointMap = {
    pelvis: [23, 24],
    spine_01: [23, 11],
    spine_02: [11, 0],
    spine_03: [0, 0],
    clavicle_l: [11, 13],
    upperarm_l: [13, 15],
    lowerarm_l: [15, 17],
    hand_l: [17, 19],
    clavicle_r: [12, 14],
    upperarm_r: [14, 16],
    lowerarm_r: [16, 18],
    hand_r: [18, 20],
    neck_01: [0, 1],
    head: [1, 3],
    thigh_l: [23, 25],
    calf_l: [25, 27],
    foot_l: [27, 31],
    ball_l: [31, 32],
    thigh_r: [24, 26],
    calf_r: [26, 28],
    foot_r: [28, 30],
    ball_r: [30, 32]
  };

  function toLine(arr, digits = 6) {
    return arr.map(x => x.toFixed(digits)).join(' ');
  }

  const header = `
HIERARCHY
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
}
`;

  let motion = `MOTION\nFrames: ${frames.length}\nFrame Time: 0.0333333\n`;

  for (const frame of frames) {
    const hips = frame[23] && frame[24]
      ? {
          x: (frame[23].x + frame[24].x) / 2 * 100,
          y: (frame[23].y + frame[24].y) / 2 * 100,
          z: (frame[23].z + frame[24].z) / 2 * 100
        }
      : { x: 0, y: 0, z: 0 };

    const flatPose = [hips.x, hips.y, hips.z];

    for (const jointName of Object.keys(jointMap)) {
      const [fromIdx, toIdx] = jointMap[jointName];
      const from = frame[fromIdx] || { x: 0, y: 0, z: 0 };
      const to = frame[toIdx] || { x: 0, y: 0, z: 0 };

      const rotation = computeRotation(from, to); // X, Y, Z order
      flatPose.push(...rotation);
    }

    motion += toLine(flatPose) + '\n';
  }

  const fullBVH = header + motion;
  const blob = new Blob([fullBVH], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'manny_fixed_xyz.bvh';
  a.click();
  URL.revokeObjectURL(url);
}
