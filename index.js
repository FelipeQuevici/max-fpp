var walkSync = function (dir, filelist) {
    var path = path || require('path');
    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        } else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};

module.exports.walkSync = walkSync; 

require("./ffp.node")

module.exports.getFileProperties = ffp.getFileProperties;

var summatyPropsToCollect = {
    "Title": (val) => val,
    "Last Saved": (val) => val,
    "Keywords": (val) => val.replace(/\s/g, '').split(",").filter((el) => el.length != 0 ),
    "Created": (val) => val,
    "Author": (val) => val,
    "Comments": (val) => val,
    "Category": (val) => val
};
var docSumPropsToCollect = [
    "Category",
    '3ds Max Version',
    'Build',
    'Vertices',
    'Faces',
    'Objects',
    'Shapes',
    'Lights',
    'Cameras',
    'Helpers',
    'Space Warps',
    'Renderer Name'
];
var propsCat = {
    "Summary Info": function (summaryProperties) {
        var newProps = {};
        for (var prop in summaryProperties) {
            if (prop in summatyPropsToCollect) {
                newProps[prop] = summatyPropsToCollect[prop](summaryProperties[prop]);
            }
        }
        return newProps;
    },
    "Doc Summary Info": function (docSumaryProperties) {
        var newProps = {};
        for (var prop in docSumaryProperties) {
            if (docSumPropsToCollect.includes(prop)) {
                newProps[prop] = docSumaryProperties[prop];
            }
        }
        var docHeader = docSumaryProperties["DocHeaders"];
        var docParts = docSumaryProperties["DocParts"];
        var acc = 0;
        for (var i = 0; i < docHeader.length; i += 2) {
            var head = docHeader[i];
            var count = docHeader[i + 1];
            if (head == "General" || head == "Mesh Totals" || head == 'Scene Totals') {
                for (var j = acc; j < acc + count; j++) {
                    currentProp = docParts[j].split(":");
                    if (docSumPropsToCollect.includes(currentProp[0])) {
                        newProps[currentProp[0]] = currentProp[1];
                    }
                }
            } else if (head == "Render Data") {
                for (var j = acc; j < acc + count; j++) {
                    currentProp = docParts[j].split("=");
                    if (docSumPropsToCollect.includes(currentProp[0])) {
                        newProps[currentProp[0]] = currentProp[1];
                    }
                }
            } else if (head == "External Depencies") {
                newProps["External Depencies List"] = [];
                for (var j = acc; j < acc + count; j++) {
                    newProps["External Depencies List"].push(docParts[j]);
                }
            } else if (head == "Objects") {
                newProps["Objects List"] = [];
                for (var j = acc; j < acc + count; j++) {
                    newProps["Objects List"].push(docParts[j]);
                }
            } else if (head == "Materials") {
                newProps["Materials List"] = [];
                for (var j = acc; j < acc + count; j++) {
                    newProps["Materials List"].push(docParts[j]);
                }
            } else if (head == "Used Plug-Ins") {
                newProps["Used Plug-Ins List"] = [];
                for (var j = acc; j < acc + count; j++) {
                    newProps["Used Plug-Ins List"].push(docParts[j]);
                }
            }
            acc += count;
        }
        return newProps;
    },
    "Custom Properties": function (customProperties) {
        var newProps = customProperties;
        return newProps;
    }
};

function processProps(props) {
    if ("Error" in props) {
        return null;
    }

    var newProps = {};
    for (var propCat in propsCat) {
        newProps = { ...newProps, ...propsCat[propCat](props[propCat]) };
    }
    return newProps;
}

module.exports.processProps = processProps;