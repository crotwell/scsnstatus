export default function dataHost() {
  const THECLOUD = 'thecloud.seis.sc.edu';
  const EEYORE = 'eeyore.seis.sc.edu';
  const THECLOUD_DIRECT = 'li1043-95.members.linode.com';
  const LOCALHOST = 'localhost';
  const loadedURL = new URL(window.location.href);
  if (loadedURL.hostname === THECLOUD || loadedURL.hostname === THECLOUD_DIRECT) {
    return THECLOUD_DIRECT;
  } else if (loadedURL.hostname === LOCALHOST) {
    return THECLOUD_DIRECT;
  } else {
    return EEYORE;
  }
}
