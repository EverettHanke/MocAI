// utils/exportBVH.js
export function exportBVH(frames, frameRate = 30) {
  if (!frames.length || frames[0].length < 33) {
    console.error("Insufficient or invalid pose data.");
    return;
  }

  const jointOrder = [
    "Hips", "Spine", "Chest", "Neck", "Head",
    "LeftShoulder", "LeftElbow", "LeftWrist",
    "RightShoulder", "RightElbow", "RightWrist",
    "LeftHip", "LeftKnee", "LeftAnkle",
    "RightHip", "RightKnee", "RightAnkle",
  ];

  // Basic skeleton (flat and generic)
  const header = `HIERARCHY
ROOT Hips
{
  OFFSET 0 0 0
  CHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation
  JOINT Chest
  {
    OFFSET 0 10 0
    CHANNELS 3 Zrotation Xrotation Yrotation
    JOINT Head
    {
      OFFSET 0 10 0
      CHANNELS 3 Zrotation Xrotation Yrotation
    }
  }
  JOINT LeftUpLeg
  {
    OFFSET -5 -10 0
    CHANNELS 3 Zrotation Xrotation Yrotation
    JOINT LeftLeg
    {
      OFFSET 0 -10 0
      CHANNELS 3 Zrotation Xrotation Yrotation
    }
  }
  JOINT RightUpLeg
  {
    OFFSET 5 -10 0
    CHANNELS 3 Zrotation Xrotation Yrotation
    JOINT RightLeg
    {
      OFFSET 0 -10 0
      CHANNELS 3 Zrotation Xrotation Yrotation
    }
  }
}
`;

  const motionHeader = `MOTION
Frames: ${frames.length}
Frame Time: ${(1 / frameRate).toFixed(5)}
`;

  const motionData = frames.map((frame) => {
    const hips = frame[0]; // Assume 0 is hips
    const chest = frame[11];
    const head = frame[0]; // MediaPipe lacks reliable head rotation
    const leftHip = frame[23];
    const leftKnee = frame[25];
    const rightHip = frame[24];
    const rightKnee = frame[26];

    return [
      (hips.x * 100).toFixed(2), // Xpos
      (hips.y * 100).toFixed(2), // Ypos
      (hips.z * 100).toFixed(2), // Zpos
      "0 0 0",                   // Zrotation Xrotation Yrotation (placeholders)
      "0 0 0",                   // Chest
      "0 0 0",                   // Head
      "0 0 0",                   // LeftUpLeg
      "0 0 0",                   // LeftLeg
      "0 0 0",                   // RightUpLeg
      "0 0 0",                   // RightLeg
    ].join(" ");
  }).join("\n");

  const fullBVH = header + motionHeader + motionData;

  const blob = new Blob([fullBVH], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'motion_capture.bvh';
  a.click();
  URL.revokeObjectURL(url);
}
