export default function (str, pad = '00') {
  str = String(str);
  return pad.substring(0, pad.length - str.length) + str;
}
