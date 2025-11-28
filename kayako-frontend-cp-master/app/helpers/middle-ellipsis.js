import Helper from '@ember/component/helper';

export function middleEllipsis(text, {startPart}) {
    let str = String(text);

    let start = str.substr(0, Math.ceil(str.length / 2));
    let end = str.substr(Math.ceil(str.length / 2));

    return startPart ? start : end;
}

export default Helper.helper(middleEllipsis);
