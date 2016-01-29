/*
 * update project.pbxproj file
 * @module   nei/mobile.oc.pbx
 * @author   huntbao
 */
'use strict';
let fs = require('fs');
let util = require('util');
let path = require('path');
let xcode = require('xcode');
let pbxFile = require('xcode/lib/pbxFile.js');
let logger = require('../util/logger');

exports.update = function (projectName, projectPath, updateResPath) {
    let projectFilePath = projectPath + '.xcodeproj/project.pbxproj';
    let myProj = xcode.project(projectFilePath);
    myProj.parseSync();
    let pbxGroup = myProj.getPBXObject('PBXGroup');

    // 删除 group 里面的文件
    function removeGroupFiles(group) {
        group.children.forEach(function (file) {
            let uuid = file.value;
            // remove file reference from PBXFileReference
            removeFromPbxFileReferenceSectionWithKey(uuid);
            // 从 Build File Ref 中删除
            let buildFileUUID = removeFromPbxBuildFileSectionWithKey(uuid);
            // 从 Build Phase 中删除
            removeFromPbxSourcesBuildPhaseWithKey(buildFileUUID);
        });
        // 删除 groupChildren
        group.children = [];
    }

    // 根据 FileRef 的 UUID 从 Project 的 File Reference Section 中删除
    function removeFromPbxFileReferenceSectionWithKey(fileRef) {
        let pbxFileReference = myProj.pbxFileReferenceSection();
        delete pbxFileReference[fileRef];
        delete pbxFileReference[util.format('%s_comment', fileRef)];
    }

    // 根据 FileRef 的 UUID 从 Project 的 Build File Section 中删除
    function removeFromPbxBuildFileSectionWithKey(fileRef) {
        let buildFileUUID;
        let pbxBuildFile = myProj.pbxBuildFileSection();
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
    function removeFromPbxSourcesBuildPhaseWithKey(fileRef) {
        let pbxSourcesBuildPhase = myProj.getPBXObject('PBXSourcesBuildPhase');
        Object.keys(pbxSourcesBuildPhase).forEach(function (phaseId) {
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

    function trimDoubleQuote(str) {
        return str.replace(/"/g, '');
    }

    function getPBXGroupByPath(isRoot, path, group) {
        let foundGroup = null;
        let foundGroupKey = null;
        if (isRoot) {
            Object.keys(pbxGroup).forEach(function (pgk) {
                let pg = pbxGroup[pgk];
                // ignore double quote when compare path
                if (pg.path && trimDoubleQuote(pg.path) === trimDoubleQuote(path)) {
                    foundGroup = pg;
                    foundGroupKey = pgk;
                }
            });
        } else if (Array.isArray(group.children)) {
            group.children.forEach(function (cg) {
                let tempGroup = pbxGroup[cg.value];
                // ignore double quote when compare path
                if (tempGroup && tempGroup.path && trimDoubleQuote(tempGroup.path) === trimDoubleQuote(path)) {
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

    function createPBXGroupByFullPath(path, removeExist) {
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
        let isRoot = true;
        while (groupPath) {
            groupItem = getPBXGroupByPath(isRoot, groupPath, group);
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
                groupKey = myProj.pbxCreateGroup(groupPath, groupPath);
                myProj.addToPbxGroup(groupKey, parentKey, {});
                groupItem = getPBXGroupByPath(isRoot, groupPath, group);
                groupPath = groupPaths.shift();
                parentKey = groupItem.key;
                group = groupItem.group;
            }
        } else if (removeExist) {
            // 路径已经存在，删除最后一个组
            removeGroupFiles(group);
        }
        // 返回最后一个 group 的 key
        return groupKey;
    }

    function addResourceFile(path, groupKey) {
        let file = new pbxFile(path);
        if (myProj.hasFile(file.path)) return false;
        file.uuid = myProj.generateUuid();
        file.target = undefined;
        file.fileRef = myProj.generateUuid();
        myProj.addToPbxBuildFileSection(file);
        myProj.addToPbxResourcesBuildPhase(file);
        myProj.addToPbxFileReferenceSection(file);
        myProj.addToPbxGroup(file, groupKey);
    }

    function exist(file) {
        file = (file || '').split(/[?#]/)[0];
        return (fs.existsSync || path.existsSync)(file);
    }

    function normalize(filePath) {
        filePath = path.normalize(filePath || './').replace(/[\\/]+/g, '/');
        // fix http:/a.b.com -> http://a.b.com
        return filePath.replace(/^(https|http|ftp|mailto|file):\//i, '$1://');
    }

    function isDir(dir) {
        try {
            return fs.lstatSync(dir).isDirectory();
        } catch (ex) {
            return false;
        }
    }

    //let groupKeys = {};
    // 遍历目录，添加文件
    function walk(dir) {
        // format dir
        if (!/\/$/.test(dir)) {
            dir += '/';
        }
        // check dir
        if (!exist(dir)) {
            return;
        }
        let list = fs.readdirSync(dir);
        // empty dir
        if (!list || !list.length) {
            return;
        }
        // read dir recursive
        list.forEach(function (name) {
            let next = normalize(dir + name);
            // treat `Assets.xcassets` as normal file
            if (name !== 'Assets.xcassets' && isDir(next + '/')) {
                let dirName = projectName + '/' + next.replace(new RegExp(projectPath + '/'), '');
                let groupKey = createPBXGroupByFullPath(dirName);
                if (name === 'Assets.xcassets') {
                    addFile(name, groupKey);
                } else {
                    walk(next + '/');
                }
            } else {
                let groupName = projectName + '/' + next.replace(new RegExp(projectPath + '/'), '');
                let dirName = path.dirname(groupName);
                let groupKey = createPBXGroupByFullPath(dirName);
                addFile(name, groupKey);
            }
        }, this);
    }

    function addFile(fileName, groupKey) {
        let extName = path.extname(fileName);
        if (!extName) return;
        if (extName === '.h') {
            // 将头文件添加到group中
            myProj.addHeaderFile(fileName, {}, groupKey);
        } else if (extName === '.m') {
            // 将源文件添加到group中
            myProj.addSourceFile(fileName, {}, groupKey);
        } else if (fileName === 'Assets.xcassets' || /^\.(storyboard|xib)$/.test(extName)) {
            addResourceFile(fileName, groupKey);
        } else {
            myProj.addFile(fileName, groupKey);
        }
    }

    // 可以指定更新哪个文件夹，如果不指定，则更新项目根路径
    if (updateResPath) {
        // 只更新 models 和 requests
        let dirPath = updateResPath + 'Models/';
        createPBXGroupByFullPath(dirPath.replace(new RegExp(projectPath + '/'), ''), true);
        walk(dirPath);
        dirPath = updateResPath + 'Requests/';
        createPBXGroupByFullPath(dirPath.replace(new RegExp(projectPath + '/'), ''), true);
        walk(dirPath);
    } else {
        walk(projectPath);
    }

    // 将内容写回到工程文件中
    fs.writeFileSync(projectFilePath, myProj.writeSync());
    logger.log('debug', {
        message: `Project ${projectPath} is updated successfully !`
    })
};
