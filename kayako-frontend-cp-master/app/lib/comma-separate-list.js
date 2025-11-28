export default function commaSeparateList(list) {
  return list.split(/[ ,\n]/).filter(x => x).join(',');
}
