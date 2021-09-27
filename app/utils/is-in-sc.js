const SCBoxArea = {
  minLat: 31.75,
  maxLat: 35.5,
  minLon: -84,
  maxLon: -78
}

export default function isInSC(lat, lon) {
  return SCBoxArea.minLat <= lat && lat <= SCBoxArea.maxLat &&
    SCBoxArea.minLon <= lon && lon <= SCBoxArea.maxLon;
}
