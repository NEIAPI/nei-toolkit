/**
 * 后端异常与通用异常的关系映射
 * @author: june_01(hzxiejin@corp.netease.com)
 */
'use strict';

module.exports = {
    /**
     * 请求成功
     */
    'REQUEST_SUCCESS': 'REQUEST_SUCCESS',
    'CREATED': 'CREATED',
    'DELETED': 'DELETED',

    /**
     * 请求失败
     */
    'BAD_REQUEST': 'BAD_REQUEST',
    'UNAUTHORIZED': 'UNAUTHORIZED',
    'FORBIDDEN': 'FORBIDDEN',
    'NOT_FOUND': 'NOT_FOUND',
    'METHOD_NOT_ALLOWED': 'METHOD_NOT_ALLOWED',

    /**
     * 服务器异常
     */
    'SERVER_ERROR': 'SERVER_ERROR',

    /**
     * 登录注册失败
     */
    'LOGIN_FAILURE': 'LOGIN_FAILURE',
    'REG_FAILURE': 'REG_FAILURE'
};
