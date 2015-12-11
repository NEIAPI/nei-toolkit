//
//  {{type.name}}.java
//
//  Created by {{conf.author}} on {{conf.month}}/{{conf.day}}/{{conf.year}}.
//  Copyright © {{conf.year}} NetEase. All rights reserved.
//
//  Auto build by NEI Builder

package {{conf.aPkg}}.{{conf.htPkg}};

{% for pkg in req.pkgs -%}
import {{pkg}};
{% endfor %}
/**
 *  {{req.desc}}
 */
public class {{req.name}} extends BaseFileUploadHttpRequestTask {

    public {{req.name}}(
    {%- if req.inputs.length > 0 -%}
    {%- for input in req.inputs -%}
    {{input.whiteSpace}}File {{input.name}}{% if loop.last%}) {{'{'}}{% else %},{% endif %}{% if input.description %} // {{input.description}} {% endif %}
    {%- endfor %}{% else %}{{') {'}}{% endif %}
        super(HttpMethod.PUT, new HashMap<String, File>(), null);
        mBodyContentType = "multipart/form-data";
        mBoundary = "{{req.mBoundary}}";

        {% for input in req.inputs -%}
        mFiles.put("{{input.name}}", {{input.name}});{% if input.description %} // {{input.description}} {% endif %}
        {% endfor %}
        {% if req.hasHost %}
        @Override
        public String getUrl() {
        {%- else %}
        protected String getApi() {
        {%- endif %}
            return "{{req.path}}";
        }

        public Class getModelClass() {
            return {{req.outputModel}};
        }
    }
}
