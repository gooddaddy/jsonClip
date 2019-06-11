//作者:liyubo
//基于doxl修改,原库地址： https://github.com/doxl/doxl
//功能，实现了 类似 grahlql 一样 基于查询 裁剪对象
//注意：内部保留原作者所有子功能函数，但是不完全支持原有功能,因为本库致力于实现pojo的裁剪转换功能
//添加path的 操作（ 使用 key: '.' ）方式可以替代原作者 的doxl.any()针对pojo数据的裁剪功能
const get = require("./getValue").default;


class Variable {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }

    valueOf() {
        return this.value;
    }

    toJSON() {
        return this.value;
    }
}

class Skip {
    constructor(count) {
        this.count = count;
    }
}

class Slice {
    constructor(count) {
        this.count = count;
    }
}

const doxl = (query,
              source,
              {partial, constructorMatch, transform, schema} = {},
              variables = {}) => {
    let skip = 0;

    return Object.keys(query).reduce((accum, key, i) => {
        let qvalue = skip ? query[i + skip] : query[key],
            qtype = typeof qvalue,
            //add by bobo
            svalue = skip ? source[i + skip] : source[key],
            stype = typeof svalue;

        if (Array.isArray(source)) {
            return doxl.reduce(source, query);
        }

        if (
            Array.isArray(svalue) &&
            qtype !== "string" &&
            qvalue.name !== "dot"
        ) {
            qtype = "function";
            const _qvalue = qvalue;
            qvalue = (sourceValue, key, source, query) => {
                return doxl.reduce(sourceValue, _qvalue);
            };
        } else if (qtype === "string") {
            qtype = "function";
            const dotPath = qvalue;
            qvalue = _dot(dotPath);
        }

        if (
            qvalue === undefined ||
            (svalue === undefined && qtype !== "function")
        ) {
            return accum;
        }
        if (
            qvalue &&
            qtype === "object" &&
            (qvalue instanceof Skip || qvalue instanceof Slice)
        ) {
            if (isNaN(qvalue.count)) {
                qvalue.count = source.length - i - (query.length - i) + 1;
            }
            if (qvalue instanceof Slice) {
                accum || (accum = []);
                accum = accum.concat(source.slice(i, i + qvalue.count));
                key = i + qvalue.count;
            }
            skip += qvalue.count;
            qvalue = svalue = source[i + qvalue.count];
            qtype = stype = typeof svalue;
        }
        let value = qvalue,
            vtype = typeof value;
        if (
            qvalue === undefined ||
            (svalue === undefined && qtype !== "function")
        ) {
            return accum;
        } else if (qtype === "function") {
            value = qvalue.call(source, svalue, key, source, query);
            console.log("value:", value);
        } else if (stype === "function") {
            value = svalue.call(
                source,
                ...(Array.isArray(value) ? value : [value])
            );
            if (value !== undefined) {
                accum || (accum = Array.isArray(query) ? [] : {});
                accum[key] = value;
            } else if (!partial) {
                return null;
            }
            return accum;
        }
        if (value instanceof Variable) {
            if (variables[value.name] === undefined) {
                variables[value.name] = svalue;
            }
            value.value = variables[value.name];
            if (variables[value.name] !== svalue) {
                if (!partial) {
                    return null;
                }
                return accum;
            }
            value = svalue;
            vtype = stype;
        }
        if (
            value !== "undefined" &&
            svalue &&
            qtype === "object" &&
            vtype === "object"
        ) {
            if (constructorMatch && svalue.constructor !== value.constructor) {
                return;
            }
            if (value instanceof Date) {
                if (stype instanceof Date && svalue.getTime() === value.getTime()) {
                    accum || (accum = Array.isArray(query) ? [] : {});
                    accum[key] = svalue;
                } else if (!partial) {
                    return null;
                }
                return accum;
            }
            if (value instanceof RegExp) {
                if (
                    svalue instanceof RegExp &&
                    svalue.flags == value.flags &&
                    svalue.source === value.source
                ) {
                    accum || (accum = Array.isArray(query) ? [] : {});
                    accum[key] = svalue;
                } else if (!partial) {
                    return null;
                }
                return accum;
            }
            if (value instanceof Array) {
                if (svalue instanceof Array && svalue.length === value.length) {
                    const subdoc = doxl(
                        value,
                        svalue,
                        {partial, constructorMatch, transform, schema},
                        variables
                    );
                    if (subdoc !== null) {
                        accum || (accum = Array.isArray(query) ? [] : {});
                        accum[key] = subdoc;
                    } else if (!partial) {
                        return null;
                    }
                } else if (!partial) {
                    return null;
                }
                return accum;
            }
            if (value instanceof Set || value instanceof Map) {
                if (
                    svalue.constructor === value.constructor &&
                    svalue.size === value.size
                ) {
                    const values = value.values(),
                        svalues = svalue.values();
                    if (
                        values.every(value => {
                            return svalues.some(svalue => {
                                return doxl(
                                    value,
                                    svalue,
                                    {partial, constructorMatch, transform, schema},
                                    variables
                                );
                            });
                        })
                    ) {
                        accum || (accum = Array.isArray(query) ? [] : {});
                        accum[key] = svalue;
                    } else if (!partial) {
                        return null;
                    }
                }
                return accum;
            }
            const subdoc = doxl(
                value,
                svalue,
                {partial, constructorMatch, transform, schema},
                variables
            );
            if (subdoc !== null) {
                accum || (accum = Array.isArray(query) ? [] : {});
                accum[key] = subdoc;
            } else if (!partial) {
                return null;
            }
            return accum;
        }
        if (qtype === "function") {
            if (
                qvalue.name === "any" ||
                qvalue.name === "undfnd" ||
                qvalue.name === "dot" ||
                value !== undefined /*&& value !== false*/
            ) {
                // allow zero
                accum || (accum = Array.isArray(query) ? [] : {});
                accum[key] =
                    qvalue.name === "any" ||
                    qvalue.name === "undfnd" ||
                    qvalue.name === "dot" ||
                    transform
                        ? value
                        : svalue;
            } else if (!partial) {
                return null;
            }
            return accum;
        }
        if (value === svalue) {
            accum || (accum = Array.isArray(query) ? [] : {});
            accum[key] = svalue;
        } else if (!partial) {
            return null;
        }
        return accum;
    }, null);
};

