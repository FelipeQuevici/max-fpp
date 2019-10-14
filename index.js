/* eslint-disable no-restricted-syntax */
/* eslint-disable global-require */
const walkSync = (dir, filelist) => {
  const path = path || require('path');
  const fs = fs || require('fs');
  const files = fs.readdirSync(dir);
  let newFilelist = filelist || [];
  files.forEach(file => {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      newFilelist = walkSync(path.join(dir, file), filelist);
    } else {
      newFilelist.push(path.join(dir, file));
    }
  });
  return newFilelist;
};

module.exports.walkSync = walkSync;

const ffp = require('./ffp.node');

module.exports.getFileProperties = ffp.getFileProperties;

const summatyPropsToCollect = {
  Title: val => val,
  'Last Saved': val => val,
  Keywords: val =>
    val
      .replace(/\s/g, '')
      .split(',')
      .filter(el => el.length !== 0),
  Created: val => val,
  Author: val => val,
  Comments: val => val,
  Category: val => val
};
const docSumPropsToCollect = [
  'Category',
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
const propsCat = {
  'Summary Info': summaryProperties => {
    const newProps = {};
    for (const prop in summaryProperties) {
      if (prop in summatyPropsToCollect) {
        newProps[prop] = summatyPropsToCollect[prop](summaryProperties[prop]);
      }
    }
    return newProps;
  },
  'Doc Summary Info': docSumaryProperties => {
    const newProps = {};
    for (const prop in docSumaryProperties) {
      if (docSumPropsToCollect.includes(prop)) {
        newProps[prop] = docSumaryProperties[prop];
      }
    }
    const docHeader = docSumaryProperties.DocHeaders;
    const docParts = docSumaryProperties.DocParts;
    let acc = 0;
    for (let i = 0; i < docHeader.length; i += 2) {
      const head = docHeader[i];
      const count = docHeader[i + 1];
      if (
        head === 'General' ||
        head === 'Mesh Totals' ||
        head === 'Scene Totals'
      ) {
        for (let j = acc; j < acc + count; j += 1) {
          const [currentPropName, currentPropValue] = docParts[j].split('=');
          if (docSumPropsToCollect.includes(currentPropName)) {
            newProps[currentPropName] = currentPropValue;
          }
        }
      } else if (head === 'Render Data') {
        for (let j = acc; j < acc + count; j += 1) {
          const [currentPropName, currentPropValue] = docParts[j].split('=');
          if (docSumPropsToCollect.includes(currentPropName)) {
            newProps[currentPropName] = currentPropValue;
          }
        }
      } else if (head === 'External Depencies') {
        newProps['External Depencies List'] = [];
        for (let j = acc; j < acc + count; j += 1) {
          newProps['External Depencies List'].push(docParts[j]);
        }
      } else if (head === 'Objects') {
        newProps['Objects List'] = [];
        for (let j = acc; j < acc + count; j += 1) {
          newProps['Objects List'].push(docParts[j]);
        }
      } else if (head === 'Materials') {
        newProps['Materials List'] = [];
        for (let j = acc; j < acc + count; j += 1) {
          newProps['Materials List'].push(docParts[j]);
        }
      } else if (head === 'Used Plug-Ins') {
        newProps['Used Plug-Ins List'] = [];
        for (let j = acc; j < acc + count; j += 1) {
          newProps['Used Plug-Ins List'].push(docParts[j]);
        }
      }
      acc += count;
    }
    return newProps;
  },
  'Custom Properties': customProperties => {
    const newProps = customProperties;
    return newProps;
  }
};

function processProps(props) {
  if ('Error' in props) {
    return null;
  }

  let newProps = {};
  for (const propCat in propsCat) {
      if (Object.prototype.hasOwnProperty.call(propsCat,propCat)) {
          const propFunc = propsCat[propCat];
          newProps = { ...newProps, ...propFunc(props[propCat]) };
      }
  }

  return newProps;
}

module.exports.processProps = processProps;
