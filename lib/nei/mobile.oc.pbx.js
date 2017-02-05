/*
 * update project.pbxproj file
 * @module   nei/mobile.oc.pbx
 * @author   huntbao
 * @author   AbnerZheng
 */
'use strict';
let fs = require('fs');
let util = require('util');
let path = require('path');
let xcode = require('xcode');
let pbxFile = require('xcode/lib/pbxFile');
let logger = require('../util/logger');

class PbxProj {
  constructor(projectName, projectPath, projectFilePath) {
    this.projectName = projectName;
    this.projectPath = projectPath;
    this.projectFilePath = projectFilePath;
    this.myProj = xcode.project(this.projectFilePath);
    this.myProj.parseSync();
    this.pbxGroup = this.myProj.getPBXObject('PBXGroup');
  }

  removeGroupFiles(group) {
    group.children.forEach((file) => {
      let uuid = file.value;
      // remove file reference from PBXFileReference
      this.removeFromPbxFileReferenceSectionWithKey(uuid);
      // 从 Build File Ref 中删除
      let buildFileUUID = this.removeFromPbxBuildFileSectionWithKey(uuid);
      // 从 Build Phase 中删除
      this.removeFromPbxSourcesBuildPhaseWithKey(buildFileUUID);
    });
    // 删除 groupChildren
    group.children = [];
  }

  // 根据 FileRef 的 UUID 从 Project 的 File Reference Section 中删除
  removeFromPbxFileReferenceSectionWithKey(fileRef) {
    let pbxFileReference = this.myProj.pbxFileReferenceSection();
    delete pbxFileReference[fileRef];
    delete pbxFileReference[util.format('%s_comment', fileRef)];
  }

  // 根据 FileRef 的 UUID 从 Project 的 Build File Section 中删除
  removeFromPbxBuildFileSectionWithKey(fileRef) {
    let buildFileUUID;
    let pbxBuildFile = this.myProj.pbxBuildFileSection();
    for (let uuid in pbxBuildFile) {
      if (pbxBuildFile[uuid].fileRef === fileRef) {
        buildFileUUID = uuid;
        delete pbxBuildFile[uuid];
        break;
      }
    }
    delete pbxBuildFile[util.format('%s_comment', fileRef)];
    return buildFileUUID;
  }

  // 根据 FileRef 的 UUID 从 Project 的 Source Build Phase Section 中删除
  removeFromPbxSourcesBuildPhaseWithKey(fileRef) {
    let pbxSourcesBuildPhase = this.myProj.getPBXObject('PBXSourcesBuildPhase');
    Object.keys(pbxSourcesBuildPhase).forEach((phaseId) => {
      let phase = pbxSourcesBuildPhase[phaseId];
      if (!Array.isArray(phase.files)) return;
      for (let i = 0, l = phase.files.length; i < l; i++) {
        if (phase.files[i].value === fileRef) {
          phase.files.splice(i, 1);
          break;
        }
      }
    });
  }

