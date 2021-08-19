export default function dataHost() {
  const THECLOUD = 'thecloud.seis.sc.edu';
  const EEYORE = 'eeyore.seis.sc.edu';
  const LOCALHOST = 'localhost';
  const loadedURL = new URL(window.location.href);
  if (loadedURL.hostname === THECLOUD) {
    return THECLOUD;
  } else if (loadedURL.hostname === LOCALHOST) {
    return THECLOUD;
  } else {
    return EEYORE;
  }
}
