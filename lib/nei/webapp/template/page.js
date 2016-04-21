/*
 * 页面入口模块实现文件
 *
 * Auto build by NEI Builder
 */
NEJ.define([
    'base/klass',
    'pro/widget/module'
],function(k,m,p,pro){
    /**
     * 页面模块实现类
     *
     * @class   _$$Module
     * @extends pro/widget/module._$$Module
     * @param  {Object} options - 模块输入参数
     */
    p._$$Module = k._$klass();
    pro = p._$$Module._$extend(m._$$Module);
    /**
     * 模块初始化
     * @private
     * @param  {Object} options - 输入参数信息
     * @return {Void}
     */
    pro.__init = function(options){
        this.__super(options);
        // TODO something if necessary
    };
    /**
     * 模块重置逻辑
     * @private
     * @param  {Object} options - 输入参数信息
     * @return {Void}
     */
    pro.__reset = function(options){
        this.__super(options);
        // TODO something if necessary
    };
    /**
     * 模块销毁逻辑
     * @private
     * @return {Void}
     */
    pro.__destroy = function(){
        this.__super();
        // TODO something if necessary
    };
});