const _dot = (dotPath, defaultValue, queryx) =>
    function dot(sourceValue, key, source, query) {
        const qvalue = dotPath;
        let value;
        if (qvalue.startsWith(".")) {
            if (qvalue === ".") {
                value = sourceValue;
            }
            const dotPath = qvalue.substr(1);
            if (dotPath.length > 0) {
                value = get(sourceValue, dotPath, defaultValue);
            }
        } else {
            value = get(source, qvalue, defaultValue);
        }
        value = typeof value === "undefined" ? defaultValue : value;
        if (queryx && value) {
            if (typeof queryx === 'function') {
                //使支持对基础类型进行转换（使用提供的function转换，value为当前key对应的value）
                value = queryx.call(source, value, key, source, query);
            }
            else {
                value = doxl(queryx, value, {transform: true, partial: true}) || value;
            }
        }
        return value;
    };

doxl.dot = _dot;
doxl.any = (...args) =>
    function any(sourceValue) {
        return typeof sourceValue === "function"
            ? sourceValue.call(this, ...args)
            : sourceValue;
    };
doxl.undefined = (deflt, ...args) =>
    function undfnd(sourceValue) {
        let value =
            typeof sourceValue === "function"
                ? sourceValue.call(this, ...args)
                : sourceValue;
        return value === undefined ? deflt : value;
    };
doxl.var = name => new Variable(name);
doxl.skip = count => new Skip(count);
doxl.slice = count => new Slice(count);
doxl.ANY = doxl.any;
doxl.UNDEFINED = doxl.undefined;
const _reduce = (array, query) => {
    let result = array.reduce((accum, item) => {
        const match = doxl(query, item, {transform: true, partial: true});
        if (typeof match !== "undefined") accum.push(match);
        return accum;
    }, []);
    return result;
};
doxl.reduce = _reduce;
const d2 = (query, source) =>
    doxl(query, source, {transform: true, partial: true});
Object.assign(d2, doxl);
// if (typeof module !== "undefined") module.exports = d2;
// if (typeof window !== "undefined") window.doxl = d2;

export default d2;