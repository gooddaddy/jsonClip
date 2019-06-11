## 简介

json-clip 实现了类似grahlql基于查询裁剪对象的功能

## 特性
1.声明式写法 
2.结构化查询语句 
3.支持路径查找对象
4.支持数组对象裁剪
5.支持数组第n项裁剪
6.辅助工具: [d2-pojo裁剪](https://n34q9n4y2j.codesandbox.io/)


##使用方式
```
  var d2 = require('json-clip');
  const data = d2(query, source);
  //data为查询后的数据
  
  查询支持：路径查询 如：'a.b.c'，其中'.'表示当前路径，那就是当前key
  路径查询，操作函数： d2.dot(path,defaultValue,queryobj);
```

## 使用例子
```
//源数据
{
  smaple: "1",
  list: [
    {
      first: 1,
      seconde: 2,
      three: {
        h: 1,
        g: "ff"
      }
    },
    {
      first: 1,
      seconde: 2,
      three: {
        h: 2,
        g: "ffg"
      }
    }
  ],
  data: {
    smaple: "1",
    smapleObje: {
      x: "xxx",
      a: {
        wo: "123"
      },
      b: {
        wo: "123"
      }
    },
    list: [{ first: "list1", seconde: 2 }, { first: 1, seconde: 2 }],
    obx: {
      limit: 1,
      offset: 2,
      items: [
        {
          monther: "nilaomao",
          father: "nidaye"
        },
        {
          monther: "nilaomao",
          father: "nidaye"
        }
      ]
    }
  },
  array: {
    limit: 1,
    offset: 2,
    items: [
      {
        monther: "nilaomao",
        father: "nidaye"
      },
      {
        monther: "nilaomao2",
        father: "nidaye2"
      }
    ]
  }
}
```

## 查询

##### 1.单间数据抽取
```
const query1 = {
  smaple: "."
};
```
结果：
{
    "smaple": "1"
}

##### 2.生成数据抽取，保持原有数据层次
```
const query2 = {
  data: {
    smapleObje: "."
  }
};
```
结果：
{
    "data": {
        "smapleObje": {
            "x": "xxx",
            "a": {
                "wo": "123"
            },
            "b": {
                "wo": "123"
            }
        }
    }
}

##### 3.数组内抽取
```
const query3 = {
  array: {
    items: {
      monther: "."
    }
  }
};
```
结果：
{
    "array": {
        "items": [
            {
                "monther": "nilaomao"
            },
            {
                "monther": "nilaomao2"
            }
        ]
    }
}

##### 4.数组第n项目抽取
```
const query4 = {
  array: ".items.0"
};
```
结果：
{
    "array": {
        "monther": "nilaomao",
        "father": "nidaye"
    }
}

##### 5.数组第n项目抽取后再裁剪
```
const query5 = {
  array: d2.dot(".items.1", null, {
    monther: "."
  })
};
```
结果：
{
    "array": {
        "monther": "nilaomao2"
    }
}

##### 6.数组第n项目抽取后再裁剪&转换
```
const query5_1 = {
  array: d2.dot(".items.1", null, {
    monther: value => "妈妈" + value
  })
};
```
结果：
{
    "array": {
        "monther": "妈妈nilaomao2"
    }
}


##### 7.额外元素新增（新增的元素不能原有同层元素同名），新增元素查询path不能 . 开头
```
const query6 = {
  bobocustom: "data.smapleObje"
};
```
结果：{
       "bobocustom": {
           "x": "xxx",
           "a": {
               "wo": "123"
           },
           "b": {
               "wo": "123"
           }
       }
   }

##### 8.额外元素新增，并裁剪
```
const query7 = {
  bobocustom: d2.dot("data.smapleObje", null, { a: "." })
};
```
结果：{
       "bobocustom": {
           "a": {
               "wo": "123"
           }
       }
   }


##### 9.额外元素新增
```
const query8 = {
  xxx: d2.dot(".", [{ four: 10 }, { four: 11 }, { four: 12 }])
};
```
结果：{
       "xxx": [
           {
               "four": 10
           },
           {
               "four": 11
           },
           {
               "four": 12
           }
       ]
   }

##### 10.额外元素抽取生成数组数据并裁剪数组元素
```
const query9 = {
  bobocustom: d2.dot("data.list", null, {
    first: d2.any() /*d2.any()等同于 ‘.’ */
  })
};
```
结果：{
       "bobocustom": [
           {
               "first": "list1"
           },
           {
               "first": 1
           }
       ]
   }


##### 11.数据转换
```
const query10 = {
  smaple: value => value + "mmm"
};
```
结果：
    "smaple": "1mmm"
}

##### 12.数组元数据 裁剪&转换，value代表 key 在原source中的值
```
const query11 = {
  bobocustom: d2.dot("data.list", null, {
    first: value => undefined, //和直接不写first 这节点一样
    seconde: "."
  })
};
```
结果：{
       "bobocustom": [
           {
               "seconde": 2
           },
           {
               "seconde": 2
           }
       ]
   }

