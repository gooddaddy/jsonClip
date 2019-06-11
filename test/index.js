var d2 = require('../');

var sourceData ={
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

var  query = {
    smaple: "."
};

var result = d2(query, sourceData);
console.log('result:',result);