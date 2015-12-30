/*
 * update project.pbxproj file
 * @module   nei/mobile.oc.pbx
 * @author   huntbao
 */
var fs = require('fs');
var util = require('util');
var path = require('path');
var xcode = require('xcode');

exports.update = function (projectName, projectPath) {
    var projectFilePath = projectPath + '.xcodeproj/project.pbxproj';
    var myProj = xcode.project(projectFilePath);
    myProj.parseSync();
    var pbxGroup = myProj.getPBXObject('PBXGroup');

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
            isRoot = false;
            if (!groupItem.group) {
                break;
            }
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

    // 固定添加Models和Requests, 不需要参数配置
    var autoGroupNames = ['Models', 'Requests'];
    autoGroupNames.forEach(function (groupName) {
        var groupFullPath = projectName + '/Network/' + groupName;
        var groupKey = createPBXGroupByFullPath(groupFullPath);

        // 获取目录下的所有头文件和源文件
        var folderPath = projectPath + '/Network/' + groupName;
        var files = getFiles(folderPath);
        var headerFiles = files.headerFiles;
        var sourceFiles = files.sourceFiles;

        // 将头文件添加到group中.
        headerFiles.forEach(function (headerFile) {
            myProj.addHeaderFile(headerFile, {}, groupKey);
        });

        // 将源文件添加到group中
        sourceFiles.forEach(function (sourceFile) {
            myProj.addSourceFile(sourceFile, {}, groupKey);
        });

        console.log("Add Source Files and Header Files from Path " + folderPath + " to group " + groupFullPath + " successfully");
    });

    // 将内容写回到工程文件中.
    fs.writeFileSync(projectFilePath, myProj.writeSync());
    console.log('Project ' + projectPath + ' is updated successfully !');

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

    // 找到所有的头文件和源文件
    function getFiles(dir) {
        var result = {
            headerFiles: [],
            sourceFiles: []
        }
        var files = fs.readdirSync(dir);
        files.forEach(function (file) {
            var extName = path.extname(file);
            if ('.h' === extName) {
                result.headerFiles.push(file);
            } else if ('.m' === extName) {
                result.sourceFiles.push(file);
            }
        });
        return result;
    }
}
