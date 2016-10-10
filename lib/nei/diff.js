/*
 * diff 两个 JSON 对象
 * @author huntbao
 */

'use strict';
let util = require('util');
let querystring = require('querystring');
let EventEmitter = require('events');
let _io = require('../util/io');
let _fs = require('../util/file');
let _util = require('../util/util');
let logger = require('../util/logger');

class Diff extends EventEmitter {
    /**
     * @param  {object} config - 配置参数
     * @param  {object} ds - nei 数据源
     */
    constructor(config, ds) {
        super();
        this.config = config;
        this.ds = ds;
        this.datatypeChanged= false;
        this.interfaceChanged = false;
        this.check();
    }

    /**
     * 查找本地是否已经有缓存的数据
     */
    check() {
        let config = this.config;
        let ds = this.ds;
        let jsonFile = `${this.config.neiConfigRoot}json/nei-latest.json`;
        let oldData = {};
        if (_fs.exist(jsonFile)) {
            oldData = _util.file2json(jsonFile);
        }
        let time = _util.getFormatTime('%s-%s-%s-%s-%s-%s-%s');
        let filePrefix = `${this.config.neiConfigRoot}json/nei-${time}`;
        if (Object.keys(oldData).length) {
            let diffResult = this.diff(oldData, ds);
            if (diffResult.length) {
                let sep = '-'.repeat(50);
                this.output(`${filePrefix}-diff.txt`, diffResult.join(`\n${sep}\n`));
            }
        }
        let file = filePrefix + '.json';
        let outputContent = JSON.stringify(ds, null, '\t');
        this.output(file, outputContent);
        // 更新 latest 文件
        this.output(jsonFile, outputContent);
    }

    /**
     * 比较两个 json 对象
     * @param  {object} oldData - 旧数据
     * @param  {object} newData - 新数据
     * @return {Array} diffResult - 比较的结果信息
     */
    diff(oldData, newData) {
        // 要检查的项
        let checkKeys = {
            'project': '项目基本信息',
            'templates': '页面模板',
            'datatypes': '数据模型',
            'pages': '页面',
            'interfaces': '异步接口',
            'constraints': '约束函数',
            'groups': '业务分组',
            'cliargs': '命令行参数',
            'spec.spec': '规范',
            'spec.docs': '规范的文档',
            'spec.varmaps': '规范的变量映射'
        }
        // 先处理规范属性
        oldData.spec = oldData.specs[0];
        newData.spec = newData.specs[0];
        let diffResult = [];
        Object.keys(checkKeys).forEach((key) => {
            let oldValue = this.getDeepValue(key, oldData);
            let newValue = this.getDeepValue(key, newData);
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                // 设置更新标记
                this[`${key}Updated`] = true;
                diffResult.push(checkKeys[key] + '有更新');
                switch (key) {
                    case 'datatypes':
                        this.diffDatatypes(oldData[key], newData[key], diffResult);
                        break;
                    case 'interfaces':
                        this.diffInterfaces(oldData[key], newData[key], diffResult);
                        break;
                }
            }
        });
        return diffResult;
    }

    /**
     * 根据 key, 获取对象的值, key 支持多级, 以点号分隔
     * @param {string} key - key 的名称
     * @param {object} obj - 对象
     * @param {object} - 值
     */
    getDeepValue(key, obj) {
        var keys = key.split('.');
        var value = obj[keys[0]];
        var k;
        keys.shift();
        while (k = keys.shift()) {
            value = value ? value[k] : '';
        }
        return value;
    }

    /**
     * 比较两个数据模型列表, 要有增加、删除、更新的信息
     * @param {Array} oldList - 旧数据模型列表
     * @param {Array} newList - 新数据模型数据
     * @param {Array} diffResult - 比较的结果信息
     */
    diffDatatypes(oldList, newList, diffResult) {
        // 删除和更新的判断
        oldList.forEach((item) => {
            let found = newList.find((it) => {
                return it.id === item.id
            });
            if (found) {
                if (JSON.stringify(item) !== JSON.stringify(found)) {
                    let result = `数据模型【${item.name}】已更新`;
                    // 因为数据模型的参数是比较重要的信息, 所以再判断下参数有没有变化
                    if (JSON.stringify(item.params) !== JSON.stringify(found.params)) {
                        result += `: 参数有变化`;
                    }
                    this.datatypeChanged = true;
                    diffResult.push(result);
                }
            } else {
                this.datatypeChanged = true;
                diffResult.push(`数据模型【${item.name}】已被删除`);
            }
        });
        // 添加的判断
        newList.forEach((item) => {
            let found = oldList.find((it) => {
                return it.id === item.id
            });
            if (!found) {
                this.datatypeChanged = true;
                diffResult.push(`新增了数据模型:【${item.name}】`);
            }
        });
    }

    /**
     * 比较两个异步接口列表, 要有增加、删除、更新的信息
     * @param {Array} oldList - 旧异步接口列表
     * @param {Array} newList - 新异步接口数据
     * @param {Array} diffResult - 比较的结果信息
     */
    diffInterfaces(oldList, newList, diffResult) {
        // 删除和更新的判断
        oldList.forEach((item) => {
            let found = newList.find((it) => {
                return it.id === item.id
            });
            if (found) {
                if (JSON.stringify(item) !== JSON.stringify(found)) {
                    let result = `异步接口【${item.name}】已更新`;
                    // 因为异步接口的参数是比较重要的信息, 所以再判断下参数有没有变化
                    if (JSON.stringify(item.params.inputs) !== JSON.stringify(found.params.inputs)) {
                        result += `, 请求参数有变化`;
                    }
                    if (JSON.stringify(item.params.outputs) !== JSON.stringify(found.params.outputs)) {
                        result += `, 响应参数有变化`;
                    }
                    if (JSON.stringify(item.params.reqHeaders) !== JSON.stringify(found.params.reqHeaders)) {
                        result += `, 请求头参数有变化`;
                    }
                    if (JSON.stringify(item.params.resHeaders) !== JSON.stringify(found.params.resHeaders)) {
                        result += `, 响应头参数有变化`;
                    }
                    this.interfaceChanged = true;
                    diffResult.push(result);
                }
            } else {
                this.interfaceChanged = true;
                diffResult.push(`异步接口【${item.name}】已被删除`);
            }
        });
        // 添加的判断
        newList.forEach((item) => {
            let found = oldList.find((it) => {
                return it.id === item.id
            });
            if (!found) {
                this.interfaceChanged = true;
                diffResult.push(`新增了异步接口:【${item.name}】`);
            }
        });
    }

    /**
     * 同步写文件
     * @param  {string} file - 文件完整路径, 包括文件名
     * @param  {string} content - 文件内容
     */
    output(file, content) {
        _io.outputSync(file, content);
        logger.log('debug', {
            data: [file],
            message: '输出: %s'
        });
    }
}

module.exports = Diff;

