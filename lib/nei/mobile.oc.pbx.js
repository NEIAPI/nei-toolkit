/*
 * update project.pbxproj file
 * @module   nei/mobile.oc.pbx
 * @author   huntbao
 */
var fs = require('fs');
var util = require('util');
var path = require('path');
var xcode = require('xcode');
var pbxFile = require('xcode/lib/pbxFile.js');

exports.update = function (projectName, projectPath) {
    var projectFilePath = projectPath + '.xcodeproj/project.pbxproj';
    var myProj = xcode.project(projectFilePath);
    myProj.parseSync();
    var pbxGroup = myProj.getPBXObject('PBXGroup');

    // 删除 group 里面的文件
    function removeGroupFiles(group) {
        group.children.forEach(function (file) {
            var uuid = file.value;
            // remove file reference from PBXFileReference
            removeFromPbxFileReferenceSectionWithKey(uuid);
            // 从 Build File Ref 中删除
            var buildFileUUID = removeFromPbxBuildFileSectionWithKey(uuid);
            // 从 Build Phase 中删除
            removeFromPbxSourcesBuildPhaseWithKey(buildFileUUID);
        });
        // 删除 groupChildren
        group.children = [];
    }

    // 根据 FileRef 的 UUID 从 Project 的 File Reference Section 中删除
    function removeFromPbxFileReferenceSectionWithKey(fileRef) {
        var pbxFileReference = myProj.pbxFileReferenceSection();
        delete pbxFileReference[fileRef];
        delete pbxFileReference[util.format('%s_comment', fileRef)];
    }

    // 根据 FileRef 的 UUID 从 Project 的 Build File Section 中删除
    function removeFromPbxBuildFileSectionWithKey(fileRef) {
        var pbxBuildFile = myProj.pbxBuildFileSection();
        for (var uuid in pbxBuildFile) {
            if (pbxBuildFile[uuid].fileRef === fileRef) {
                delete pbxBuildFile[uuid];
                break;
            }
        }
        delete pbxBuildFile[util.format('%s_comment', fileRef)]
    }

    // 根据 FileRef 的 UUID 从 Project 的 Source Build Phase Section 中删除
    function removeFromPbxSourcesBuildPhaseWithKey(fileRef) {
        var pbxSourcesBuildPhase = myProj.getPBXObject('PBXSourcesBuildPhase');
        Object.keys(pbxSourcesBuildPhase).forEach(function (phaseId) {
            var phase = pbxSourcesBuildPhase[phaseId];
            if (!Array.isArray(phase.files)) return;
            for (var i = 0, l = phase.files.length; i < l; i++) {
                if (phase.files[i].value === fileRef) {
                    phase.files.splice(i, 1);
                    break;
                }
            }
        });
    }

    function getPBXGroupByPath(isRoot, path, group) {
        var foundGroup = null;
        var foundGroupKey = null;
        if (isRoot) {
            Object.keys(pbxGroup).forEach(function (pgk) {
                var pg = pbxGroup[pgk];
                if (pg.path === path) {
                    foundGroup = pg;
                    foundGroupKey = pgk;
                }
            });
        } else if (Array.isArray(group.children)) {
            group.children.forEach(function (cg) {
                var tempGroup = pbxGroup[cg.value];
                if (tempGroup && tempGroup.path === path) {
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

    function createPBXGroupByFullPath(path) {
        var groupPaths = path.split('/');
        var group;
        var groupKey;
        var groupItem;
        var groupPath = groupPaths.shift();
        var isRoot = true;
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
            var parentKey = groupKey;
            // 依次创建不存在的路径
            while (groupPath) {
                groupKey = myProj.pbxCreateGroup(groupPath, groupPath);
                myProj.addToPbxGroup(groupKey, parentKey, {});
                groupItem = getPBXGroupByPath(isRoot, groupPath, group);
                groupPath = groupPaths.shift();
                parentKey = groupItem.key;
                group = groupItem.group;
            }
        } else {
            // 路径已经存在，删除最后一个组
            removeGroupFiles(group);
        }
        // 返回最后一个 group 的 key
        return groupKey;
    }

    function addResourceFile(path, groupKey) {
        var file = new pbxFile(path);
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
        var list = fs.readdirSync(dir);
        // empty dir
        if (!list || !list.length) {
            return;
        }
        // read dir recursive
        list.forEach(function (name) {
            var next = normalize(dir + name);
            if (isDir(next + '/')) {
                if (name === 'Assets.xcassets') {
                    addFile(name, next);
                } else {
                    walk(next + '/');
                }
            } else {
                addFile(name, next);
            }
        }, this);
    }

    var groupKeys = {};
    function addFile(fileName, filePath) {
        var extName = path.extname(fileName);
        if (!extName) return;
        var groupName = projectName + '/' + filePath.replace(new RegExp(projectPath + '/'), '');
        var dirName = path.dirname(groupName);
        var groupKey = groupKeys[dirName];
        if (!groupKey) {
            groupKey = createPBXGroupByFullPath(dirName);
            groupKeys[dirName] = groupKey;
        }
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

    walk(projectPath);

    // 将内容写回到工程文件中
    fs.writeFileSync(projectFilePath, myProj.writeSync());
    console.log('Project ' + projectPath + ' is updated successfully !');

}
