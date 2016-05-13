/*
 * page controller
 * @author {{author}}
 * Auto build by NEI Builder
 */

'use strict';

let BaseController = require('./base');

class PageController extends BaseController {
    {% for c in controllers %}
    {{c.controllerName}}(req, res, next) {
        res.render('{{c.view}}', {
            title: '{{c.title}}',
            description: '{{c.description}}'
        });
    }
    {% endfor %}
}

module.exports = new PageController;