  trimDoubleQuote(str) {
    return str.replace(/"/g, '');
  }

  getPBXGroupByPath(isRoot, path, group) {
    let foundGroup = null;
    let foundGroupKey = null;
    if (isRoot) {
      Object.keys(this.pbxGroup).forEach((pgk) => {
        let pg = this.pbxGroup[pgk];
        // ignore double quote when compare path
        if (pg.path && this.trimDoubleQuote(pg.path) === this.trimDoubleQuote(path)) {
          foundGroup = pg;
          foundGroupKey = pgk;
        }
      });
    } else if (Array.isArray(group.children)) {
      group.children.forEach((cg) => {
        let tempGroup = this.pbxGroup[cg.value];
        // ignore double quote when compare path
        if (tempGroup && tempGroup.path && this.trimDoubleQuote(tempGroup.path) === this.trimDoubleQuote(path)) {
          foundGroup = tempGroup;
          foundGroupKey = cg.value;
        }
      });
    }

    return {
      group: foundGroup,
      key: foundGroupKey
    };
  }

  createPBXGroupByFullPath(path, removeExist) {
    let groupPaths = path.split('/');
    groupPaths = groupPaths.map((groupPath) => {
      if (groupPath.indexOf(' ') !== -1) {
        return `"${groupPath}"`;
      }
      return groupPath;
    });
    let group;
    let groupKey;
    let groupItem;
    let groupPath = groupPaths.shift();
    if(groupPath === ''){
      groupPath = groupPaths.shift();
    }
    let isRoot = true;
    while (groupPath) {
      groupItem = this.getPBXGroupByPath(isRoot, groupPath, group);
      if (!groupItem.group) {
        break;
      }
      isRoot = false;
      groupPath = groupPaths.shift();
      group = groupItem.group;
      groupKey = groupItem.key;
    }
    if (groupPath) {
      // 路径不存在
      let parentKey = groupKey;
      // 依次创建不存在的路径
      while (groupPath) {
        groupKey = this.myProj.pbxCreateGroup(groupPath, groupPath);
        this.myProj.addToPbxGroup(groupKey, parentKey, {});
        groupItem = this.getPBXGroupByPath(isRoot, groupPath, group);
        groupPath = groupPaths.shift();
        parentKey = groupItem.key;
        group = groupItem.group;
      }
    } else if (removeExist) {
      // 路径已经存在，删除最后一个组
      this.removeGroupFiles(group);
    }
    // 返回最后一个 group 的 key
    return groupKey;
  }

  addResourceFile(path, groupKey) {
    let file = new pbxFile(path);
    if (this.myProj.hasFile(file.path)) return false;
    file.uuid = this.myProj.generateUuid();
    file.target = undefined;
    file.fileRef = this.myProj.generateUuid();
    this.myProj.addToPbxBuildFileSection(file);
    this.myProj.addToPbxResourcesBuildPhase(file);
    this.myProj.addToPbxFileReferenceSection(file);
    this.myProj.addToPbxGroup(file, groupKey);
  }

  exist(file) {
    file = (file || '').split(/[?#]/)[0];
    return (fs.existsSync || path.existsSync)(file);
  }

  normalize(filePath) {
    filePath = path.normalize(filePath || './').replace(/[\\/]+/g, '/');
    // fix http:/a.b.com -> http://a.b.com
    return filePath.replace(/^(https|http|ftp|mailto|file):\//i, '$1://');
  }

  isDir(dir) {
    try {
      return fs.lstatSync(dir).isDirectory();
    } catch (ex) {
      return false;
    }
  }

  //let groupKeys = {};
  // 遍历目录，添加文件
  walk(dir) {
    // format dir
    if (!/\/$/.test(dir)) {
      dir += '/';
    }
    // check dir
    if (!this.exist(dir)) {
      return;
    }
    let list = fs.readdirSync(dir);
    // empty dir
    if (!list || !list.length) {
      return;
    }
    // read dir recursive
    list.forEach((name) => {
      let next = this.normalize(dir + name);
      // treat `Assets.xcassets` as normal file
      if (name !== 'Assets.xcassets' && this.isDir(next + '/')) {
        let dirName = this.projectName + '/' + next.replace(new RegExp(this.projectPath + '/'), '');
        let groupKey = this.createPBXGroupByFullPath(dirName);
        if (name === 'Assets.xcassets') {
          this.addFile(name, groupKey);
        } else {
          this.walk(next + '/');
        }
      } else {
        let groupName = this.projectName + '/' + next.replace(new RegExp(this.projectPath + '/'), '');
        let dirName = path.dirname(groupName);
        let groupKey = this.createPBXGroupByFullPath(dirName);
        this.addFile(name, groupKey);
      }
    });
  }

  addFile(fileName, groupKey) {
    let extName = path.extname(fileName);
    if (!extName) return;
    if (extName === '.h') {
      // 将头文件添加到group中
      this.myProj.addHeaderFile(fileName, {}, groupKey);
    } else if (extName === '.m') {
      // 将源文件添加到group中
      this.myProj.addSourceFile(fileName, {}, groupKey);
    } else if (fileName === 'Assets.xcassets' || /^\.(storyboard|xib)$/.test(extName)) {
      this.addResourceFile(fileName, groupKey);
    } else {
      this.myProj.addFile(fileName, groupKey);
    }
  }

  update(updateResPaths) {
    // 可以指定更新哪个文件夹，如果不指定，则更新项目根路径
    if (updateResPaths) {
      // 只更新 models 和 requests
      updateResPaths.forEach(dirPath=>{
        this.createPBXGroupByFullPath(dirPath.replace(new RegExp(this.projectPath + '/'), ''), true);
        this.walk(dirPath);
      });
    } else {
      logger.log('debug', {
        message: `未生成Model和Request文件，无需更新`
      });
      return;
    }
    // 将内容写回到工程文件中
    fs.writeFileSync(this.projectFilePath, this.myProj.writeSync());
    logger.log('debug', {
      message: `Project ${this.projectPath} is updated successfully !`
    });
  }

}

module.exports = PbxProj;

